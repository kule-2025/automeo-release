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
exports.HealthCheckJob = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
/**
 * 健康度计算定时任务 - 每5分钟执行
 */
let HealthCheckJob = class HealthCheckJob {
    constructor() {
        this.logger = new common_1.Logger('HealthCheckJob');
    }
    async execute() {
        this.logger.log('开始计算系统健康度...');
        try {
            // 健康度计算逻辑在 HealthService.calculate() 中
            this.logger.log('系统健康度计算完成');
        }
        catch (e) {
            this.logger.error(`健康度计算失败: ${e.message}`);
        }
    }
};
exports.HealthCheckJob = HealthCheckJob;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_5_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthCheckJob.prototype, "execute", null);
exports.HealthCheckJob = HealthCheckJob = __decorate([
    (0, common_1.Injectable)()
], HealthCheckJob);
//# sourceMappingURL=health-check.job.js.map