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
exports.OpportunityService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const shared_1 = require("../../../../../../packages/shared/src");
const client_1 = require("@prisma/client");
let OpportunityService = class OpportunityService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger('OpportunityService');
    }
    /**
     * 商机列表 - 支持分页、筛选、排序
     */
    async findAll(query) {
        const { page = 1, pageSize = 20, status, source_platform, min_amount, max_amount, sort, min_match_score } = query;
        const where = {};
        if (status)
            where.status = status;
        if (source_platform)
            where.source_platform = source_platform;
        if (min_match_score !== undefined)
            where.match_score = { gte: min_match_score };
        if (min_amount !== undefined || max_amount !== undefined) {
            where.estimated_amount = {};
            if (min_amount !== undefined) {
                where.estimated_amount.gte = new client_1.Prisma.Decimal(min_amount);
            }
            if (max_amount !== undefined) {
                where.estimated_amount.lte = new client_1.Prisma.Decimal(max_amount);
            }
        }
        // 解析排序参数
        let orderBy = { found_at: 'desc' };
        if (sort) {
            const [field, direction] = sort.split(':');
            const validFields = {
                match_score: 'match_score',
                estimated_amount: 'estimated_amount',
                found_at: 'found_at',
                created_at: 'created_at',
                profit_score: 'profit_score',
            };
            if (validFields[field]) {
                orderBy = { [validFields[field]]: direction === 'asc' ? 'asc' : 'desc' };
            }
        }
        const [list, total] = await Promise.all([
            this.prisma.opportunity.findMany({
                where,
                orderBy,
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: { source: { select: { id: true, name: true, platform: true } } },
            }),
            this.prisma.opportunity.count({ where }),
        ]);
        return { list, total, page, pageSize };
    }
    /**
     * 商机详情
     */
    async findOne(id) {
        const opportunity = await this.prisma.opportunity.findUnique({
            where: { id },
            include: {
                source: true,
                customer: true,
            },
        });
        if (!opportunity) {
            throw new common_1.NotFoundException('商机不存在');
        }
        return opportunity;
    }
    /**
     * 商机统计
     */
    async getStats() {
        const [total, byStatus, byPlatform, todayNew, highMatch] = await Promise.all([
            this.prisma.opportunity.count(),
            this.prisma.opportunity.groupBy({
                by: ['status'],
                _count: { _all: true },
            }),
            this.prisma.opportunity.groupBy({
                by: ['source_platform'],
                _count: { _all: true },
                _avg: { match_score: true },
            }),
            this.prisma.opportunity.count({
                where: { found_at: { gte: this.startOfToday() } },
            }),
            this.prisma.opportunity.count({
                where: { match_score: { gte: 80 } },
            }),
        ]);
        const statusMap = {};
        for (const item of byStatus) {
            statusMap[item.status] = item._count._all;
        }
        const platformStats = byPlatform.map((p) => ({
            platform: p.source_platform,
            count: p._count._all,
            avg_match_score: p._avg.match_score ? Math.round(p._avg.match_score) : null,
        }));
        const converted = statusMap[shared_1.OpportunityStatus.CONVERTED] || 0;
        const conversionRate = total > 0 ? Number(((converted / total) * 100).toFixed(1)) : 0;
        return {
            total,
            today_new: todayNew,
            high_match_count: highMatch,
            conversion_rate: conversionRate,
            by_status: statusMap,
            by_platform: platformStats,
        };
    }
    /**
     * 按 source_url 去重插入商机
     * 返回 { created: boolean, opportunity }
     */
    async upsertIfNew(data) {
        const existing = await this.prisma.opportunity.findUnique({
            where: { source_url: data.source_url },
        });
        if (existing) {
            return { created: false, opportunity: existing };
        }
        const opportunity = await this.prisma.opportunity.create({
            data: {
                source_id: data.source_id,
                title: data.title,
                description: data.description,
                source_platform: data.source_platform,
                source_url: data.source_url,
                author: data.author,
                estimated_amount: data.estimated_amount !== undefined ? new client_1.Prisma.Decimal(data.estimated_amount) : undefined,
                status: shared_1.OpportunityStatus.NEW,
                raw_data: data.raw_data,
                found_at: data.found_at || new Date(),
            },
        });
        this.logger.log(`新商机入库: ${opportunity.title} [${opportunity.source_platform}]`);
        return { created: true, opportunity };
    }
    /**
     * 更新商机状态
     */
    async updateStatus(id, status) {
        return this.prisma.opportunity.update({
            where: { id },
            data: { status },
        });
    }
    startOfToday() {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }
};
exports.OpportunityService = OpportunityService;
exports.OpportunityService = OpportunityService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OpportunityService);
//# sourceMappingURL=opportunity.service.js.map