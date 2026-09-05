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
exports.CodeAgentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const ai_gateway_service_1 = require("../../ai-gateway/services/ai-gateway.service");
const coder_agent_1 = require("../agents/coder.agent");
const tester_agent_1 = require("../agents/tester.agent");
const git_service_1 = require("./git.service");
const workspace_manager_1 = require("../workspace/workspace-manager");
const code_review_queue_1 = require("../queues/code-review.queue");
const shared_1 = require("../../../../../../packages/shared/src");
/**
 * 代码Agent服务 - 编排编码→写文件→Git提交→自测→审查
 */
let CodeAgentService = class CodeAgentService {
    constructor(prisma, aiGateway, coderAgent, testerAgent, gitService, workspaceManager, codeReviewQueue) {
        this.prisma = prisma;
        this.aiGateway = aiGateway;
        this.coderAgent = coderAgent;
        this.testerAgent = testerAgent;
        this.gitService = gitService;
        this.workspaceManager = workspaceManager;
        this.codeReviewQueue = codeReviewQueue;
        this.logger = new common_1.Logger('CodeAgentService');
    }
    /**
     * 执行任务：准备上下文→生成代码→写入文件→Git提交→记录提交→自测→加入审查队列
     */
    async execute(taskId) {
        this.logger.log(`开始执行任务: ${taskId}`);
        const task = await this.prisma.projectTask.findUnique({
            where: { id: taskId },
            include: { project: true },
        });
        if (!task) {
            throw new common_1.NotFoundException('任务不存在');
        }
        try {
            // 1. 准备上下文
            const context = await this.buildContext(task);
            // 2. 调用CoderAgent生成代码
            const { code, files } = await this.coderAgent.run({
                taskDescription: `${task.name}\n${task.description ?? ''}`,
                techStack: task.tech_stack ?? 'TypeScript/Node.js',
                context,
                projectId: task.project_id,
                taskId: task.id,
            });
            // 3. 确保项目工作区存在并写入文件
            this.workspaceManager.createProjectDir(task.project_id);
            const writtenPaths = this.workspaceManager.writeFiles(task.project_id, files);
            // 4. Git提交（开发环境模拟）
            const projectDir = this.workspaceManager.getProjectDir(task.project_id);
            await this.gitService.init(projectDir);
            const commitHash = await this.gitService.commit(projectDir, `feat: ${task.name}`);
            // 5. 调用TesterAgent生成测试并执行
            const testResult = await this.testerAgent.run({
                code,
                file: files[0]?.path ?? 'main.ts',
                techStack: task.tech_stack ?? 'TypeScript/Node.js',
                projectId: task.project_id,
                taskId: task.id,
            });
            // 写入测试文件
            if (testResult.test_code) {
                this.workspaceManager.writeFiles(task.project_id, [
                    { path: testResult.test_file, content: testResult.test_code },
                ]);
            }
            // 6. 记录CodeSubmission
            const submission = await this.prisma.codeSubmission.create({
                data: {
                    task_id: task.id,
                    project_id: task.project_id,
                    commit_hash: commitHash,
                    file_changes: { files: writtenPaths, count: writtenPaths.length },
                    quality_score: null,
                    self_test_result: {
                        pass_rate: testResult.pass_rate,
                        total_tests: testResult.total_tests,
                        passed_tests: testResult.passed_tests,
                        failed_tests: testResult.failed_tests,
                    },
                    review_issues: [],
                },
            });
            // 7. 更新任务状态为自测中
            await this.prisma.projectTask.update({
                where: { id: task.id },
                data: {
                    status: shared_1.TaskStatus.SELF_TESTING,
                    agent_name: 'CoderAgent',
                    actual_hours: { increment: task.estimated_hours },
                },
            });
            this.logger.log(`任务执行完成: ${task.name}, commit=${commitHash}, 测试通过率=${(testResult.pass_rate * 100).toFixed(1)}%`);
            // 8. 加入代码审查队列
            await this.codeReviewQueue.add(task.id);
        }
        catch (error) {
            this.logger.error(`任务执行失败: ${task.name}, 错误: ${error.message}`);
            await this.prisma.projectTask.update({
                where: { id: task.id },
                data: { status: shared_1.TaskStatus.FAILED },
            });
            // 记录告警
            await this.prisma.alertEvent.create({
                data: {
                    module: 'project',
                    level: 'critical',
                    message: `任务执行失败: ${task.name}`,
                    detail_json: { task_id: task.id, error: error.message },
                },
            });
        }
    }
    /**
     * 构建任务上下文（项目信息、依赖任务产出等）
     */
    async buildContext(task) {
        const parts = [];
        // 项目信息
        const project = await this.prisma.project.findUnique({
            where: { id: task.project_id },
            select: { name: true, status: true },
        });
        if (project) {
            parts.push(`项目: ${project.name}`);
        }
        // 依赖任务的产出
        const deps = task.dependencies ?? [];
        if (deps.length > 0) {
            const depSubmissions = await this.prisma.codeSubmission.findMany({
                where: { task_id: { in: deps } },
                orderBy: { submitted_at: 'desc' },
                take: 3,
            });
            if (depSubmissions.length > 0) {
                parts.push(`依赖任务提交数: ${depSubmissions.length}`);
            }
        }
        return parts.join('\n');
    }
};
exports.CodeAgentService = CodeAgentService;
exports.CodeAgentService = CodeAgentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ai_gateway_service_1.AIGatewayService,
        coder_agent_1.CoderAgent,
        tester_agent_1.TesterAgent,
        git_service_1.GitService,
        workspace_manager_1.WorkspaceManager,
        code_review_queue_1.CodeReviewQueue])
], CodeAgentService);
//# sourceMappingURL=code-agent.service.js.map