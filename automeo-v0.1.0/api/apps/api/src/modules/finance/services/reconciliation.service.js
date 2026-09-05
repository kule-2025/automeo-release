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
exports.ReconciliationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
let ReconciliationService = class ReconciliationService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger('ReconciliationService');
    }
    /**
     * 对账：匹配订单与到账记录，差异处理→告警
     */
    async reconcile(userId, date) {
        const targetDate = date ? new Date(date) : new Date();
        const dayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
        // 当日所有已支付/已结算交易
        const transactions = await this.prisma.financeTransaction.findMany({
            where: {
                user_id: userId,
                created_at: { gte: dayStart, lt: dayEnd },
                status: { in: ['paid', 'settled'] },
            },
            select: { id: true, transaction_no: true, amount: true, type: true, status: true },
        });
        let matched = 0;
        const discrepancies = [];
        // 模拟对账逻辑：每笔交易金额应为正数且有交易号
        for (const tx of transactions) {
            const amount = Number(tx.amount);
            if (amount <= 0) {
                discrepancies.push({
                    transaction_no: tx.transaction_no || tx.id,
                    expected_amount: 0,
                    actual_amount: amount,
                    diff: amount,
                });
            }
            else if (!tx.transaction_no) {
                discrepancies.push({
                    transaction_no: tx.id,
                    expected_amount: amount,
                    actual_amount: 0,
                    diff: -amount,
                });
            }
            else {
                matched++;
            }
        }
        const unmatchedOrders = transactions.filter((t) => t.status === 'pending').length;
        const unmatchedPayments = discrepancies.length;
        const alertTriggered = discrepancies.length > 0;
        // 差异→创建告警
        if (alertTriggered) {
            await this.prisma.alertEvent.create({
                data: {
                    module: 'finance',
                    level: discrepancies.length > 3 ? 'critical' : 'warning',
                    message: `财务对账发现 ${discrepancies.length} 笔差异记录`,
                    status: 'pending',
                    detail_json: {
                        date: dayStart.toISOString(),
                        discrepancies,
                        total_transactions: transactions.length,
                    },
                },
            });
            this.logger.warn(`对账告警: ${discrepancies.length} 笔差异`);
        }
        this.logger.log(`对账完成: 匹配=${matched}, 差异=${discrepancies.length}`);
        return {
            matched,
            unmatched_orders: unmatchedOrders,
            unmatched_payments: unmatchedPayments,
            discrepancies,
            alert_triggered: alertTriggered,
        };
    }
};
exports.ReconciliationService = ReconciliationService;
exports.ReconciliationService = ReconciliationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReconciliationService);
//# sourceMappingURL=reconciliation.service.js.map