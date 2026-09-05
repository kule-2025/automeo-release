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
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcryptjs"));
const prisma_service_1 = require("../../../prisma/prisma.service");
let UserService = class UserService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger('UserService');
    }
    async getProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                phone: true,
                nickname: true,
                avatar: true,
                real_name: true,
                status: true,
                balance: true,
                frozen_amount: true,
                total_income: true,
                total_expense: true,
                created_at: true,
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('用户不存在');
        }
        // 脱敏身份证
        const idCardMasked = user.real_name ? '已认证' : '未认证';
        return {
            ...user,
            id_card_status: idCardMasked,
            balance: Number(user.balance),
            frozen_amount: Number(user.frozen_amount),
            total_income: Number(user.total_income),
            total_expense: Number(user.total_expense),
        };
    }
    async updateProfile(userId, dto) {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: {
                ...(dto.nickname && { nickname: dto.nickname }),
                ...(dto.avatar && { avatar: dto.avatar }),
            },
            select: { id: true, nickname: true, avatar: true },
        });
        return user;
    }
    async changePassword(userId, dto) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.password_hash) {
            throw new common_1.BadRequestException('用户不存在或未设置密码');
        }
        const valid = await bcrypt.compare(dto.old_password, user.password_hash);
        if (!valid) {
            throw new common_1.BadRequestException('原密码错误');
        }
        const newHash = await bcrypt.hash(dto.new_password, 10);
        await this.prisma.user.update({
            where: { id: userId },
            data: { password_hash: newHash },
        });
        return { success: true, message: '密码修改成功' };
    }
    async verifyIdentity(userId, dto) {
        // 开发环境模拟实名认证
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: {
                real_name: dto.real_name,
                id_card: dto.id_card,
                status: 'active',
            },
            select: { id: true, real_name: true, status: true },
        });
        this.logger.log(`用户 ${userId} 实名认证完成: ${dto.real_name}`);
        return { ...user, verified: true };
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UserService);
//# sourceMappingURL=user.service.js.map