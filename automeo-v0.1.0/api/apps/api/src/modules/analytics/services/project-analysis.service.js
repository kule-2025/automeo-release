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
exports.ProjectAnalysisService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
let ProjectAnalysisService = class ProjectAnalysisService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * 按项目收益排名/平均利润/利润率分布
     */
    async getProjectAnalysis() {
        const projects = await this.prisma.project.findMany({
            include: {
                requirement: { select: { quoted_price: true } },
                cost_records: { select: { amount: true } },
                settlements: true,
            },
            orderBy: { revenue: 'desc' },
            take: 20,
        });
        const ranked = projects.map((p) => {
            const revenue = p.requirement?.quoted_price
                ? Number(p.requirement.quoted_price)
                : Number(p.revenue);
            const cost = p.cost_records.reduce((s, r) => s + Number(r.amount), 0);
            const profit = Number((revenue - cost).toFixed(2));
            const profitMargin = revenue > 0 ? Number((profit / revenue).toFixed(4)) : 0;
            return {
                project_id: p.id,
                project_name: p.name,
                revenue,
                cost,
                profit,
                profit_margin: profitMargin,
                status: p.status,
            };
        });
        // 统计
        const totalProfit = ranked.reduce((s, p) => s + p.profit, 0);
        const avgProfit = ranked.length > 0 ? Number((totalProfit / ranked.length).toFixed(2)) : 0;
        const avgMargin = ranked.length > 0
            ? Number((ranked.reduce((s, p) => s + p.profit_margin, 0) / ranked.length).toFixed(4))
            : 0;
        // 利润率分布
        const marginDistribution = {
            high: ranked.filter((p) => p.profit_margin >= 0.3).length,
            medium: ranked.filter((p) => p.profit_margin >= 0.1 && p.profit_margin < 0.3).length,
            low: ranked.filter((p) => p.profit_margin >= 0 && p.profit_margin < 0.1).length,
            negative: ranked.filter((p) => p.profit_margin < 0).length,
        };
        return {
            total_projects: ranked.length,
            total_profit: Number(totalProfit.toFixed(2)),
            avg_profit: avgProfit,
            avg_profit_margin: avgMargin,
            margin_distribution: marginDistribution,
            ranking: ranked,
        };
    }
};
exports.ProjectAnalysisService = ProjectAnalysisService;
exports.ProjectAnalysisService = ProjectAnalysisService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProjectAnalysisService);
//# sourceMappingURL=project-analysis.service.js.map