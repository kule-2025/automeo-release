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
exports.TokenMeterService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
/**
 * Token计量服务 - 记录每次AI调用的Token消耗和成本
 */
let TokenMeterService = class TokenMeterService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger('TokenMeter');
    }
    /**
     * 计算Token成本
     */
    calculateCost(promptTokens, completionTokens) {
        const inputPrice = parseFloat(process.env.TOKEN_PRICE_INPUT || '0.008');
        const outputPrice = parseFloat(process.env.TOKEN_PRICE_OUTPUT || '0.02');
        return (promptTokens * inputPrice + completionTokens * outputPrice) / 1000;
    }
    /**
     * 记录Token消耗到数据库
     */
    async record(params) {
        const cost = this.calculateCost(params.prompt_tokens, params.completion_tokens);
        try {
            await this.prisma.tokenUsage.create({
                data: {
                    project_id: params.project_id,
                    task_id: params.task_id,
                    model: params.model,
                    task_type: params.task_type,
                    prompt_tokens: params.prompt_tokens,
                    completion_tokens: params.completion_tokens,
                    cost,
                },
            });
            this.logger.debug(`Token记录: model=${params.model} prompt=${params.prompt_tokens} completion=${params.completion_tokens} cost=¥${cost.toFixed(4)}`);
        }
        catch (e) {
            this.logger.warn(`Token记录失败: ${e.message}`);
        }
    }
    /**
     * 获取项目Token消耗汇总
     */
    async getProjectUsage(projectId) {
        try {
            const usages = await this.prisma.tokenUsage.findMany({
                where: { project_id: projectId },
            });
            const totalTokens = usages.reduce((sum, u) => sum + u.prompt_tokens + u.completion_tokens, 0);
            const totalCost = usages.reduce((sum, u) => sum + Number(u.cost), 0);
            const modelMap = new Map();
            for (const u of usages) {
                const existing = modelMap.get(u.model) || { tokens: 0, cost: 0 };
                existing.tokens += u.prompt_tokens + u.completion_tokens;
                existing.cost += Number(u.cost);
                modelMap.set(u.model, existing);
            }
            return {
                total_tokens: totalTokens,
                total_cost: totalCost,
                by_model: Array.from(modelMap.entries()).map(([model, v]) => ({ model, ...v })),
            };
        }
        catch {
            return { total_tokens: 0, total_cost: 0, by_model: [] };
        }
    }
};
exports.TokenMeterService = TokenMeterService;
exports.TokenMeterService = TokenMeterService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TokenMeterService);
//# sourceMappingURL=token-meter.service.js.map