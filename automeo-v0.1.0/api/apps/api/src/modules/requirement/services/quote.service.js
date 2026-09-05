"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuoteService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const client_1 = require("@prisma/client");
/**
 * 报价服务
 * 计算工时成本 + Token成本 + 算力成本 + 其他5%管理开销
 * 报价 = 总成本 × (1 + 利润率) × 加急系数
 */
let QuoteService = class QuoteService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger('QuoteService');
        this.MANAGEMENT_OVERHEAD_RATE = 0.05; // 5% 管理开销
    }
    /**
     * 获取所有报价规则
     */
    async findAllRules() {
        return this.prisma.quoteRule.findMany({
            orderBy: [{ is_default: 'desc' }, { created_at: 'asc' }],
        });
    }
    /**
     * 获取默认报价规则
     */
    async getDefaultRule() {
        const rule = await this.prisma.quoteRule.findFirst({
            where: { is_default: true },
        });
        if (!rule) {
            // 如果没有默认规则，取第一条
            const first = await this.prisma.quoteRule.findFirst();
            if (first)
                return first;
            // 创建默认规则
            return this.prisma.quoteRule.create({
                data: {
                    name: '默认报价规则',
                    hourly_rate: new client_1.Prisma.Decimal(150),
                    complexity_coefficients: { low: 0.8, medium: 1.0, high: 1.5 },
                    profit_margin: new client_1.Prisma.Decimal(0.3),
                    urgency_coefficient: new client_1.Prisma.Decimal(1.0),
                    token_input_price: new client_1.Prisma.Decimal(0.008),
                    token_output_price: new client_1.Prisma.Decimal(0.02),
                    is_default: true,
                },
            });
        }
        return rule;
    }
    /**
     * 更新报价规则
     */
    async updateRule(id, dto) {
        const rule = await this.prisma.quoteRule.findUnique({ where: { id } });
        if (!rule) {
            throw new common_1.NotFoundException('报价规则不存在');
        }
        // 如果设置为默认，取消其他规则的默认状态
        if (dto.is_default) {
            await this.prisma.quoteRule.updateMany({
                where: { is_default: true },
                data: { is_default: false },
            });
        }
        return this.prisma.quoteRule.update({
            where: { id },
            data: {
                name: dto.name,
                hourly_rate: dto.hourly_rate !== undefined ? new client_1.Prisma.Decimal(dto.hourly_rate) : undefined,
                complexity_coefficients: dto.complexity_coefficients,
                profit_margin: dto.profit_margin !== undefined ? new client_1.Prisma.Decimal(dto.profit_margin) : undefined,
                urgency_coefficient: dto.urgency_coefficient !== undefined ? new client_1.Prisma.Decimal(dto.urgency_coefficient) : undefined,
                token_input_price: dto.token_input_price !== undefined ? new client_1.Prisma.Decimal(dto.token_input_price) : undefined,
                token_output_price: dto.token_output_price !== undefined ? new client_1.Prisma.Decimal(dto.token_output_price) : undefined,
                is_default: dto.is_default,
            },
        });
    }
    /**
     * 计算需求报价
     */
    async calculate(requirementId, ruleId) {
        const requirement = await this.prisma.requirement.findUnique({
            where: { id: requirementId },
            include: { items: true },
        });
        if (!requirement) {
            throw new common_1.NotFoundException('需求不存在');
        }
        const rule = ruleId
            ? await this.prisma.quoteRule.findUnique({ where: { id: ruleId } })
            : await this.getDefaultRule();
        if (!rule) {
            throw new common_1.NotFoundException('报价规则不存在');
        }
        const hourlyRate = rule.hourly_rate.toNumber();
        const coefficients = rule.complexity_coefficients || { low: 0.8, medium: 1.0, high: 1.5 };
        const profitMargin = rule.profit_margin.toNumber();
        const urgencyCoeff = rule.urgency_coefficient.toNumber();
        const tokenInputPrice = rule.token_input_price.toNumber();
        const tokenOutputPrice = rule.token_output_price.toNumber();
        // 1. 工时成本（按复杂度系数加权）
        const items = [];
        let totalWeightedHours = 0;
        for (const item of requirement.items) {
            const baseHours = item.estimated_hours.toNumber();
            const coeff = coefficients[item.complexity] || 1.0;
            const weightedHours = baseHours * coeff;
            const subtotal = weightedHours * hourlyRate;
            totalWeightedHours += weightedHours;
            items.push({
                module: item.name,
                hours: baseHours,
                hourly_rate: hourlyRate * coeff,
                subtotal: Math.round(subtotal * 100) / 100,
            });
        }
        const laborCost = Math.round(totalWeightedHours * hourlyRate * 100) / 100;
        // 2. Token 成本估算（按工时比例估算 AI 辅助开发的 token 消耗）
        const estimatedInputTokens = Math.round(totalWeightedHours * 500); // 每小时约500 input tokens
        const estimatedOutputTokens = Math.round(totalWeightedHours * 200); // 每小时约200 output tokens
        const tokenCost = Math.round((estimatedInputTokens * tokenInputPrice + estimatedOutputTokens * tokenOutputPrice) * 100) / 100;
        // 3. 算力成本（按工时的15%估算）
        const computeCost = Math.round(laborCost * 0.15 * 100) / 100;
        // 4. 其他成本（5%管理开销）
        const subtotalCost = laborCost + tokenCost + computeCost;
        const otherCost = Math.round(subtotalCost * this.MANAGEMENT_OVERHEAD_RATE * 100) / 100;
        // 5. 总成本
        const totalCost = Math.round((subtotalCost + otherCost) * 100) / 100;
        // 6. 利润
        const profit = Math.round(totalCost * profitMargin * 100) / 100;
        // 7. 最终报价 = (总成本 + 利润) × 加急系数
        const finalPrice = Math.round((totalCost + profit) * urgencyCoeff * 100) / 100;
        const breakdown = {
            labor_cost: laborCost,
            token_cost: tokenCost,
            compute_cost: computeCost,
            other_cost: otherCost,
            total_cost: totalCost,
            profit,
            final_price: finalPrice,
            items,
        };
        // 保存报价到需求
        await this.prisma.requirement.update({
            where: { id: requirementId },
            data: {
                quoted_price: new client_1.Prisma.Decimal(finalPrice),
                cost_estimate: new client_1.Prisma.Decimal(totalCost),
            },
        });
        this.logger.log(`报价计算完成 requirement=${requirementId} final=¥${finalPrice} cost=¥${totalCost}`);
        return breakdown;
    }
    /**
     * 预览报价（不保存，用于规则配置页实时计算）
     */
    async previewQuote(dto) {
        const rule = dto.rule_id
            ? await this.prisma.quoteRule.findUnique({ where: { id: dto.rule_id } })
            : await this.getDefaultRule();
        if (!rule) {
            throw new common_1.NotFoundException('报价规则不存在');
        }
        const hourlyRate = rule.hourly_rate.toNumber();
        const coefficients = rule.complexity_coefficients || { low: 0.8, medium: 1.0, high: 1.5 };
        const profitMargin = rule.profit_margin.toNumber();
        const urgencyCoeff = dto.urgency_coefficient || rule.urgency_coefficient.toNumber();
        const tokenInputPrice = rule.token_input_price.toNumber();
        const tokenOutputPrice = rule.token_output_price.toNumber();
        const complexity = dto.complexity || 'medium';
        const coeff = coefficients[complexity] || 1.0;
        const weightedHours = dto.estimated_hours * coeff;
        const laborCost = Math.round(weightedHours * hourlyRate * 100) / 100;
        const inputTokens = dto.token_input_tokens || Math.round(weightedHours * 500);
        const outputTokens = dto.token_output_tokens || Math.round(weightedHours * 200);
        const tokenCost = Math.round((inputTokens * tokenInputPrice + outputTokens * tokenOutputPrice) * 100) / 100;
        const computeCost = Math.round(laborCost * 0.15 * 100) / 100;
        const subtotalCost = laborCost + tokenCost + computeCost;
        const otherCost = Math.round(subtotalCost * this.MANAGEMENT_OVERHEAD_RATE * 100) / 100;
        const totalCost = Math.round((subtotalCost + otherCost) * 100) / 100;
        const profit = Math.round(totalCost * profitMargin * 100) / 100;
        const finalPrice = Math.round((totalCost + profit) * urgencyCoeff * 100) / 100;
        return {
            labor_cost: laborCost,
            token_cost: tokenCost,
            compute_cost: computeCost,
            other_cost: otherCost,
            total_cost: totalCost,
            profit,
            final_price: finalPrice,
            items: [
                {
                    module: `预览项目 (${complexity})`,
                    hours: dto.estimated_hours,
                    hourly_rate: hourlyRate * coeff,
                    subtotal: laborCost,
                },
            ],
        };
    }
};
exports.QuoteService = QuoteService;
exports.QuoteService = QuoteService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], QuoteService);
//# sourceMappingURL=quote.service.js.map