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
exports.AcceptanceTimeoutJob = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../prisma/prisma.service");
/**
 * 验收超时检查定时任务 - 每小时执行
 * 超过7天未响应的交付自动确认验收
 */
let AcceptanceTimeoutJob = class AcceptanceTimeoutJob {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger('AcceptanceTimeoutJob');
        this.TIMEOUT_DAYS = 7;
    }
    async execute() {
        this.logger.log('开始检查验收超时...');
        try {
            const timeoutDate = new Date(Date.now() - this.TIMEOUT_DAYS * 24 * 60 * 60 * 1000);
            const overdue = await this.prisma.delivery.findMany({
                where: {
                    status: { in: ['delivered', 'viewed', 'in_acceptance'] },
                    delivered_at: { lt: timeoutDate },
                },
            });
            for (const delivery of overdue) {
                await this.prisma.delivery.update({
                    where: { id: delivery.id },
                    data: { status: 'accepted', accepted_at: new Date() },
                });
                this.logger.log(`交付 ${delivery.id} 超时自动验收通过`);
            }
            this.logger.log(`验收超时检查完成，处理 ${overdue.length} 条`);
        }
        catch (e) {
            this.logger.error(`验收超时检查失败: ${e.message}`);
        }
    }
};
exports.AcceptanceTimeoutJob = AcceptanceTimeoutJob;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AcceptanceTimeoutJob.prototype, "execute", null);
exports.AcceptanceTimeoutJob = AcceptanceTimeoutJob = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AcceptanceTimeoutJob);
//# sourceMappingURL=acceptance-timeout.job.js.map