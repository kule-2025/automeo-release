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
exports.CostAggregateJob = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../prisma/prisma.service");
/**
 * 成本汇总定时任务 - 每小时执行
 * 按项目汇总 TokenUsage 和算力使用 → CostRecord
 */
let CostAggregateJob = class CostAggregateJob {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger('CostAggregateJob');
    }
    async execute() {
        this.logger.log('开始执行成本汇总...');
        try {
            // 获取最近1小时的Token消耗，按项目分组
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            const tokenUsages = await this.prisma.tokenUsage.findMany({
                where: { created_at: { gte: oneHourAgo } },
            });
            const projectCosts = new Map();
            for (const usage of tokenUsages) {
                if (usage.project_id) {
                    const current = projectCosts.get(usage.project_id) || 0;
                    projectCosts.set(usage.project_id, current + Number(usage.cost));
                }
            }
            // 查找或创建token分类
            let tokenCategory = await this.prisma.costCategory.findFirst({ where: { type: 'token' } });
            if (!tokenCategory) {
                tokenCategory = await this.prisma.costCategory.create({
                    data: { name: 'Token消耗', type: 'token', unit: 'tokens' },
                });
            }
            for (const [projectId, amount] of projectCosts) {
                if (amount > 0) {
                    await this.prisma.costRecord.create({
                        data: {
                            project_id: projectId,
                            category_id: tokenCategory.id,
                            amount,
                            description: `小时Token成本汇总 ${new Date().toISOString()}`,
                        },
                    });
                }
            }
            this.logger.log(`成本汇总完成，涉及 ${projectCosts.size} 个项目`);
        }
        catch (e) {
            this.logger.error(`成本汇总失败: ${e.message}`);
        }
    }
};
exports.CostAggregateJob = CostAggregateJob;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CostAggregateJob.prototype, "execute", null);
exports.CostAggregateJob = CostAggregateJob = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CostAggregateJob);
//# sourceMappingURL=cost-aggregate.job.js.map