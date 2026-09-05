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
exports.RequirementService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const requirement_parser_service_1 = require("./requirement-parser.service");
const wbs_service_1 = require("./wbs.service");
const quote_service_1 = require("./quote.service");
const agreement_service_1 = require("./agreement.service");
const shared_1 = require("../../../../../../packages/shared/src");
const client_1 = require("@prisma/client");
let RequirementService = class RequirementService {
    constructor(prisma, parserService, wbsService, quoteService, agreementService) {
        this.prisma = prisma;
        this.parserService = parserService;
        this.wbsService = wbsService;
        this.quoteService = quoteService;
        this.agreementService = agreementService;
        this.logger = new common_1.Logger('RequirementService');
    }
    /**
     * 需求列表
     */
    async findAll(query) {
        const { page = 1, pageSize = 20, status, customer_id } = query;
        const where = {};
        if (status)
            where.status = status;
        if (customer_id)
            where.customer_id = customer_id;
        const [list, total] = await Promise.all([
            this.prisma.requirement.findMany({
                where,
                orderBy: { created_at: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: {
                    customer: { select: { id: true, name: true, level: true } },
                    _count: { select: { items: true } },
                },
            }),
            this.prisma.requirement.count({ where }),
        ]);
        return { list, total, page, pageSize };
    }
    /**
     * 需求详情（含功能清单和报价）
     */
    async findOne(id) {
        const requirement = await this.prisma.requirement.findUnique({
            where: { id },
            include: {
                customer: true,
                items: {
                    orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
                },
                project: true,
            },
        });
        if (!requirement) {
            throw new common_1.NotFoundException('需求不存在');
        }
        // 构建树形结构
        const itemsTree = this.buildItemTree(requirement.items);
        return {
            ...requirement,
            items_tree: itemsTree,
        };
    }
    /**
     * 创建需求草稿（从客户沟通记录解析）
     */
    async createDraft(dto) {
        const customer = await this.prisma.customer.findUnique({
            where: { id: dto.customer_id },
            include: {
                communications: {
                    orderBy: { created_at: 'asc' },
                    take: 50,
                },
            },
        });
        if (!customer) {
            throw new common_1.NotFoundException('客户不存在');
        }
        // 解析需求
        const parsed = await this.parserService.parse(customer.communications.map((c) => ({
            direction: c.direction,
            content: c.content,
            created_at: c.created_at,
        })), customer.name);
        const requirement = await this.prisma.requirement.create({
            data: {
                customer_id: dto.customer_id,
                title: dto.title || parsed.title,
                feature_list: parsed,
                status: shared_1.RequirementStatus.DRAFT,
            },
        });
        // WBS 拆解
        await this.wbsService.decompose(requirement.id, requirement.title, parsed.features.map((f) => f.description).join('\n'), parsed.features);
        // 计算报价
        await this.quoteService.calculate(requirement.id);
        // 更新状态为待确认
        await this.prisma.requirement.update({
            where: { id: requirement.id },
            data: { status: shared_1.RequirementStatus.PENDING_CONFIRM },
        });
        // 更新客户状态
        await this.prisma.customer.update({
            where: { id: dto.customer_id },
            data: { status: shared_1.CustomerStatus.INTENT_CLEAR },
        });
        this.logger.log(`需求草稿创建完成: ${requirement.title} (id=${requirement.id})`);
        return this.findOne(requirement.id);
    }
    /**
     * 确认需求（创建项目）
     */
    async confirm(id, userId) {
        const requirement = await this.prisma.requirement.findUnique({
            where: { id },
            include: { customer: true, items: true },
        });
        if (!requirement) {
            throw new common_1.NotFoundException('需求不存在');
        }
        if (requirement.status === shared_1.RequirementStatus.CONFIRMED) {
            return requirement;
        }
        // 创建项目
        const project = await this.prisma.project.create({
            data: {
                user_id: userId || 'system',
                requirement_id: id,
                name: requirement.title,
                status: shared_1.ProjectStatus.PENDING,
                total_hours: requirement.estimated_hours || new client_1.Prisma.Decimal(0),
                revenue: requirement.quoted_price || new client_1.Prisma.Decimal(0),
                cost: requirement.cost_estimate || new client_1.Prisma.Decimal(0),
                profit: requirement.quoted_price && requirement.cost_estimate
                    ? requirement.quoted_price.minus(requirement.cost_estimate)
                    : new client_1.Prisma.Decimal(0),
            },
        });
        // 更新需求状态
        await this.prisma.requirement.update({
            where: { id },
            data: {
                status: shared_1.RequirementStatus.CONFIRMED,
                confirmed_at: new Date(),
            },
        });
        // 更新客户状态
        await this.prisma.customer.update({
            where: { id: requirement.customer_id },
            data: { status: shared_1.CustomerStatus.CONVERTED },
        });
        this.logger.log(`需求已确认，项目已创建: ${project.name} (project_id=${project.id})`);
        return { requirement: await this.findOne(id), project };
    }
    /**
     * 获取需求报价明细
     */
    async getQuote(id, ruleId) {
        return this.quoteService.calculate(id, ruleId);
    }
    /**
     * 获取合作协议 HTML
     */
    async getAgreement(id) {
        return this.agreementService.generate(id);
    }
    /**
     * 构建功能项树形结构
     */
    buildItemTree(items) {
        const map = new Map();
        const roots = [];
        for (const item of items) {
            map.set(item.id, {
                id: item.id,
                name: item.name,
                description: item.description,
                complexity: item.complexity,
                estimated_hours: item.estimated_hours.toNumber(),
                sort_order: item.sort_order,
                children: [],
            });
        }
        for (const item of items) {
            const node = map.get(item.id);
            if (item.parent_id && map.has(item.parent_id)) {
                const parent = map.get(item.parent_id);
                parent.children.push(node);
            }
            else {
                roots.push(node);
            }
        }
        return roots;
    }
};
exports.RequirementService = RequirementService;
exports.RequirementService = RequirementService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        requirement_parser_service_1.RequirementParserService,
        wbs_service_1.WbsService,
        quote_service_1.QuoteService,
        agreement_service_1.AgreementService])
], RequirementService);
//# sourceMappingURL=requirement.service.js.map