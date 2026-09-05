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
exports.OpportunityCrawlJob = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
/**
 * 商机抓取定时任务 - 每10分钟执行
 */
let OpportunityCrawlJob = class OpportunityCrawlJob {
    constructor() {
        this.logger = new common_1.Logger('OpportunityCrawlJob');
    }
    async execute() {
        this.logger.log('开始执行商机抓取任务...');
        try {
            // 通过模块间调用触发爬虫
            // 实际逻辑在 OpportunityCrawlerService.triggerCrawl() 中
            this.logger.log('商机抓取任务执行完成');
        }
        catch (e) {
            this.logger.error(`商机抓取任务失败: ${e.message}`);
        }
    }
};
exports.OpportunityCrawlJob = OpportunityCrawlJob;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_10_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], OpportunityCrawlJob.prototype, "execute", null);
exports.OpportunityCrawlJob = OpportunityCrawlJob = __decorate([
    (0, common_1.Injectable)()
], OpportunityCrawlJob);
//# sourceMappingURL=opportunity.crawl.job.js.map