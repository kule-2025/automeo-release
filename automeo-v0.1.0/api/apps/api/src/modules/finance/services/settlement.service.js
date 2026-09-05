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
exports.SettlementService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
let SettlementService = class SettlementService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger('SettlementService');
    }
    /**
     * 项目结算：收入=quoted_price, 成本=CostRecord汇总, 利润=收入-成本
     * 更新Project.revenue/cost/profit, 用户余额+=利润, 状态=已结算
     */
    async settle(projectId) {
        const project = await this.prisma.project.findUnique({
            where: { id: projectId },
            include: {
                requirement: { select: { quoted_price: true } },
                cost_records: { select: { amount: true } },
            },
        });
        if (!project) {
            throw new common_1.NotFoundException('项目不存在');
        }
        // 检查是否已结算
        const existing = await this.prisma.settlement.findFirst({
            where: { project_id: projectId, status: 'completed' },
        });
        if (existing) {
            throw new common_1.BadRequestException('该项目已结算');
        }
        // 收入 = 需求报价
        const revenue = project.requirement?.quoted_price
            ? Number(project.requirement.quoted_price)
            : Number(project.revenue);
        if (revenue <= 0) {
            throw new common_1.BadRequestException('项目收入为0，无法结算');
        }
        // 成本 = CostRecord汇总
        const cost = project.cost_records.reduce((sum, r) => Number((sum + Number(r.amount)).toFixed(2)), 0);
        // 利润 = 收入 - 成本
        const profit = Number((revenue - cost).toFixed(2));
        const profitMargin = revenue > 0 ? Number((profit / revenue).toFixed(4)) : 0;
        // 事务：创建结算单 + 更新项目 + 更新用户余额
        const result = await this.prisma.$transaction(async (tx) => {
            // 1. 查找已有结算记录，不存在则创建
            const existingSettlement = await tx.settlement.findFirst({
                where: { project_id: projectId },
            });
            const settlement = existingSettlement
                ? await tx.settlement.update({
                    where: { id: existingSettlement.id },
                    data: {
                        revenue,
                        cost,
                        profit,
                        profit_margin: profitMargin,
                        status: 'completed',
                        settled_at: new Date(),
                    },
                })
                : await tx.settlement.create({
                    data: {
                        project_id: projectId,
                        revenue,
                        cost,
                        profit,
                        profit_margin: profitMargin,
                        status: 'completed',
                        settled_at: new Date(),
                    },
                });
            // 2. 更新项目财务字段
            await tx.project.update({
                where: { id: projectId },
                data: {
                    revenue,
                    cost,
                    profit,
                    status: 'completed',
                    finished_at: new Date(),
                },
            });
            // 3. 用户余额 += 利润
            await tx.user.update({
                where: { id: project.user_id },
                data: {
                    balance: { increment: profit },
                    total_income: { increment: revenue },
                    total_expense: { increment: cost },
                },
            });
            // 4. 创建收入交易记录
            await tx.financeTransaction.create({
                data: {
                    user_id: project.user_id,
                    project_id: projectId,
                    type: 'project_income',
                    amount: revenue,
                    status: 'settled',
                    channel: 'settlement',
                    transaction_no: `STL${Date.now()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
                    remark: `项目「${project.name}」结算收入`,
                },
            });
            return settlement;
        });
        this.logger.log(`项目结算完成: projectId=${projectId}, 收入=${revenue}, 成本=${cost}, 利润=${profit}`);
        // 利润率<10%预警
        if (profitMargin < 0.1) {
            await this.prisma.alertEvent.create({
                data: {
                    module: 'finance',
                    level: 'warning',
                    message: `项目「${project.name}」利润率仅 ${(profitMargin * 100).toFixed(1)}%，低于10%预警线`,
                    status: 'pending',
                    detail_json: { project_id: projectId, profit_margin: profitMargin },
                },
            });
        }
        return {
            ...result,
            revenue: Number(result.revenue),
            cost: Number(result.cost),
            profit: Number(result.profit),
            profit_margin: Number(result.profit_margin),
        };
    }
    /**
     * 结算记录列表
     */
    async getSettlements(query) {
        const page = query.page || 1;
        const pageSize = query.page_size || 20;
        const skip = (page - 1) * pageSize;
        const where = {};
        if (query.status)
            where.status = query.status;
        const [total, list] = await Promise.all([
            this.prisma.settlement.count({ where }),
            this.prisma.settlement.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { created_at: 'desc' },
                include: { project: { select: { id: true, name: true } } },
            }),
        ]);
        return {
            total,
            page,
            page_size: pageSize,
            list: list.map((s) => ({
                ...s,
                revenue: Number(s.revenue),
                cost: Number(s.cost),
                profit: Number(s.profit),
                profit_margin: Number(s.profit_margin),
                project_name: s.project?.name,
            })),
        };
    }
};
exports.SettlementService = SettlementService;
exports.SettlementService = SettlementService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SettlementService);
//# sourceMappingURL=settlement.service.js.map