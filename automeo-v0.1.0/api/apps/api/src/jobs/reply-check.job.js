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
exports.ReplyCheckJob = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
/**
 * 客户回复检查定时任务 - 每5分钟执行
 */
let ReplyCheckJob = class ReplyCheckJob {
    constructor() {
        this.logger = new common_1.Logger('ReplyCheckJob');
    }
    async execute() {
        this.logger.log('开始检查客户回复...');
        try {
            // 检查各平台是否有新回复
            // 有新回复则加入 chat-process 队列
            this.logger.log('客户回复检查完成');
        }
        catch (e) {
            this.logger.error(`客户回复检查失败: ${e.message}`);
        }
    }
};
exports.ReplyCheckJob = ReplyCheckJob;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_5_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReplyCheckJob.prototype, "execute", null);
exports.ReplyCheckJob = ReplyCheckJob = __decorate([
    (0, common_1.Injectable)()
], ReplyCheckJob);
//# sourceMappingURL=reply-check.job.js.map