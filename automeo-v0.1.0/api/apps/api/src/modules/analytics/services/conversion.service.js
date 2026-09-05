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
exports.ConversionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
let ConversionService = class ConversionService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * 转化漏斗：商机→触达→意向→成交→交付→收款
     * Opportunity总数→Customer总数(触达)→Customer中status=intent_clear(意向)
     * →Project总数(成交)→Delivery中status=accepted(交付)
     * →FinanceTransaction中type=project_income且status=settled(收款)
     */
    async getConversion() {
        const [opportunityCount, customerCount, intentCount, projectCount, deliveryAccepted, settledTransactions,] = await Promise.all([
            this.prisma.opportunity.count(),
            this.prisma.customer.count(),
            this.prisma.customer.count({ where: { status: 'intent_clear' } }),
            this.prisma.project.count(),
            this.prisma.delivery.count({ where: { status: 'accepted' } }),
            this.prisma.financeTransaction.count({
                where: { type: 'project_income', status: 'settled' },
            }),
        ]);
        const counts = [
            { stage: 'opportunity', name: '商机发现', count: opportunityCount },
            { stage: 'reach', name: '客户触达', count: customerCount },
            { stage: 'intent', name: '意向确认', count: intentCount },
            { stage: 'deal', name: '成交立项', count: projectCount },
            { stage: 'delivery', name: '交付验收', count: deliveryAccepted },
            { stage: 'payment', name: '收款结算', count: settledTransactions },
        ];
        const funnel = counts.map((c, i) => {
            const prev = i > 0 ? counts[i - 1].count : c.count;
            const conversionRate = prev > 0 ? Number((c.count / prev).toFixed(4)) : 0;
            const lostCount = prev - c.count;
            return {
                stage: c.stage,
                name: c.name,
                count: c.count,
                conversion_rate: conversionRate,
                lost_count: Math.max(0, lostCount),
            };
        });
        return funnel;
    }
};
exports.ConversionService = ConversionService;
exports.ConversionService = ConversionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ConversionService);
//# sourceMappingURL=conversion.service.js.map