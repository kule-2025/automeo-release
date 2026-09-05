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
exports.CostAnalysisService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
let CostAnalysisService = class CostAnalysisService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * 成本结构占比/趋势
     */
    async getCostAnalysis() {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const records = await this.prisma.costRecord.findMany({
            where: { created_at: { gte: monthStart } },
            include: { category: { select: { type: true, name: true } } },
        });
        // 按类型分组
        const byType = new Map();
        for (const r of records) {
            const type = r.category?.type || 'other';
            const name = r.category?.name || '其他';
            if (!byType.has(type)) {
                byType.set(type, { name, amount: 0, count: 0 });
            }
            const entry = byType.get(type);
            entry.amount = Number((entry.amount + Number(r.amount)).toFixed(2));
            entry.count++;
        }
        const total = records.reduce((s, r) => s + Number(r.amount), 0);
        const structure = Array.from(byType.entries()).map(([type, data]) => ({
            type,
            name: data.name,
            amount: data.amount,
            count: data.count,
            ratio: total > 0 ? Number((data.amount / total).toFixed(4)) : 0,
        }));
        // 近6个月趋势
        const monthlyTrend = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
            const monthRecords = await this.prisma.costRecord.findMany({
                where: { created_at: { gte: d, lt: nextMonth } },
                select: { amount: true },
            });
            const monthTotal = monthRecords.reduce((s, r) => s + Number(r.amount), 0);
            monthlyTrend.push({
                month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
                amount: Number(monthTotal.toFixed(2)),
            });
        }
        return {
            total_cost: Number(total.toFixed(2)),
            structure,
            monthly_trend: monthlyTrend,
        };
    }
};
exports.CostAnalysisService = CostAnalysisService;
exports.CostAnalysisService = CostAnalysisService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CostAnalysisService);
//# sourceMappingURL=cost-analysis.service.js.map