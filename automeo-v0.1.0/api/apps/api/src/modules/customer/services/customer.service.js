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
exports.CustomerService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const customer_profile_service_1 = require("./customer-profile.service");
const shared_1 = require("../../../../../../packages/shared/src");
let CustomerService = class CustomerService {
    constructor(prisma, profileService) {
        this.prisma = prisma;
        this.profileService = profileService;
        this.logger = new common_1.Logger('CustomerService');
    }
    /**
     * 客户列表 - 支持等级、状态、关键词筛选
     */
    async findAll(query) {
        const { page = 1, pageSize = 20, level, status, keyword } = query;
        const where = {};
        if (level)
            where.level = level;
        if (status)
            where.status = status;
        if (keyword) {
            where.OR = [
                { name: { contains: keyword } },
                { contact: { contains: keyword } },
                { intent_project: { contains: keyword } },
            ];
        }
        const [list, total] = await Promise.all([
            this.prisma.customer.findMany({
                where,
                orderBy: { last_contact_at: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: {
                    opportunity: { select: { id: true, title: true, source_platform: true, match_score: true } },
                    _count: { select: { communications: true, requirements: true } },
                },
            }),
            this.prisma.customer.count({ where }),
        ]);
        return { list, total, page, pageSize };
    }
    /**
     * 客户统计
     */
    async getStats() {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const [total, levelA, todayNew, converted] = await Promise.all([
            this.prisma.customer.count(),
            this.prisma.customer.count({ where: { level: shared_1.CustomerLevel.A } }),
            this.prisma.customer.count({ where: { created_at: { gte: startOfToday } } }),
            this.prisma.customer.count({ where: { status: shared_1.CustomerStatus.CONVERTED } }),
        ]);
        return {
            total,
            level_a_count: levelA,
            today_new: todayNew,
            conversion_rate: total > 0 ? Number(((converted / total) * 100).toFixed(1)) : 0,
        };
    }
    /**
     * 客户详情（含画像）
     */
    async findOne(id) {
        const customer = await this.prisma.customer.findUnique({
            where: { id },
            include: {
                opportunity: true,
                requirements: {
                    orderBy: { created_at: 'desc' },
                    take: 5,
                },
                _count: { select: { communications: true } },
            },
        });
        if (!customer) {
            throw new common_1.NotFoundException('客户不存在');
        }
        return customer;
    }
    /**
     * 从商机创建客户
     */
    async createFromOpportunity(opportunityId, name, contact) {
        const opportunity = await this.prisma.opportunity.findUnique({
            where: { id: opportunityId },
        });
        if (!opportunity) {
            throw new common_1.NotFoundException('商机不存在');
        }
        // 检查是否已创建客户
        const existing = await this.prisma.customer.findUnique({
            where: { opportunity_id: opportunityId },
        });
        if (existing) {
            return existing;
        }
        const customerName = name || opportunity.author || `客户-${opportunity.title.slice(0, 10)}`;
        const customer = await this.prisma.customer.create({
            data: {
                opportunity_id: opportunityId,
                name: customerName,
                contact: contact,
                level: shared_1.CustomerLevel.C,
                status: shared_1.CustomerStatus.NEW,
                intent_project: opportunity.title,
                deal_probability: 20,
            },
        });
        // 生成初始画像
        const profile = await this.profileService.buildInitial(opportunityId);
        await this.prisma.customer.update({
            where: { id: customer.id },
            data: { profile_json: JSON.parse(JSON.stringify(profile)) },
        });
        // 更新商机状态
        await this.prisma.opportunity.update({
            where: { id: opportunityId },
            data: { status: shared_1.OpportunityStatus.CLAIMED },
        });
        this.logger.log(`从商机创建客户: ${customer.name} (id=${customer.id})`);
        return this.findOne(customer.id);
    }
    /**
     * 获取客户沟通记录
     */
    async getCommunications(customerId, page = 1, pageSize = 50) {
        const customer = await this.prisma.customer.findUnique({
            where: { id: customerId },
        });
        if (!customer) {
            throw new common_1.NotFoundException('客户不存在');
        }
        const [list, total] = await Promise.all([
            this.prisma.communication.findMany({
                where: { customer_id: customerId },
                orderBy: { created_at: 'asc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            this.prisma.communication.count({ where: { customer_id: customerId } }),
        ]);
        return { list, total, page, pageSize };
    }
    /**
     * 客户分析（统计画像、沟通趋势、成交概率）
     */
    async getAnalysis(customerId) {
        const customer = await this.prisma.customer.findUnique({
            where: { id: customerId },
            include: {
                communications: { orderBy: { created_at: 'asc' } },
                requirements: true,
                opportunity: true,
            },
        });
        if (!customer) {
            throw new common_1.NotFoundException('客户不存在');
        }
        const communications = customer.communications;
        const inboundCount = communications.filter((c) => c.direction === 'inbound').length;
        const outboundCount = communications.filter((c) => c.direction === 'outbound').length;
        // 意图分布
        const intentDistribution = {};
        for (const comm of communications) {
            if (comm.intent_tag) {
                intentDistribution[comm.intent_tag] = (intentDistribution[comm.intent_tag] || 0) + 1;
            }
        }
        // 情绪趋势
        const emotionTrend = communications
            .filter((c) => c.direction === 'inbound' && c.emotion)
            .slice(-10)
            .map((c) => ({ time: c.created_at, emotion: c.emotion }));
        // 活跃度评分
        const daysSinceFirstContact = communications.length > 0
            ? Math.max(1, Math.ceil((Date.now() - communications[0].created_at.getTime()) / (1000 * 60 * 60 * 24)))
            : 1;
        const activityScore = Math.min(100, Math.round((communications.length / daysSinceFirstContact) * 20));
        return {
            customer_id: customerId,
            level: customer.level,
            status: customer.status,
            deal_probability: customer.deal_probability,
            communication_stats: {
                total: communications.length,
                inbound: inboundCount,
                outbound: outboundCount,
                response_rate: outboundCount > 0 ? Math.round((inboundCount / outboundCount) * 100) : 0,
            },
            intent_distribution: intentDistribution,
            emotion_trend: emotionTrend,
            activity_score: activityScore,
            requirements_count: customer.requirements.length,
            profile: customer.profile_json,
            recommendation: this.generateRecommendation(customer, communications.length, activityScore),
        };
    }
    generateRecommendation(customer, messageCount, activityScore) {
        if (customer.level === shared_1.CustomerLevel.A) {
            return 'A类重点客户，建议优先跟进，尽快推进需求确认和报价环节。';
        }
        if (customer.status === shared_1.CustomerStatus.INTENT_CLEAR) {
            return '客户需求已明确，建议立即启动需求解析和报价流程。';
        }
        if (activityScore < 20 && messageCount > 5) {
            return '客户活跃度下降，建议主动回访，了解当前顾虑。';
        }
        if (customer.level === shared_1.CustomerLevel.C && messageCount < 3) {
            return '新客户，建议先建立信任，了解基本需求后再推进。';
        }
        return '持续跟进中，保持定期沟通，逐步明确客户需求。';
    }
};
exports.CustomerService = CustomerService;
exports.CustomerService = CustomerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        customer_profile_service_1.CustomerProfileService])
], CustomerService);
//# sourceMappingURL=customer.service.js.map