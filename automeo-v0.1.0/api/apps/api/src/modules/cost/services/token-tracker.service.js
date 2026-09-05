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
exports.TokenTrackerService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
let TokenTrackerService = class TokenTrackerService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Token使用明细/汇总/按模型分组
     */
    async getTokenUsage(query) {
        const page = query.page || 1;
        const pageSize = query.page_size || 20;
        const skip = (page - 1) * pageSize;
        const where = {};
        if (query.project_id)
            where.project_id = query.project_id;
        if (query.model)
            where.model = query.model;
        const [total, list, summary] = await Promise.all([
            this.prisma.tokenUsage.count({ where }),
            this.prisma.tokenUsage.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { created_at: 'desc' },
                include: { project: { select: { name: true } } },
            }),
            this.prisma.tokenUsage.groupBy({
                by: ['model'],
                _sum: { prompt_tokens: true, completion_tokens: true, cost: true },
                _count: { id: true },
                where,
            }),
        ]);
        const totalPrompt = list.reduce((s, t) => s + t.prompt_tokens, 0);
        const totalCompletion = list.reduce((s, t) => s + t.completion_tokens, 0);
        const totalCost = list.reduce((s, t) => s + Number(t.cost), 0);
        return {
            total,
            page,
            page_size: pageSize,
            summary: {
                total_prompt_tokens: totalPrompt,
                total_completion_tokens: totalCompletion,
                total_tokens: totalPrompt + totalCompletion,
                total_cost: Number(totalCost.toFixed(4)),
            },
            by_model: summary.map((g) => ({
                model: g.model,
                prompt_tokens: g._sum.prompt_tokens || 0,
                completion_tokens: g._sum.completion_tokens || 0,
                total_tokens: (g._sum.prompt_tokens || 0) + (g._sum.completion_tokens || 0),
                cost: Number(g._sum.cost || 0),
                call_count: g._count.id,
            })),
            list: list.map((t) => ({
                ...t,
                cost: Number(t.cost),
                project_name: t.project?.name || null,
            })),
        };
    }
};
exports.TokenTrackerService = TokenTrackerService;
exports.TokenTrackerService = TokenTrackerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TokenTrackerService);
//# sourceMappingURL=token-tracker.service.js.map