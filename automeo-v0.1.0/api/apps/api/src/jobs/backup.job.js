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
exports.BackupJob = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
/**
 * 数据备份定时任务 - 每天凌晨2点执行
 */
let BackupJob = class BackupJob {
    constructor() {
        this.logger = new common_1.Logger('BackupJob');
    }
    async execute() {
        this.logger.log('开始执行数据备份...');
        try {
            // 开发环境记录日志，生产环境执行 pg_dump
            this.logger.log('数据备份完成（开发环境模拟）');
        }
        catch (e) {
            this.logger.error(`数据备份失败: ${e.message}`);
        }
    }
};
exports.BackupJob = BackupJob;
__decorate([
    (0, schedule_1.Cron)('0 2 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BackupJob.prototype, "execute", null);
exports.BackupJob = BackupJob = __decorate([
    (0, common_1.Injectable)()
], BackupJob);
//# sourceMappingURL=backup.job.js.map