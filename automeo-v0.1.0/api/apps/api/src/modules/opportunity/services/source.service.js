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
exports.SourceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const shared_1 = require("../../../../../../packages/shared/src");
let SourceService = class SourceService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * 商机源列表
     */
    async findAll(status) {
        const where = {};
        if (status)
            where.status = status;
        const sources = await this.prisma.opportunitySource.findMany({
            where,
            orderBy: { created_at: 'asc' },
            include: {
                _count: { select: { opportunities: true } },
            },
        });
        return sources;
    }
    /**
     * 商机源详情
     */
    async findOne(id) {
        const source = await this.prisma.opportunitySource.findUnique({
            where: { id },
            include: {
                opportunities: {
                    orderBy: { found_at: 'desc' },
                    take: 5,
                },
                _count: { select: { opportunities: true } },
            },
        });
        if (!source) {
            throw new common_1.NotFoundException('商机源不存在');
        }
        return source;
    }
    /**
     * 更新商机源配置
     */
    async update(id, dto) {
        const source = await this.prisma.opportunitySource.findUnique({ where: { id } });
        if (!source) {
            throw new common_1.NotFoundException('商机源不存在');
        }
        return this.prisma.opportunitySource.update({
            where: { id },
            data: {
                name: dto.name,
                platform: dto.platform,
                config_json: dto.config_json,
                crawl_interval: dto.crawl_interval,
                status: dto.status,
            },
        });
    }
    /**
     * 切换商机源状态（启用/暂停）
     */
    async toggle(id, targetStatus) {
        const source = await this.prisma.opportunitySource.findUnique({ where: { id } });
        if (!source) {
            throw new common_1.NotFoundException('商机源不存在');
        }
        const newStatus = targetStatus ||
            (source.status === shared_1.SourceStatus.ACTIVE ? shared_1.SourceStatus.PAUSED : shared_1.SourceStatus.ACTIVE);
        return this.prisma.opportunitySource.update({
            where: { id },
            data: { status: newStatus },
        });
    }
    /**
     * 创建商机源
     */
    async create(data) {
        return this.prisma.opportunitySource.create({
            data: {
                name: data.name,
                platform: data.platform,
                config_json: data.config_json,
                crawl_interval: data.crawl_interval || 600000,
                status: shared_1.SourceStatus.ACTIVE,
            },
        });
    }
    /**
     * 重置错误状态
     */
    async resetError(id) {
        return this.prisma.opportunitySource.update({
            where: { id },
            data: { status: shared_1.SourceStatus.ACTIVE },
        });
    }
};
exports.SourceService = SourceService;
exports.SourceService = SourceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SourceService);
//# sourceMappingURL=source.service.js.map