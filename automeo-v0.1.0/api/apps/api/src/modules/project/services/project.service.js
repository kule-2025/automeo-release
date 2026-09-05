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
exports.ProjectService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const shared_1 = require("../../../../../../packages/shared/src");
let ProjectService = class ProjectService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger('ProjectService');
    }
    /**
     * 项目列表（支持状态筛选）
     */
    async findAll(query) {
        const where = {};
        if (query.status) {
            where.status = query.status;
        }
        if (query.keyword) {
            where.name = { contains: query.keyword };
        }
        const [list, total] = await Promise.all([
            this.prisma.project.findMany({
                where,
                orderBy: { created_at: 'desc' },
                skip: ((query.page ?? 1) - 1) * (query.pageSize ?? 20),
                take: query.pageSize ?? 20,
                include: {
                    _count: { select: { tasks: true } },
                },
            }),
            this.prisma.project.count({ where }),
        ]);
        const serialized = list.map((p) => ({
            ...p,
            total_hours: Number(p.total_hours),
            progress: Number(p.progress),
            revenue: Number(p.revenue),
            cost: Number(p.cost),
            profit: Number(p.profit),
            task_count: p._count.tasks,
        }));
        return { list: serialized, total };
    }
    /**
     * 项目详情
     */
    async findOne(id) {
        const project = await this.prisma.project.findUnique({
            where: { id },
            include: {
                tasks: { orderBy: { priority: 'desc' } },
                _count: { select: { tasks: true, submissions: true, deliveries: true } },
            },
        });
        if (!project) {
            throw new common_1.NotFoundException('项目不存在');
        }
        return {
            ...project,
            total_hours: Number(project.total_hours),
            progress: Number(project.progress),
            revenue: Number(project.revenue),
            cost: Number(project.cost),
            profit: Number(project.profit),
            tasks: project.tasks.map((t) => ({
                ...t,
                estimated_hours: Number(t.estimated_hours),
                actual_hours: Number(t.actual_hours),
            })),
        };
    }
    /**
     * 获取看板任务（按状态分组）
     */
    async getTasks(projectId) {
        const tasks = await this.prisma.projectTask.findMany({
            where: { project_id: projectId },
            orderBy: [{ priority: 'desc' }, { created_at: 'asc' }],
        });
        const toCard = (t) => ({
            id: t.id,
            name: t.name,
            description: t.description,
            estimated_hours: Number(t.estimated_hours),
            actual_hours: Number(t.actual_hours),
            status: t.status,
            tech_stack: t.tech_stack,
            priority: t.priority,
            agent_name: t.agent_name,
            retry_count: t.retry_count,
            dependencies: t.dependencies ?? null,
        });
        return {
            pending: tasks.filter((t) => t.status === shared_1.TaskStatus.PENDING).map(toCard),
            in_progress: tasks.filter((t) => t.status === shared_1.TaskStatus.IN_PROGRESS).map(toCard),
            self_testing: tasks.filter((t) => t.status === shared_1.TaskStatus.SELF_TESTING).map(toCard),
            ready_for_delivery: tasks
                .filter((t) => t.status === shared_1.TaskStatus.READY_FOR_DELIVERY)
                .map(toCard),
        };
    }
    /**
     * 获取单个任务
     */
    async getTask(taskId) {
        const task = await this.prisma.projectTask.findUnique({
            where: { id: taskId },
            include: { submissions: { orderBy: { submitted_at: 'desc' } } },
        });
        if (!task) {
            throw new common_1.NotFoundException('任务不存在');
        }
        return {
            ...task,
            estimated_hours: Number(task.estimated_hours),
            actual_hours: Number(task.actual_hours),
            submissions: task.submissions.map((s) => this.serializeSubmission(s)),
        };
    }
    /**
     * 获取任务提交记录
     */
    async getSubmissions(taskId) {
        const submissions = await this.prisma.codeSubmission.findMany({
            where: { task_id: taskId },
            orderBy: { submitted_at: 'desc' },
        });
        return submissions.map((s) => this.serializeSubmission(s));
    }
    /**
     * 获取质量报告
     */
    async getQualityReport(projectId) {
        const submissions = await this.prisma.codeSubmission.findMany({
            where: { project_id: projectId },
            orderBy: { submitted_at: 'desc' },
        });
        const scoredSubmissions = submissions.filter((s) => s.quality_score !== null);
        const avgScore = scoredSubmissions.length > 0
            ? Math.round(scoredSubmissions.reduce((sum, s) => sum + (s.quality_score ?? 0), 0) /
                scoredSubmissions.length)
            : 0;
        // 聚合所有审查问题
        const allIssues = [];
        for (const s of submissions) {
            if (s.review_issues && Array.isArray(s.review_issues)) {
                allIssues.push(...s.review_issues);
            }
        }
        // 按严重程度排序
        const severityOrder = { critical: 0, warning: 1, suggestion: 2 };
        allIssues.sort((a, b) => (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9));
        // 计算各维度平均分（从问题中推断或使用默认）
        const dimensions = this.calculateDimensions(scoredSubmissions, allIssues);
        return {
            overall_score: avgScore,
            dimensions,
            test_pass_rate: this.calculateAvgTestPassRate(submissions),
            issues: allIssues,
            submissions: submissions.map((s) => this.serializeSubmission(s)),
        };
    }
    /**
     * 获取项目进度详情
     */
    async getProgress(projectId) {
        const tasks = await this.prisma.projectTask.findMany({
            where: { project_id: projectId },
            select: {
                id: true,
                status: true,
                estimated_hours: true,
                actual_hours: true,
            },
        });
        const total = tasks.length;
        const completed = tasks.filter((t) => [shared_1.TaskStatus.READY_FOR_DELIVERY, shared_1.TaskStatus.COMPLETED].includes(t.status)).length;
        const inProgress = tasks.filter((t) => [shared_1.TaskStatus.IN_PROGRESS, shared_1.TaskStatus.SELF_TESTING].includes(t.status)).length;
        const pending = tasks.filter((t) => t.status === shared_1.TaskStatus.PENDING).length;
        const totalEstimated = tasks.reduce((sum, t) => sum + Number(t.estimated_hours), 0);
        const totalActual = tasks.reduce((sum, t) => sum + Number(t.actual_hours), 0);
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
        return {
            project_id: projectId,
            progress,
            total_tasks: total,
            completed_tasks: completed,
            in_progress_tasks: inProgress,
            pending_tasks: pending,
            total_estimated_hours: totalEstimated,
            total_actual_hours: totalActual,
        };
    }
    /**
     * 获取项目统计
     */
    async getStats() {
        const [inDev, readyDelivery, completed, projects] = await Promise.all([
            this.prisma.project.count({ where: { status: 'in_development' } }),
            this.prisma.project.count({ where: { status: 'ready_for_delivery' } }),
            this.prisma.project.count({ where: { status: { in: ['completed', 'accepted'] } } }),
            this.prisma.project.findMany({ select: { profit: true } }),
        ]);
        const totalProfit = projects.reduce((sum, p) => sum + Number(p.profit), 0);
        return {
            in_development: inDev,
            ready_for_delivery: readyDelivery,
            completed,
            total_profit: totalProfit,
        };
    }
    serializeSubmission(s) {
        return {
            id: s.id,
            task_id: s.task_id,
            project_id: s.project_id,
            commit_hash: s.commit_hash,
            file_changes: s.file_changes,
            quality_score: s.quality_score,
            self_test_result: s.self_test_result,
            review_issues: s.review_issues,
            submitted_at: s.submitted_at,
        };
    }
    calculateDimensions(scoredSubmissions, issues) {
        const base = scoredSubmissions.length > 0
            ? Math.round(scoredSubmissions.reduce((sum, s) => sum + (s.quality_score ?? 0), 0) /
                scoredSubmissions.length)
            : 85;
        const criticalCount = issues.filter((i) => i.severity === 'critical').length;
        const warningCount = issues.filter((i) => i.severity === 'warning').length;
        return {
            readability: Math.max(50, base - warningCount * 2),
            maintainability: Math.max(50, base - warningCount * 3),
            security: Math.max(50, base - criticalCount * 5),
            performance: Math.max(50, base - Math.floor(warningCount / 2)),
        };
    }
    calculateAvgTestPassRate(submissions) {
        const rates = [];
        for (const s of submissions) {
            if (s.self_test_result && typeof s.self_test_result === 'object') {
                const result = s.self_test_result;
                if (typeof result.pass_rate === 'number') {
                    rates.push(result.pass_rate);
                }
            }
        }
        return rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : 0.9;
    }
};
exports.ProjectService = ProjectService;
exports.ProjectService = ProjectService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProjectService);
//# sourceMappingURL=project.service.js.map