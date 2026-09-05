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
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
let DashboardService = class DashboardService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * 经营总览：核心指标+各环节待处理数+最近告警
     */
    async getDashboard() {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const [opportunityCount, customerCount, intentCount, projectCount, deliveryAccepted, settledIncome, pendingAlerts, recentAlerts,] = await Promise.all([
            this.prisma.opportunity.count(),
            this.prisma.customer.count(),
            this.prisma.customer.count({ where: { status: 'intent_clear' } }),
            this.prisma.project.count(),
            this.prisma.delivery.count({ where: { status: 'accepted' } }),
            this.prisma.financeTransaction.aggregate({
                _sum: { amount: true },
                where: { type: 'project_income', status: { in: ['paid', 'settled'] } },
            }),
            this.prisma.alertEvent.count({ where: { status: { in: ['pending', 'processing'] } } }),
            this.prisma.alertEvent.findMany({
                take: 5,
                orderBy: { triggered_at: 'desc' },
            }),
        ]);
        // 各环节待处理数
        const pendingCounts = {
            opportunity: await this.prisma.opportunity.count({ where: { status: { in: ['new', 'scoring', 'evaluating'] } } }),
            customer: await this.prisma.customer.count({ where: { status: { in: ['new', 'contacted', 'communicating'] } } }),
            requirement: await this.prisma.requirement.count({ where: { status: { in: ['draft', 'parsing', 'quoting', 'pending_confirm'] } } }),
            project: await this.prisma.project.count({ where: { status: { in: ['pending', 'in_development', 'in_review', 'ready_for_delivery'] } } }),
            delivery: await this.prisma.delivery.count({ where: { status: { in: ['pending', 'packaging', 'delivered', 'in_acceptance'] } } }),
            finance: await this.prisma.financeTransaction.count({ where: { status: 'pending' } }),
        };
        return {
            core_metrics: {
                opportunities: opportunityCount,
                customers: customerCount,
                intents: intentCount,
                projects: projectCount,
                deliveries: deliveryAccepted,
                settled_income: settledIncome._sum.amount ? Number(settledIncome._sum.amount) : 0,
            },
            pending_counts: pendingCounts,
            alert_summary: {
                pending: pendingAlerts,
                recent: recentAlerts,
            },
            today: todayStart.toISOString(),
        };
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map