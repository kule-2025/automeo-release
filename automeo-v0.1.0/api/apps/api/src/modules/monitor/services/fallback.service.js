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
exports.FallbackService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
let FallbackService = class FallbackService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger('FallbackService');
    }
    /**
     * 评估异常并匹配兜底规则→自动重试/降级/暂停/转人工
     */
    async evaluate(module, exceptionType) {
        const rules = await this.prisma.fallbackRule.findMany({
            where: { module, exception_type: exceptionType, enabled: true },
            orderBy: { created_at: 'asc' },
        });
        if (rules.length === 0) {
            return {
                matched: false,
                action: 'none',
                max_retries: 0,
                reason: '无匹配的兜底规则',
            };
        }
        const rule = rules[0];
        this.logger.log(`兜底匹配: module=${module}, exception=${exceptionType}, action=${rule.action}, retries=${rule.max_retries}`);
        return {
            matched: true,
            rule_id: rule.id,
            action: rule.action,
            max_retries: rule.max_retries,
            reason: `匹配规则: ${rule.action} (最多重试${rule.max_retries}次)`,
        };
    }
    /**
     * 获取兜底规则列表
     */
    async getFallbackRules() {
        const rules = await this.prisma.fallbackRule.findMany({
            orderBy: { module: 'asc' },
        });
        const enabledCount = rules.filter((r) => r.enabled).length;
        return {
            total: rules.length,
            enabled: enabledCount,
            list: rules,
        };
    }
    /**
     * 更新兜底规则
     */
    async updateFallbackRule(id, dto) {
        const existing = await this.prisma.fallbackRule.findUnique({ where: { id } });
        if (!existing) {
            throw new common_1.NotFoundException('兜底规则不存在');
        }
        const updated = await this.prisma.fallbackRule.update({
            where: { id },
            data: {
                ...(dto.max_retries !== undefined && { max_retries: dto.max_retries }),
                ...(dto.action && { action: dto.action }),
                ...(dto.enabled !== undefined && { enabled: dto.enabled }),
            },
        });
        this.logger.log(`更新兜底规则: id=${id}, action=${dto.action}, enabled=${dto.enabled}`);
        return updated;
    }
};
exports.FallbackService = FallbackService;
exports.FallbackService = FallbackService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FallbackService);
//# sourceMappingURL=fallback.service.js.map