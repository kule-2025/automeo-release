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
exports.CodeReviewQueue = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("bullmq");
const shared_1 = require("../../../../../../packages/shared/src");
const code_review_service_1 = require("../services/code-review.service");
/**
 * 代码审查队列 - BullMQ
 * 开发环境Redis不可用时降级为直接调用
 */
let CodeReviewQueue = class CodeReviewQueue {
    constructor(codeReviewService) {
        this.codeReviewService = codeReviewService;
        this.logger = new common_1.Logger('CodeReviewQueue');
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
            this.queue = new bullmq_1.Queue(shared_1.QUEUE_NAMES.CODE_REVIEW, { connection });
            this.worker = new bullmq_1.Worker(shared_1.QUEUE_NAMES.CODE_REVIEW, async (job) => {
                this.logger.log(`处理代码审查作业: ${job.id}`);
                await this.codeReviewService.review(job.data.taskId);
            }, { connection, concurrency: 2 });
            this.redisAvailable = true;
            this.logger.log('代码审查队列已连接Redis');
        }
        catch (error) {
            this.redisAvailable = false;
            this.logger.warn(`Redis不可用，代码审查队列降级为直接调用: ${error.message}`);
        }
    }
    /**
     * 添加任务到审查队列
     */
    async add(taskId) {
        if (this.redisAvailable && this.queue) {
            try {
                await this.queue.add('review-code', { taskId });
                this.logger.log(`任务已加入审查队列: ${taskId}`);
                return;
            }
            catch (error) {
                this.logger.warn(`队列添加失败，降级直接审查: ${error.message}`);
            }
        }
        // 降级：直接执行
        await this.codeReviewService.review(taskId);
    }
};
exports.CodeReviewQueue = CodeReviewQueue;
exports.CodeReviewQueue = CodeReviewQueue = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [code_review_service_1.CodeReviewService])
], CodeReviewQueue);
//# sourceMappingURL=code-review.queue.js.map