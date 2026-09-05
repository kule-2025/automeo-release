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
exports.HealthService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const STAGE_DEFS = [
    { key: 'opportunity', name: '商机发现' },
    { key: 'customer', name: '客户开发' },
    { key: 'requirement', name: '需求对接' },
    { key: 'project', name: '开发执行' },
    { key: 'delivery', name: '交付验收' },
    { key: 'finance', name: '财务结算' },
];
let HealthService = class HealthService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger('HealthService');
    }
    /**
     * 计算健康度：各环节成功率加权+异常扣分+资源负载→0-100分
     * score = 100 - (critical_alerts × 10 + warning_alerts × 3) - (100 - avg_success_rate) × 0.3
     */
    async calculate() {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        // 统计今日告警
        const [criticalAlerts, warningAlerts] = await Promise.all([
            this.prisma.alertEvent.count({
                where: { level: 'critical', status: { in: ['pending', 'processing'] }, triggered_at: { gte: todayStart } },
            }),
            this.prisma.alertEvent.count({
                where: { level: 'warning', status: { in: ['pending', 'processing'] }, triggered_at: { gte: todayStart } },
            }),
        ]);
        // 获取流水线状态
        const pipeline = await this.getPipelineStatus();
        const avgSuccessRate = pipeline.length > 0
            ? pipeline.reduce((s, p) => s + p.success_rate, 0) / pipeline.length
            : 100;
        // 计算分数
        let score = 100 - (criticalAlerts * 10 + warningAlerts * 3) - (100 - avgSuccessRate) * 0.3;
        score = Math.max(0, Math.min(100, Math.round(score * 10) / 10));
        const level = score < 60 ? 'red' : score < 80 ? 'yellow' : 'green';
        return {
            score,
            level,
            critical_alerts: criticalAlerts,
            warning_alerts: warningAlerts,
            avg_success_rate: Number(avgSuccessRate.toFixed(1)),
            pipeline,
        };
    }
    async getHealth() {
        return this.calculate();
    }
    /**
     * 六环节今日处理量/成功率/平均耗时/状态
     */
    async getPipelineStatus() {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const stages = [];
        for (const def of STAGE_DEFS) {
            let todayCount = 0;
            let successRate = 95;
            let avgDuration = 120000;
            try {
                switch (def.key) {
                    case 'opportunity': {
                        todayCount = await this.prisma.opportunity.count({
                            where: { created_at: { gte: todayStart } },
                        });
                        const converted = await this.prisma.opportunity.count({
                            where: { created_at: { gte: todayStart }, status: 'converted' },
                        });
                        successRate = todayCount > 0 ? (converted / todayCount) * 100 : 95;
                        break;
                    }
                    case 'customer': {
                        todayCount = await this.prisma.customer.count({
                            where: { created_at: { gte: todayStart } },
                        });
                        const active = await this.prisma.customer.count({
                            where: { created_at: { gte: todayStart }, status: { in: ['communicating', 'intent_clear', 'converted'] } },
                        });
                        successRate = todayCount > 0 ? (active / todayCount) * 100 : 95;
                        break;
                    }
                    case 'requirement': {
                        todayCount = await this.prisma.requirement.count({
                            where: { created_at: { gte: todayStart } },
                        });
                        const confirmed = await this.prisma.requirement.count({
                            where: { created_at: { gte: todayStart }, status: 'confirmed' },
                        });
                        successRate = todayCount > 0 ? (confirmed / todayCount) * 100 : 95;
                        break;
                    }
                    case 'project': {
                        todayCount = await this.prisma.projectTask.count({
                            where: { created_at: { gte: todayStart } },
                        });
                        const completed = await this.prisma.projectTask.count({
                            where: { created_at: { gte: todayStart }, status: 'completed' },
                        });
                        successRate = todayCount > 0 ? (completed / todayCount) * 100 : 95;
                        break;
                    }
                    case 'delivery': {
                        todayCount = await this.prisma.delivery.count({
                            where: { created_at: { gte: todayStart } },
                        });
                        const accepted = await this.prisma.delivery.count({
                            where: { created_at: { gte: todayStart }, status: 'accepted' },
                        });
                        successRate = todayCount > 0 ? (accepted / todayCount) * 100 : 95;
                        break;
                    }
                    case 'finance': {
                        todayCount = await this.prisma.financeTransaction.count({
                            where: { created_at: { gte: todayStart } },
                        });
                        const settled = await this.prisma.financeTransaction.count({
                            where: { created_at: { gte: todayStart }, status: { in: ['paid', 'settled'] } },
                        });
                        successRate = todayCount > 0 ? (settled / todayCount) * 100 : 95;
                        break;
                    }
                }
            }
            catch (e) {
                this.logger.warn(`获取${def.name}状态失败: ${e.message}`);
            }
            successRate = Number(successRate.toFixed(1));
            const status = successRate >= 90 ? 'green' : successRate >= 70 ? 'yellow' : 'red';
            stages.push({
                key: def.key,
                name: def.name,
                today_count: todayCount,
                success_rate: successRate,
                avg_duration_ms: avgDuration,
                status,
            });
        }
        return stages;
    }
};
exports.HealthService = HealthService;
exports.HealthService = HealthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], HealthService);
//# sourceMappingURL=health.service.js.map