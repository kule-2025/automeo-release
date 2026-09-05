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
exports.BudgetService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
let BudgetService = class BudgetService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger('BudgetService');
    }
    /**
     * 检查项目预算
     * 已耗/预算≥80%预警, ≥100%熔断暂停AI调用
     */
    async check(projectId) {
        const budget = await this.prisma.budget.findUnique({
            where: { project_id: projectId },
        });
        if (!budget) {
            return {
                project_id: projectId,
                total_budget: 0,
                used_amount: 0,
                remaining: 0,
                usage_ratio: 0,
                status: 'normal',
                warn_ratio: 0.8,
                stop_ratio: 1.0,
            };
        }
        const totalBudget = Number(budget.total_budget);
        const usedAmount = Number(budget.used_amount);
        const warnRatio = Number(budget.warn_ratio);
        const stopRatio = Number(budget.stop_ratio);
        const usageRatio = totalBudget > 0 ? Number((usedAmount / totalBudget).toFixed(4)) : 0;
        const remaining = Number((totalBudget - usedAmount).toFixed(2));
        let status = 'normal';
        if (usageRatio >= stopRatio || budget.is_frozen) {
            status = 'frozen';
            // 熔断：冻结预算
            if (!budget.is_frozen) {
                await this.prisma.budget.update({
                    where: { id: budget.id },
                    data: { is_frozen: true },
                });
                await this.prisma.alertEvent.create({
                    data: {
                        module: 'cost',
                        level: 'critical',
                        message: `项目预算已用尽(${usageRatio * 100}%)，AI调用已熔断暂停`,
                        status: 'pending',
                        detail_json: { project_id: projectId, usage_ratio: usageRatio },
                    },
                });
                this.logger.warn(`预算熔断: projectId=${projectId}, usage=${usageRatio}`);
            }
        }
        else if (usageRatio >= warnRatio) {
            status = 'warning';
            await this.prisma.alertEvent.create({
                data: {
                    module: 'cost',
                    level: 'warning',
                    message: `项目预算使用已达 ${(usageRatio * 100).toFixed(1)}%，请注意控制成本`,
                    status: 'pending',
                    detail_json: { project_id: projectId, usage_ratio: usageRatio },
                },
            });
        }
        return {
            project_id: projectId,
            total_budget: totalBudget,
            used_amount: usedAmount,
            remaining,
            usage_ratio: usageRatio,
            status,
            warn_ratio: warnRatio,
            stop_ratio: stopRatio,
        };
    }
};
exports.BudgetService = BudgetService;
exports.BudgetService = BudgetService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BudgetService);
//# sourceMappingURL=budget.service.js.map