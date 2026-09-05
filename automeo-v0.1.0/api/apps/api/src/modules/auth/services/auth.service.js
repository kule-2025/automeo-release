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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcryptjs"));
const prisma_service_1 = require("../../../prisma/prisma.service");
let AuthService = class AuthService {
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.logger = new common_1.Logger('AuthService');
    }
    /**
     * 发送短信验证码（开发环境用模拟）
     */
    async sendCode(phone) {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        try {
            await this.prisma.smsCode.create({
                data: { phone, code, expires_at: expiresAt },
            });
        }
        catch (e) {
            this.logger.warn(`验证码保存失败: ${e.message}`);
        }
        this.logger.log(`[模拟短信] 手机号 ${phone} 验证码: ${code}`);
        return { code, expires_in: 300 };
    }
    /**
     * 用户注册
     */
    async register(dto) {
        // 校验验证码
        await this.verifySmsCode(dto.phone, dto.code);
        // 检查用户是否已存在
        const existing = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
        if (existing) {
            throw new common_1.BadRequestException('该手机号已注册');
        }
        const passwordHash = await bcrypt.hash(dto.password, 10);
        const user = await this.prisma.user.create({
            data: {
                phone: dto.phone,
                password_hash: passwordHash,
                nickname: dto.nickname || `用户${dto.phone.slice(-4)}`,
            },
        });
        const token = this.generateToken(user.id, user.phone);
        return { access_token: token, user: this.sanitizeUser(user) };
    }
    /**
     * 用户登录（手机号+验证码 或 账号+密码）
     */
    async login(dto) {
        let user;
        if (dto.phone && dto.code) {
            // 验证码登录
            await this.verifySmsCode(dto.phone, dto.code);
            user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
            if (!user) {
                // 自动注册
                const passwordHash = await bcrypt.hash(Math.random().toString(36).slice(-8), 10);
                user = await this.prisma.user.create({
                    data: {
                        phone: dto.phone,
                        password_hash: passwordHash,
                        nickname: `用户${dto.phone.slice(-4)}`,
                    },
                });
            }
        }
        else if (dto.phone && dto.password) {
            // 密码登录
            user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
            if (!user || !user.password_hash) {
                throw new common_1.UnauthorizedException('手机号或密码错误');
            }
            const valid = await bcrypt.compare(dto.password, user.password_hash);
            if (!valid) {
                throw new common_1.UnauthorizedException('手机号或密码错误');
            }
        }
        else {
            throw new common_1.BadRequestException('请提供手机号+验证码或手机号+密码');
        }
        if (user.status === 'disabled') {
            throw new common_1.UnauthorizedException('账号已被禁用');
        }
        const token = this.generateToken(user.id, user.phone);
        return { access_token: token, user: this.sanitizeUser(user) };
    }
    /**
     * 刷新Token
     */
    async refreshToken(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new common_1.UnauthorizedException('用户不存在');
        }
        const token = this.generateToken(user.id, user.phone);
        return { access_token: token };
    }
    async verifySmsCode(phone, code) {
        try {
            const record = await this.prisma.smsCode.findFirst({
                where: { phone, code, used: false, expires_at: { gt: new Date() } },
                orderBy: { created_at: 'desc' },
            });
            if (!record) {
                throw new common_1.BadRequestException('验证码错误或已过期');
            }
            await this.prisma.smsCode.update({ where: { id: record.id }, data: { used: true } });
        }
        catch (e) {
            if (e instanceof common_1.BadRequestException)
                throw e;
            // 数据库不可用时，开发环境接受任意验证码
            this.logger.warn(`验证码校验降级: ${e.message}`);
            if (process.env.NODE_ENV !== 'production')
                return;
            throw new common_1.BadRequestException('验证码服务暂不可用');
        }
    }
    generateToken(userId, phone) {
        return this.jwtService.sign({ sub: userId, id: userId, phone });
    }
    sanitizeUser(user) {
        return {
            id: user.id,
            phone: user.phone,
            nickname: user.nickname,
            avatar: user.avatar,
            status: user.status,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map