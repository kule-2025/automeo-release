"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const crypto = __importStar(require("crypto"));
let PaymentService = class PaymentService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger('PaymentService');
        this.PAY_SECRET = process.env.PAY_SECRET || '';
    }
    /**
     * 验证支付回调签名
     */
    verifySignature(params, sign) {
        const sorted = Object.keys(params).sort();
        const raw = sorted.map((k) => `${k}=${params[k]}`).join('&') + `&key=${this.PAY_SECRET}`;
        const expected = crypto.createHash('md5').update(raw).digest('hex').toUpperCase();
        return expected === sign.toUpperCase();
    }
    /**
     * 处理支付回调：验证签名→更新交易状态→触发对账
     */
    async handleCallback(callbackData) {
        const { transaction_no, amount, status, sign, channel } = callbackData;
        // 1. 验证签名
        const signValid = this.verifySignature({ transaction_no, amount: String(amount), status }, sign);
        if (!signValid) {
            this.logger.warn(`支付回调签名验证失败: ${transaction_no}`);
        }
        // 2. 查找交易
        const transaction = await this.prisma.financeTransaction.findUnique({
            where: { transaction_no },
        });
        if (!transaction) {
            this.logger.error(`回调交易不存在: ${transaction_no}`);
            return { success: false, message: '交易不存在' };
        }
        // 3. 更新交易状态
        if (status === 'success') {
            await this.prisma.financeTransaction.update({
                where: { id: transaction.id },
                data: {
                    status: 'paid',
                    channel: channel || transaction.channel,
                },
            });
            // 收入类交易：更新用户累计收入
            if (transaction.type === 'project_income') {
                const incomeAmount = Number(transaction.amount);
                await this.prisma.user.update({
                    where: { id: transaction.user_id },
                    data: {
                        total_income: { increment: incomeAmount },
                    },
                });
            }
            this.logger.log(`支付成功: ${transaction_no}, 金额: ${amount}`);
        }
        else {
            await this.prisma.financeTransaction.update({
                where: { id: transaction.id },
                data: { status: 'failed' },
            });
            this.logger.warn(`支付失败: ${transaction_no}`);
        }
        // 4. 触发对账（异步记录）
        this.logger.log(`触发对账: transaction_no=${transaction_no}`);
        return { success: true, transaction_no, status };
    }
};
exports.PaymentService = PaymentService;
exports.PaymentService = PaymentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PaymentService);
//# sourceMappingURL=payment.service.js.map