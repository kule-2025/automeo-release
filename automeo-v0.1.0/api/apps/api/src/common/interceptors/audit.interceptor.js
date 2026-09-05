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
exports.AuditInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const prisma_service_1 = require("../../prisma/prisma.service");
/**
 * 操作审计拦截器 - 自动记录所有写操作（POST/PUT/DELETE/PATCH）
 */
let AuditInterceptor = class AuditInterceptor {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger('Audit');
    }
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const method = request.method;
        if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
            return next.handle();
        }
        const startTime = Date.now();
        return next.handle().pipe((0, rxjs_1.tap)(async () => {
            try {
                const duration = Date.now() - startTime;
                const userId = request.user?.id || null;
                const url = request.url;
                const ip = request.ip || request.connection?.remoteAddress || '';
                // 从URL中提取目标类型和ID
                const parts = url.split('/').filter(Boolean);
                const targetType = parts[2] || 'unknown'; // /api/v1/xxx/:id
                const targetId = parts[3] && !parts[3].includes('?') ? parts[3] : null;
                await this.prisma.systemLog.create({
                    data: {
                        user_id: userId,
                        action: `${method} ${url.split('?')[0]}`,
                        target_type: targetType,
                        target_id: targetId,
                        detail_json: JSON.parse(JSON.stringify({
                            body: this.sanitize(request.body),
                            query: request.query,
                            duration_ms: duration,
                        })),
                        ip: String(ip),
                    },
                });
            }
            catch (e) {
                this.logger.warn(`审计日志记录失败: ${e.message}`);
            }
        }));
    }
    sanitize(obj) {
        if (!obj || typeof obj !== 'object')
            return obj;
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
            if (['password', 'password_hash', 'id_card', 'token'].includes(key.toLowerCase())) {
                result[key] = '***';
            }
            else {
                result[key] = value;
            }
        }
        return result;
    }
};
exports.AuditInterceptor = AuditInterceptor;
exports.AuditInterceptor = AuditInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditInterceptor);
//# sourceMappingURL=audit.interceptor.js.map