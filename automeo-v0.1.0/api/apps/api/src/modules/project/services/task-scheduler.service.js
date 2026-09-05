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
exports.TaskSchedulerService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../../../prisma/prisma.service");
const task_execution_queue_1 = require("../queues/task-execution.queue");
const shared_1 = require("../../../../../../packages/shared/src");
/**
 * 任务调度服务 - 定时扫描可执行任务，控制并发
 */
let TaskSchedulerService = class TaskSchedulerService {
    constructor(prisma, taskExecutionQueue) {
        this.prisma = prisma;
        this.taskExecutionQueue = taskExecutionQueue;
        this.logger = new common_1.Logger('TaskScheduler');
        this.maxConcurrency = shared_1.TASK_MAX_CONCURRENCY;
    }
    /**
     * 启动调度 - 定时扫描可执行任务
     */
    async start() {
        try {
            await this.scanAndDispatch();
        }
        catch (error) {
            this.logger.error(`任务调度失败: ${error.message}`);
        }
    }
    /**
     * 扫描并分发可执行任务
     */
    async scanAndDispatch() {
        // 1. 统计当前正在执行的任务数
        const runningCount = await this.prisma.projectTask.count({
            where: { status: { in: [shared_1.TaskStatus.IN_PROGRESS, shared_1.TaskStatus.SELF_TESTING] } },
        });
        const availableSlots = this.maxConcurrency - runningCount;
        if (availableSlots <= 0) {
            this.logger.log(`并发已满(${runningCount}/${this.maxConcurrency})，跳过调度`);
            return 0;
        }
        // 2. 查询所有待开始任务，按优先级排序
        const pendingTasks = await this.prisma.projectTask.findMany({
            where: { status: shared_1.TaskStatus.PENDING },
            orderBy: [{ priority: 'desc' }, { created_at: 'asc' }],
        });
        if (pendingTasks.length === 0) {
            return 0;
        }
        // 3. 筛选可执行任务（无未完成依赖）
        const executableTasks = [];
        for (const task of pendingTasks) {
            if (executableTasks.length >= availableSlots)
                break;
            const deps = task.dependencies ?? [];
            if (deps.length === 0) {
                executableTasks.push(task);
                continue;
            }
            // 检查依赖是否全部完成
            const depTasks = await this.prisma.projectTask.findMany({
                where: { id: { in: deps } },
                select: { status: true },
            });
            const allCompleted = depTasks.every((t) => [shared_1.TaskStatus.READY_FOR_DELIVERY, shared_1.TaskStatus.COMPLETED].includes(t.status));
            if (allCompleted) {
                executableTasks.push(task);
            }
        }
        // 4. 分发任务到执行队列
        for (const task of executableTasks) {
            await this.prisma.projectTask.update({
                where: { id: task.id },
                data: { status: shared_1.TaskStatus.IN_PROGRESS, started_at: new Date() },
            });
            await this.taskExecutionQueue.add(task.id);
            this.logger.log(`任务已调度: ${task.name} (优先级:${task.priority})`);
        }
        this.logger.log(`调度完成: 分发${executableTasks.length}个任务, 当前并发${runningCount + executableTasks.length}/${this.maxConcurrency}`);
        return executableTasks.length;
    }
    /**
     * 手动触发单个任务执行
     */
    async triggerTask(taskId) {
        const task = await this.prisma.projectTask.findUnique({ where: { id: taskId } });
        if (!task || task.status !== shared_1.TaskStatus.PENDING) {
            throw new Error('任务不可执行');
        }
        await this.prisma.projectTask.update({
            where: { id: taskId },
            data: { status: shared_1.TaskStatus.IN_PROGRESS, started_at: new Date() },
        });
        await this.taskExecutionQueue.add(taskId);
    }
};
exports.TaskSchedulerService = TaskSchedulerService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_30_SECONDS),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TaskSchedulerService.prototype, "start", null);
exports.TaskSchedulerService = TaskSchedulerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        task_execution_queue_1.TaskExecutionQueue])
], TaskSchedulerService);
//# sourceMappingURL=task-scheduler.service.js.map