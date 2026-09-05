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
exports.CostService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
let CostService = class CostService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger('CostService');
    }
    /**
     * 成本总览：今日/本月成本/成本收入比
     */
    async getOverview() {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const [todayRecords, monthRecords, allIncome] = await Promise.all([
            this.prisma.costRecord.findMany({
                where: { created_at: { gte: todayStart } },
                select: { amount: true, category: { select: { type: true } } },
            }),
            this.prisma.costRecord.findMany({
                where: { created_at: { gte: monthStart } },
                select: { amount: true, category: { select: { type: true } } },
            }),
            this.prisma.financeTransaction.aggregate({
                _sum: { amount: true },
                where: { type: 'project_income', status: { in: ['paid', 'settled'] } },
            }),
        ]);
        const todayCost = todayRecords.reduce((s, r) => Number((s + Number(r.amount)).toFixed(2)), 0);
        const monthCost = monthRecords.reduce((s, r) => Number((s + Number(r.amount)).toFixed(2)), 0);
        const totalIncome = allIncome._sum.amount ? Number(allIncome._sum.amount) : 0;
        const costIncomeRatio = totalIncome > 0 ? Number((monthCost / totalIncome).toFixed(4)) : 0;
        // 分类统计
        const categoryBreakdown = { token: 0, compute: 0, other: 0 };
        for (const r of monthRecords) {
            const type = r.category?.type || 'other';
            const amt = Number(r.amount);
            if (type === 'token')
                categoryBreakdown.token = Number((categoryBreakdown.token + amt).toFixed(2));
            else if (type === 'compute')
                categoryBreakdown.compute = Number((categoryBreakdown.compute + amt).toFixed(2));
            else
                categoryBreakdown.other = Number((categoryBreakdown.other + amt).toFixed(2));
        }
        return {
            today_cost: todayCost,
            month_cost: monthCost,
            total_income: totalIncome,
            cost_income_ratio: costIncomeRatio,
            category_breakdown: categoryBreakdown,
        };
    }
    /**
     * 近30天按日分组堆叠数据
     */
    async getTrend(query) {
        const days = query.range === 'week' ? 7 : 30;
        const now = new Date();
        const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        start.setHours(0, 0, 0, 0);
        const records = await this.prisma.costRecord.findMany({
            where: {
                created_at: { gte: start },
                ...(query.project_id ? { project_id: query.project_id } : {}),
            },
            select: { amount: true, created_at: true, category: { select: { type: true } } },
        });
        // 初始化每日数据
        const dailyMap = new Map();
        for (let i = 0; i < days; i++) {
            const d = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
            const key = d.toISOString().slice(0, 10);
            dailyMap.set(key, { date: key, token: 0, compute: 0, other: 0, total: 0 });
        }
        // 聚合
        for (const r of records) {
            const key = new Date(r.created_at).toISOString().slice(0, 10);
            const day = dailyMap.get(key);
            if (!day)
                continue;
            const amt = Number(r.amount);
            const type = r.category?.type || 'other';
            if (type === 'token')
                day.token = Number((day.token + amt).toFixed(2));
            else if (type === 'compute')
                day.compute = Number((day.compute + amt).toFixed(2));
            else
                day.other = Number((day.other + amt).toFixed(2));
            day.total = Number((day.total + amt).toFixed(2));
        }
        return Array.from(dailyMap.values());
    }
    /**
     * 定时汇总每小时成本（供Cron调用）
     */
    async aggregateHourly() {
        const now = new Date();
        const hourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0);
        const records = await this.prisma.costRecord.findMany({
            where: { created_at: { gte: hourStart } },
            select: { amount: true },
        });
        const total = records.reduce((s, r) => s + Number(r.amount), 0);
        this.logger.log(`小时成本汇总 [${hourStart.toISOString()}]: ¥${total.toFixed(2)}, 记录数: ${records.length}`);
    }
};
exports.CostService = CostService;
exports.CostService = CostService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CostService);
//# sourceMappingURL=cost.service.js.map