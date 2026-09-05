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
exports.ProgressService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const shared_1 = require("../../../../../../packages/shared/src");
/**
 * 进度服务 - 计算和更新项目进度
 */
let ProgressService = class ProgressService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger('ProgressService');
    }
    /**
     * 更新项目进度 = 已完成任务数 / 总任务数 × 100
     */
    async update(projectId) {
        const tasks = await this.prisma.projectTask.findMany({
            where: { project_id: projectId },
            select: { status: true },
        });
        const total = tasks.length;
        if (total === 0) {
            await this.prisma.project.update({
                where: { id: projectId },
                data: { progress: 0 },
            });
            return 0;
        }
        const completed = tasks.filter((t) => [shared_1.TaskStatus.READY_FOR_DELIVERY, shared_1.TaskStatus.COMPLETED].includes(t.status)).length;
        const progress = Math.round((completed / total) * 100);
        // 更新项目进度和状态
        const updateData = { progress };
        if (progress === 100) {
            updateData.status = shared_1.ProjectStatus.READY_FOR_DELIVERY;
            updateData.finished_at = new Date();
        }
        else if (progress > 0) {
            updateData.status = shared_1.ProjectStatus.IN_DEVELOPMENT;
            if (!updateData.started_at) {
                updateData.started_at = new Date();
            }
        }
        await this.prisma.project.update({
            where: { id: projectId },
            data: updateData,
        });
        this.logger.log(`项目进度更新: ${projectId} = ${progress}% (${completed}/${total})`);
        return progress;
    }
    /**
     * 获取项目进度
     */
    async getProgress(projectId) {
        const tasks = await this.prisma.projectTask.findMany({
            where: { project_id: projectId },
            select: { status: true },
        });
        const total = tasks.length;
        const completed = tasks.filter((t) => [shared_1.TaskStatus.READY_FOR_DELIVERY, shared_1.TaskStatus.COMPLETED].includes(t.status)).length;
        const inProgress = tasks.filter((t) => [shared_1.TaskStatus.IN_PROGRESS, shared_1.TaskStatus.SELF_TESTING].includes(t.status)).length;
        const pending = tasks.filter((t) => t.status === shared_1.TaskStatus.PENDING).length;
        return {
            progress: total > 0 ? Math.round((completed / total) * 100) : 0,
            total_tasks: total,
            completed_tasks: completed,
            in_progress_tasks: inProgress,
            pending_tasks: pending,
        };
    }
};
exports.ProgressService = ProgressService;
exports.ProgressService = ProgressService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProgressService);
//# sourceMappingURL=progress.service.js.map