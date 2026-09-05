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
exports.TaskExecutionQueue = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("bullmq");
const shared_1 = require("../../../../../../packages/shared/src");
const code_agent_service_1 = require("../services/code-agent.service");
/**
 * 任务执行队列 - BullMQ
 * 开发环境Redis不可用时降级为直接调用
 */
let TaskExecutionQueue = class TaskExecutionQueue {
    constructor(codeAgentService) {
        this.codeAgentService = codeAgentService;
        this.logger = new common_1.Logger('TaskExecutionQueue');
        this.queue = null;
        this.worker = null;
        this.redisAvailable = false;
    }
    onModuleInit() {
        try {
            const connection = {
                host: process.env.REDIS_HOST || 'localhost',
                port: Number(process.env.REDIS_PORT) || 6379,
            };
            this.queue = new bullmq_1.Queue(shared_1.QUEUE_NAMES.TASK_EXECUTION, { connection });
            this.worker = new bullmq_1.Worker(shared_1.QUEUE_NAMES.TASK_EXECUTION, async (job) => {
                this.logger.log(`处理任务执行作业: ${job.id}`);
                await this.codeAgentService.execute(job.data.taskId);
            }, { connection, concurrency: 3 });
            this.redisAvailable = true;
            this.logger.log('任务执行队列已连接Redis');
        }
        catch (error) {
            this.redisAvailable = false;
            this.logger.warn(`Redis不可用，任务执行队列降级为直接调用: ${error.message}`);
        }
    }
    /**
     * 添加任务到执行队列
     */
    async add(taskId) {
        if (this.redisAvailable && this.queue) {
            try {
                await this.queue.add('execute-task', { taskId });
                this.logger.log(`任务已加入执行队列: ${taskId}`);
                return;
            }
            catch (error) {
                this.logger.warn(`队列添加失败，降级直接执行: ${error.message}`);
            }
        }
        // 降级：直接执行
        await this.codeAgentService.execute(taskId);
    }
};
exports.TaskExecutionQueue = TaskExecutionQueue;
exports.TaskExecutionQueue = TaskExecutionQueue = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [code_agent_service_1.CodeAgentService])
], TaskExecutionQueue);
//# sourceMappingURL=task-execution.queue.js.map