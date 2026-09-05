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
exports.CodeReviewService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const ai_gateway_service_1 = require("../../ai-gateway/services/ai-gateway.service");
const reviewer_agent_1 = require("../agents/reviewer.agent");
const workspace_manager_1 = require("../workspace/workspace-manager");
const shared_1 = require("../../../../../../packages/shared/src");
/**
 * 代码审查服务 - 审查代码→生成测试→计算质量评分→判定通过/修复重试
 */
let CodeReviewService = class CodeReviewService {
    constructor(prisma, aiGateway, reviewerAgent, workspaceManager) {
        this.prisma = prisma;
        this.aiGateway = aiGateway;
        this.reviewerAgent = reviewerAgent;
        this.workspaceManager = workspaceManager;
        this.logger = new common_1.Logger('CodeReviewService');
    }
    /**
     * 审查任务代码
     * 质量评分≥80且测试通过率≥90%→待交付，否则修复重试（最多3次，超3次触发告警）
     */
    async review(taskId) {
        this.logger.log(`开始代码审查: ${taskId}`);
        const task = await this.prisma.projectTask.findUnique({
            where: { id: taskId },
            include: { submissions: { orderBy: { submitted_at: 'desc' }, take: 1 } },
        });
        if (!task) {
            this.logger.error(`任务不存在: ${taskId}`);
            return;
        }
        const latestSubmission = task.submissions[0];
        if (!latestSubmission) {
            this.logger.warn(`任务无提交记录: ${taskId}`);
            return;
        }
        try {
            // 1. 读取项目代码
            const files = this.workspaceManager.readAllFiles(task.project_id);
            const code = files.map((f) => `// === ${f.path} ===\n${f.content}`).join('\n\n');
            // 2. 调用ReviewerAgent审查
            const reviewResult = await this.reviewerAgent.run({
                code,
                file: files[0]?.path ?? 'main.ts',
                projectId: task.project_id,
            });
            // 3. 计算综合质量评分
            const overallScore = this.calculateOverallScore(reviewResult);
            const testPassRate = latestSubmission.self_test_result?.pass_rate ??
                reviewResult.test_pass_rate;
            // 4. 更新提交记录
            await this.prisma.codeSubmission.update({
                where: { id: latestSubmission.id },
                data: {
                    quality_score: overallScore,
                    review_issues: JSON.parse(JSON.stringify(reviewResult.issues)),
                },
            });
            // 5. 判定是否通过
            const passed = overallScore >= shared_1.QUALITY_PASS_SCORE && testPassRate >= shared_1.TEST_PASS_RATIO;
            if (passed) {
                // 通过 → 待交付
                await this.prisma.projectTask.update({
                    where: { id: task.id },
                    data: {
                        status: shared_1.TaskStatus.READY_FOR_DELIVERY,
                        completed_at: new Date(),
                    },
                });
                this.logger.log(`代码审查通过: ${task.name}, 评分=${overallScore}, 测试通过率=${(testPassRate * 100).toFixed(1)}%`);
            }
            else {
                // 未通过 → 检查重试次数
                const retryCount = task.retry_count + 1;
                if (retryCount > shared_1.MAX_CODE_RETRY) {
                    // 超过最大重试次数 → 触发告警
                    await this.prisma.projectTask.update({
                        where: { id: task.id },
                        data: { status: shared_1.TaskStatus.FAILED, retry_count: retryCount },
                    });
                    await this.prisma.alertEvent.create({
                        data: {
                            module: 'project',
                            level: 'critical',
                            message: `代码审查超过最大重试次数: ${task.name} (评分=${overallScore})`,
                            detail_json: JSON.parse(JSON.stringify({
                                task_id: task.id,
                                score: overallScore,
                                test_pass_rate: testPassRate,
                                issues: reviewResult.issues,
                            })),
                        },
                    });
                    this.logger.error(`代码审查超限失败: ${task.name}, 重试${retryCount}次`);
                }
                else {
                    // 修复重试 → 重置为待开始，由TaskScheduler调度重新执行
                    await this.prisma.projectTask.update({
                        where: { id: task.id },
                        data: {
                            status: shared_1.TaskStatus.PENDING,
                            retry_count: retryCount,
                            started_at: null,
                        },
                    });
                    this.logger.log(`代码审查未通过，第${retryCount}次修复: ${task.name}, 评分=${overallScore}, 已重置待调度`);
                }
            }
        }
        catch (error) {
            this.logger.error(`代码审查异常: ${task.name}, 错误: ${error.message}`);
        }
    }
    /**
     * 计算综合质量评分（四维度加权平均）
     */
    calculateOverallScore(reviewResult) {
        const scores = reviewResult.scores;
        const dimensions = ['readability', 'maintainability', 'security', 'performance'];
        const values = dimensions
            .map((d) => scores[d] ?? 0)
            .filter((v) => v > 0);
        if (values.length === 0)
            return reviewResult.overall_score ?? 70;
        // 安全性权重更高
        const weights = {
            readability: 0.2,
            maintainability: 0.3,
            security: 0.3,
            performance: 0.2,
        };
        let weightedSum = 0;
        let weightTotal = 0;
        for (const dim of dimensions) {
            if (scores[dim] !== undefined && scores[dim] > 0) {
                weightedSum += scores[dim] * weights[dim];
                weightTotal += weights[dim];
            }
        }
        return weightTotal > 0 ? Math.round(weightedSum / weightTotal) : reviewResult.overall_score ?? 70;
    }
};
exports.CodeReviewService = CodeReviewService;
exports.CodeReviewService = CodeReviewService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ai_gateway_service_1.AIGatewayService,
        reviewer_agent_1.ReviewerAgent,
        workspace_manager_1.WorkspaceManager])
], CodeReviewService);
//# sourceMappingURL=code-review.service.js.map