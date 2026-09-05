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
exports.AuditGuard = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
/**
 * 审计Guard：记录操作日志
 */
let AuditGuard = class AuditGuard {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger('AuditGuard');
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const method = request.method;
        // 只记录写操作
        if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
            return true;
        }
        const userId = request.user?.id;
        const action = `${method} ${request.route?.path || request.url}`;
        const ip = request.ip || request.headers['x-forwarded-for'];
        try {
            await this.prisma.systemLog.create({
                data: {
                    user_id: userId || null,
                    action,
                    target_type: request.params?.id ? 'resource' : null,
                    target_id: request.params?.id || null,
                    detail_json: JSON.parse(JSON.stringify({
                        body: this.sanitize(request.body),
                        query: request.query,
                        path: request.url,
                    })),
                    ip: typeof ip === 'string' ? ip : undefined,
                },
            });
        }
        catch (e) {
            this.logger.warn(`审计日志写入失败: ${e.message}`);
        }
        return true;
    }
    sanitize(body) {
        if (!body)
            return {};
        const sanitized = {};
        for (const [key, value] of Object.entries(body)) {
            if (['password', 'password_hash', 'token', 'secret'].includes(key.toLowerCase())) {
                sanitized[key] = '***';
            }
            else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }
};
exports.AuditGuard = AuditGuard;
exports.AuditGuard = AuditGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditGuard);
//# sourceMappingURL=audit.guard.js.map