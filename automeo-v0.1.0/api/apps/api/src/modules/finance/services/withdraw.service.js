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
exports.WithdrawService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
let WithdrawService = class WithdrawService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger('WithdrawService');
    }
    /**
     * 申请提现
     * 校验：实名认证/余额≥金额/≥10元
     * 冻结金额 → 创建Withdraw → 银行渠道转账 → 成功扣冻结/失败解冻
     */
    async apply(userId, dto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, real_name: true, balance: true, frozen_amount: true },
        });
        if (!user) {
            throw new common_1.BadRequestException('用户不存在');
        }
        // 校验实名认证
        if (!user.real_name) {
            throw new common_1.BadRequestException('请先完成实名认证后再申请提现');
        }
        const balance = Number(user.balance);
        const amount = Number(dto.amount.toFixed(2));
        // 校验最低金额
        if (amount < 10) {
            throw new common_1.BadRequestException('最低提现金额为10元');
        }
        // 校验余额
        if (balance < amount) {
            throw new common_1.BadRequestException(`可提现余额不足，当前余额: ¥${balance.toFixed(2)}`);
        }
        // 冻结金额 + 创建提现记录
        const transactionNo = `WTH${Date.now()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
        const result = await this.prisma.$transaction(async (tx) => {
            // 冻结金额
            await tx.user.update({
                where: { id: userId },
                data: {
                    balance: { decrement: amount },
                    frozen_amount: { increment: amount },
                },
            });
            // 创建提现记录
            const withdraw = await tx.withdraw.create({
                data: {
                    user_id: userId,
                    amount,
                    status: 'processing',
                    bank_account: dto.bank_account,
                    bank_name: dto.bank_name,
                    account_name: dto.account_name,
                    transaction_no: transactionNo,
                },
            });
            return withdraw;
        });
        this.logger.log(`提现申请: userId=${userId}, 金额=${amount}, 交易号=${transactionNo}`);
        return {
            ...result,
            amount: Number(result.amount),
            estimated_arrival: 'T+1工作日',
        };
    }
    /**
     * 提现记录列表
     */
    async getRecords(userId, query) {
        const page = query.page || 1;
        const pageSize = query.page_size || 20;
        const skip = (page - 1) * pageSize;
        const where = { user_id: userId };
        if (query.status)
            where.status = query.status;
        const [total, list] = await Promise.all([
            this.prisma.withdraw.count({ where }),
            this.prisma.withdraw.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { created_at: 'desc' },
            }),
        ]);
        return {
            total,
            page,
            page_size: pageSize,
            list: list.map((w) => ({
                ...w,
                amount: Number(w.amount),
            })),
        };
    }
};
exports.WithdrawService = WithdrawService;
exports.WithdrawService = WithdrawService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WithdrawService);
//# sourceMappingURL=withdraw.service.js.map