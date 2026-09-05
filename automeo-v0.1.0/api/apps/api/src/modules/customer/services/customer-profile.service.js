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
exports.CustomerProfileService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
/**
 * 客户画像服务
 * 从商机生成初始画像，并根据沟通记录持续更新
 */
let CustomerProfileService = class CustomerProfileService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger('CustomerProfile');
    }
    /**
     * 从商机生成初始客户画像
     */
    async buildInitial(opportunityId) {
        const opportunity = await this.prisma.opportunity.findUnique({
            where: { id: opportunityId },
            include: { source: true },
        });
        if (!opportunity) {
            throw new Error('商机不存在');
        }
        const profile = {
            basic_info: {
                source: opportunity.source?.name || opportunity.source_platform,
                role: this.inferRole(opportunity.author || ''),
            },
            requirements: {
                description: opportunity.description || '',
                project_type: this.inferProjectType(opportunity.title + ' ' + (opportunity.description || '')),
                tech_stack: this.extractTechStack(opportunity.title + ' ' + (opportunity.description || '')),
                budget_range: opportunity.estimated_amount
                    ? `¥${opportunity.estimated_amount.toNumber()}`
                    : '待确认',
                timeline: '待确认',
            },
            preferences: {
                communication_style: '专业简洁',
                priority_topics: [],
                concerns: [],
            },
            interaction_summary: `来自${opportunity.source?.name || opportunity.source_platform}的商机，初始画像已生成。`,
            tags: this.generateTags(opportunity),
        };
        return profile;
    }
    /**
     * 根据沟通记录更新客户画像
     */
    async updateProfile(customerId) {
        const customer = await this.prisma.customer.findUnique({
            where: { id: customerId },
            include: {
                communications: {
                    orderBy: { created_at: 'asc' },
                    take: 50,
                },
            },
        });
        if (!customer) {
            throw new Error('客户不存在');
        }
        const existing = customer.profile_json || {
            basic_info: {},
            requirements: {},
            preferences: {},
            interaction_summary: '',
            tags: [],
        };
        const messages = customer.communications;
        const allText = messages.map((m) => m.content).join('\n');
        // 从沟通中提取新信息
        const techStack = this.extractTechStack(allText);
        const budgetMention = this.extractBudget(allText);
        const timelineMention = this.extractTimeline(allText);
        const concerns = this.extractConcerns(allText);
        const updated = {
            basic_info: {
                ...existing.basic_info,
            },
            requirements: {
                ...existing.requirements,
                tech_stack: techStack.length > 0 ? techStack : existing.requirements.tech_stack,
                budget_range: budgetMention || existing.requirements.budget_range,
                timeline: timelineMention || existing.requirements.timeline,
            },
            preferences: {
                ...existing.preferences,
                concerns: concerns.length > 0 ? concerns : existing.preferences.concerns,
            },
            interaction_summary: this.generateSummary(messages.length, customer.level),
            tags: this.updateTags(existing.tags, allText, customer.level),
        };
        // 持久化更新
        await this.prisma.customer.update({
            where: { id: customerId },
            data: { profile_json: JSON.parse(JSON.stringify(updated)) },
        });
        return updated;
    }
    inferRole(author) {
        if (!author)
            return '未知';
        if (/ceo|founder|创始人|老板/.test(author))
            return '创始人/CEO';
        if (/pm|product|产品/.test(author))
            return '产品经理';
        if (/cto|tech|技术/.test(author))
            return '技术负责人';
        return '需求方';
    }
    inferProjectType(text) {
        if (/小程序|wechat|微信/.test(text))
            return '微信小程序';
        if (/app|ios|android|移动端/.test(text))
            return '移动App';
        if (/web|网站|网页|前端|后台|管理系统/.test(text))
            return 'Web应用';
        if (/api|接口|后端|服务/.test(text))
            return '后端服务/API';
        if (/爬虫|数据|采集/.test(text))
            return '数据采集';
        return '定制开发';
    }
    extractTechStack(text) {
        const patterns = {
            React: /react|next\.js/i,
            Vue: /vue|nuxt/i,
            Node: /node\.js|nodejs|express|nest/i,
            TypeScript: /typescript|ts/i,
            Python: /python|django|flask|fastapi/i,
            Java: /java|spring/i,
            Go: /\bgo\b|golang|gin/i,
            '微信小程序': /小程序|wechat|wxml/i,
            MySQL: /mysql|sql/i,
            MongoDB: /mongo/i,
            Redis: /redis/i,
            Docker: /docker|k8s|kubernetes/i,
        };
        const found = [];
        for (const [tech, regex] of Object.entries(patterns)) {
            if (regex.test(text))
                found.push(tech);
        }
        return found;
    }
    extractBudget(text) {
        const match = text.match(/(\d+(?:\.\d+)?)\s*(万|k|元|块|美元|\$)/i);
        if (match) {
            const amount = match[1];
            const unit = match[2];
            if (unit === '万')
                return `¥${amount}万`;
            if (unit === 'k' || unit === 'K')
                return `¥${Number(amount) * 1000}`;
            if (unit === '$' || unit === '美元')
                return `$${amount}`;
            return `¥${amount}`;
        }
        return undefined;
    }
    extractTimeline(text) {
        const match = text.match(/(\d+)\s*(周|个月|月|天|星期)/);
        if (match)
            return `${match[1]}${match[2]}`;
        if (/尽快|紧急|马上|立刻/.test(text))
            return '紧急（尽快）';
        return undefined;
    }
    extractConcerns(text) {
        const concerns = [];
        if (/质量|bug|稳定|可靠/.test(text))
            concerns.push('代码质量');
        if (/时间|工期|deadline|交付/.test(text))
            concerns.push('交付时间');
        if (/价格|贵|预算|成本/.test(text))
            concerns.push('价格敏感');
        if (/售后|维护|迭代/.test(text))
            concerns.push('后期维护');
        if (/安全|隐私|数据/.test(text))
            concerns.push('数据安全');
        return concerns;
    }
    generateTags(opportunity) {
        const tags = [];
        const text = opportunity.title + ' ' + (opportunity.description || '');
        if (/远程|remote|兼职|外包/.test(text))
            tags.push('远程外包');
        if (/创业|初创|startup/.test(text))
            tags.push('创业公司');
        if (/企业|公司|集团/.test(text))
            tags.push('企业客户');
        if (opportunity.match_score && opportunity.match_score >= 80)
            tags.push('高匹配');
        return tags;
    }
    updateTags(existing, text, level) {
        const tags = new Set(existing);
        if (level === 'A')
            tags.add('A类重点');
        if (/长期|合作|后续/.test(text))
            tags.add('长期合作意向');
        if (/推荐|介绍|朋友/.test(text))
            tags.add('转介绍潜力');
        return Array.from(tags);
    }
    generateSummary(messageCount, level) {
        return `累计沟通${messageCount}轮，客户等级${level}级。系统持续跟踪客户需求变化。`;
    }
};
exports.CustomerProfileService = CustomerProfileService;
exports.CustomerProfileService = CustomerProfileService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CustomerProfileService);
//# sourceMappingURL=customer-profile.service.js.map