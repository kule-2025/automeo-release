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
exports.FinanceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
let FinanceService = class FinanceService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger('FinanceService');
    }
    /**
     * 财务总览：余额/收入/支出/利润
     */
    async getOverview(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                balance: true,
                frozen_amount: true,
                total_income: true,
                total_expense: true,
            },
        });
        if (!user) {
            return {
                balance: 0,
                frozen_amount: 0,
                total_income: 0,
                total_expense: 0,
                profit: 0,
                profit_margin: 0,
            };
        }
        const totalIncome = Number(user.total_income);
        const totalExpense = Number(user.total_expense);
        const profit = Number((totalIncome - totalExpense).toFixed(2));
        const profitMargin = totalIncome > 0 ? Number((profit / totalIncome).toFixed(4)) : 0;
        // 本月收支
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthTransactions = await this.prisma.financeTransaction.findMany({
            where: {
                user_id: userId,
                created_at: { gte: monthStart },
                status: { in: ['paid', 'settled'] },
            },
            select: { type: true, amount: true },
        });
        let monthIncome = 0;
        let monthExpense = 0;
        for (const t of monthTransactions) {
            const amt = Number(t.amount);
            if (t.type === 'project_income' || t.type === 'refund') {
                monthIncome = Number((monthIncome + amt).toFixed(2));
            }
            else {
                monthExpense = Number((monthExpense + amt).toFixed(2));
            }
        }
        return {
            balance: Number(user.balance),
            frozen_amount: Number(user.frozen_amount),
            total_income: totalIncome,
            total_expense: totalExpense,
            profit,
            profit_margin: profitMargin,
            month_income: monthIncome,
            month_expense: monthExpense,
            month_profit: Number((monthIncome - monthExpense).toFixed(2)),
        };
    }
    /**
     * 交易明细分页筛选
     */
    async getTransactions(userId, query) {
        const page = query.page || 1;
        const pageSize = query.page_size || 20;
        const skip = (page - 1) * pageSize;
        const where = { user_id: userId };
        if (query.type)
            where.type = query.type;
        if (query.status)
            where.status = query.status;
        if (query.start_date || query.end_date) {
            where.created_at = {};
            if (query.start_date)
                where.created_at.gte = new Date(query.start_date);
            if (query.end_date)
                where.created_at.lte = new Date(query.end_date);
        }
        const [total, list] = await Promise.all([
            this.prisma.financeTransaction.count({ where }),
            this.prisma.financeTransaction.findMany({
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
            list: list.map((t) => ({
                ...t,
                amount: Number(t.amount),
                project_name: t.project?.name || null,
            })),
        };
    }
    /**
     * 项目验收后创建待收款记录
     */
    async createReceivable(userId, dto) {
        const project = await this.prisma.project.findUnique({
            where: { id: dto.project_id },
            include: { requirement: { select: { quoted_price: true } } },
        });
        if (!project) {
            throw new Error('项目不存在');
        }
        const revenue = project.requirement?.quoted_price
            ? Number(project.requirement.quoted_price)
            : Number(project.revenue);
        const transactionNo = `REC${Date.now()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
        const transaction = await this.prisma.financeTransaction.create({
            data: {
                user_id: userId,
                project_id: dto.project_id,
                type: 'project_income',
                amount: revenue,
                status: 'pending',
                channel: 'platform',
                transaction_no: transactionNo,
                remark: dto.remark || `项目「${project.name}」验收待收款`,
            },
        });
        this.logger.log(`创建待收款记录: ${transactionNo}, 金额: ${revenue}`);
        return {
            ...transaction,
            amount: Number(transaction.amount),
        };
    }
};
exports.FinanceService = FinanceService;
exports.FinanceService = FinanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FinanceService);
//# sourceMappingURL=finance.service.js.map