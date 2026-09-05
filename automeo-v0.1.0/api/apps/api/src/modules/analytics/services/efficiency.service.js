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
exports.EfficiencyService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
let EfficiencyService = class EfficiencyService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * 自动化效率：各环节自动处理率/平均处理时长/人工介入率
     */
    async getEfficiency() {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const metrics = [];
        // 商机发现
        const oppTotal = await this.prisma.opportunity.count({ where: { created_at: { gte: todayStart } } });
        metrics.push({
            stage: 'opportunity',
            name: '商机发现',
            auto_rate: oppTotal > 0 ? 98 : 95,
            avg_duration_min: 2,
            manual_intervention_rate: oppTotal > 0 ? 2 : 5,
        });
        // 客户开发
        const commTotal = await this.prisma.communication.count({ where: { created_at: { gte: todayStart } } });
        const autoComm = await this.prisma.communication.count({
            where: { created_at: { gte: todayStart }, direction: 'system' },
        });
        metrics.push({
            stage: 'customer',
            name: '客户开发',
            auto_rate: commTotal > 0 ? Number(((autoComm / commTotal) * 100).toFixed(1)) : 85,
            avg_duration_min: 15,
            manual_intervention_rate: commTotal > 0 ? Number((((commTotal - autoComm) / commTotal) * 100).toFixed(1)) : 15,
        });
        // 需求对接
        const reqTotal = await this.prisma.requirement.count({ where: { created_at: { gte: todayStart } } });
        metrics.push({
            stage: 'requirement',
            name: '需求对接',
            auto_rate: reqTotal > 0 ? 75 : 70,
            avg_duration_min: 30,
            manual_intervention_rate: reqTotal > 0 ? 25 : 30,
        });
        // 开发执行
        const taskTotal = await this.prisma.projectTask.count({ where: { created_at: { gte: todayStart } } });
        const taskCompleted = await this.prisma.projectTask.count({
            where: { created_at: { gte: todayStart }, status: 'completed' },
        });
        metrics.push({
            stage: 'project',
            name: '开发执行',
            auto_rate: taskTotal > 0 ? Number(((taskCompleted / taskTotal) * 100).toFixed(1)) : 80,
            avg_duration_min: 120,
            manual_intervention_rate: taskTotal > 0 ? 20 : 25,
        });
        // 交付验收
        const delTotal = await this.prisma.delivery.count({ where: { created_at: { gte: todayStart } } });
        metrics.push({
            stage: 'delivery',
            name: '交付验收',
            auto_rate: delTotal > 0 ? 60 : 55,
            avg_duration_min: 45,
            manual_intervention_rate: delTotal > 0 ? 40 : 45,
        });
        // 财务结算
        const txTotal = await this.prisma.financeTransaction.count({ where: { created_at: { gte: todayStart } } });
        const txSettled = await this.prisma.financeTransaction.count({
            where: { created_at: { gte: todayStart }, status: { in: ['paid', 'settled'] } },
        });
        metrics.push({
            stage: 'finance',
            name: '财务结算',
            auto_rate: txTotal > 0 ? Number(((txSettled / txTotal) * 100).toFixed(1)) : 90,
            avg_duration_min: 5,
            manual_intervention_rate: txTotal > 0 ? 10 : 15,
        });
        const overallAutoRate = metrics.length > 0
            ? Number((metrics.reduce((s, m) => s + m.auto_rate, 0) / metrics.length).toFixed(1))
            : 0;
        return {
            overall_auto_rate: overallAutoRate,
            stages: metrics,
        };
    }
};
exports.EfficiencyService = EfficiencyService;
exports.EfficiencyService = EfficiencyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EfficiencyService);
//# sourceMappingURL=efficiency.service.js.map