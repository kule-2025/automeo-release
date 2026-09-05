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
exports.RiskService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
let RiskService = class RiskService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger('RiskService');
    }
    /**
     * 风险事件检测：扫描异常模式
     */
    async detectRisks() {
        const risks = [];
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        try {
            // 1. 检测失败率异常
            const failedTasks = await this.prisma.projectTask.count({
                where: { status: 'failed', updated_at: { gte: todayStart } },
            });
            const totalTasks = await this.prisma.projectTask.count({
                where: { updated_at: { gte: todayStart } },
            });
            if (totalTasks > 10 && failedTasks / totalTasks > 0.2) {
                risks.push({
                    type: 'high_failure_rate',
                    level: 'critical',
                    message: `任务失败率异常: ${((failedTasks / totalTasks) * 100).toFixed(1)}% (超过20%阈值)`,
                    detail: { failed: failedTasks, total: totalTasks },
                });
            }
            // 2. 检测预算超支
            const frozenBudgets = await this.prisma.budget.count({ where: { is_frozen: true } });
            if (frozenBudgets > 0) {
                risks.push({
                    type: 'budget_frozen',
                    level: 'warning',
                    message: `${frozenBudgets} 个项目预算已冻结`,
                    detail: { frozen_count: frozenBudgets },
                });
            }
            // 3. 检测算力资源异常
            const errorResources = await this.prisma.computeResource.count({
                where: { status: 'error' },
            });
            if (errorResources > 0) {
                risks.push({
                    type: 'resource_error',
                    level: 'critical',
                    message: `${errorResources} 个算力资源处于异常状态`,
                    detail: { error_count: errorResources },
                });
            }
            // 4. 检测未处理严重告警
            const pendingCritical = await this.prisma.alertEvent.count({
                where: { level: 'critical', status: 'pending' },
            });
            if (pendingCritical > 5) {
                risks.push({
                    type: 'alert_backlog',
                    level: 'warning',
                    message: `存在 ${pendingCritical} 条未处理严重告警`,
                    detail: { pending_critical: pendingCritical },
                });
            }
        }
        catch (e) {
            this.logger.warn(`风险检测异常: ${e.message}`);
        }
        // 自动创建告警
        for (const risk of risks) {
            await this.prisma.alertEvent.create({
                data: {
                    module: 'system',
                    level: risk.level,
                    message: risk.message,
                    status: 'pending',
                    detail_json: { type: risk.type, ...risk.detail },
                },
            });
        }
        this.logger.log(`风险检测完成: 发现 ${risks.length} 个风险事件`);
        return risks;
    }
};
exports.RiskService = RiskService;
exports.RiskService = RiskService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RiskService);
//# sourceMappingURL=risk.service.js.map