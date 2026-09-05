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
exports.PerformanceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
/** 低分阈值：质量分低于此值视为低分 */
const LOW_SCORE_THRESHOLD = 60;
/** 连续低分淘汰次数 */
const CONSECUTIVE_LOW_LIMIT = 3;
let PerformanceService = class PerformanceService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger('PerformanceService');
    }
    /**
     * 记录一条绩效
     * 同时更新员工的累计统计（总任务数、成功率、平均质量分）
     * 并触发淘汰机制检查
     */
    async recordPerformance(dto) {
        const employee = await this.prisma.digitalEmployee.findUnique({
            where: { id: dto.employee_id },
        });
        if (!employee) {
            throw new common_1.NotFoundException('数字化员工不存在');
        }
        // 1. 创建绩效记录
        const record = await this.prisma.agentPerformance.create({
            data: {
                employee_id: dto.employee_id,
                project_id: dto.project_id ?? null,
                task_id: dto.task_id ?? null,
                task_type: dto.task_type,
                quality_score: dto.quality_score,
                duration_ms: dto.duration_ms,
                success: dto.success,
                feedback_json: dto.feedback ? JSON.parse(JSON.stringify(dto.feedback)) : null,
            },
        });
        this.logger.log(`记录绩效: 员工=${employee.name}, 任务类型=${dto.task_type}, 质量分=${dto.quality_score}, 成功=${dto.success}`);
        // 2. 重新计算员工累计统计
        await this.recalculateEmployeeStats(dto.employee_id);
        // 3. 检查淘汰机制
        await this.checkRetirement(dto.employee_id);
        return {
            id: record.id,
            employee_id: record.employee_id,
            project_id: record.project_id,
            task_id: record.task_id,
            task_type: record.task_type,
            quality_score: Number(record.quality_score),
            duration_ms: Number(record.duration_ms),
            success: record.success,
            feedback_json: record.feedback_json ?? null,
            created_at: record.created_at,
        };
    }
    /**
     * 获取员工绩效列表
     */
    async getEmployeePerformance(employeeId, page = 1, pageSize = 20) {
        const employee = await this.prisma.digitalEmployee.findUnique({
            where: { id: employeeId },
        });
        if (!employee) {
            throw new common_1.NotFoundException('数字化员工不存在');
        }
        const [list, total] = await Promise.all([
            this.prisma.agentPerformance.findMany({
                where: { employee_id: employeeId },
                orderBy: { created_at: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            this.prisma.agentPerformance.count({ where: { employee_id: employeeId } }),
        ]);
        return {
            list: list.map((r) => ({
                id: r.id,
                employee_id: r.employee_id,
                project_id: r.project_id,
                task_id: r.task_id,
                task_type: r.task_type,
                quality_score: Number(r.quality_score),
                duration_ms: Number(r.duration_ms),
                success: r.success,
                feedback_json: r.feedback_json ?? null,
                created_at: r.created_at,
            })),
            total,
        };
    }
    /**
     * 获取绩效趋势（按天聚合）
     */
    async getPerformanceTrend(days = 14) {
        const since = new Date();
        since.setDate(since.getDate() - days);
        const records = await this.prisma.agentPerformance.findMany({
            where: { created_at: { gte: since } },
            orderBy: { created_at: 'asc' },
        });
        // 按日期分组
        const grouped = new Map();
        for (const r of records) {
            const dateKey = r.created_at.toISOString().slice(0, 10);
            const existing = grouped.get(dateKey) ?? { scores: [], successCount: 0, total: 0 };
            existing.scores.push(Number(r.quality_score));
            if (r.success)
                existing.successCount++;
            existing.total++;
            grouped.set(dateKey, existing);
        }
        const result = [];
        for (let i = days; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateKey = d.toISOString().slice(0, 10);
            const data = grouped.get(dateKey);
            if (data && data.total > 0) {
                result.push({
                    date: dateKey,
                    avg_quality_score: Math.round((data.scores.reduce((a, b) => a + b, 0) / data.scores.length) * 10) / 10,
                    success_rate: Math.round((data.successCount / data.total) * 1000) / 10,
                    total_tasks: data.total,
                });
            }
            else {
                result.push({ date: dateKey, avg_quality_score: 0, success_rate: 0, total_tasks: 0 });
            }
        }
        return result;
    }
    /**
     * 获取员工排名（含平均耗时）
     */
    async getRanking(limit = 20) {
        const employees = await this.prisma.digitalEmployee.findMany({
            where: { status: { not: 'retired' }, total_tasks: { gt: 0 } },
            include: { role: true },
            orderBy: [{ avg_quality_score: 'desc' }, { success_rate: 'desc' }],
            take: limit,
        });
        const result = [];
        for (const e of employees) {
            // 计算平均耗时
            const perfRecords = await this.prisma.agentPerformance.findMany({
                where: { employee_id: e.id },
                select: { duration_ms: true },
            });
            const avgDuration = perfRecords.length > 0
                ? Math.round(perfRecords.reduce((sum, r) => sum + Number(r.duration_ms), 0) / perfRecords.length)
                : 0;
            result.push({
                employee_id: e.id,
                employee_name: e.name,
                role_name: e.role?.name ?? '未知',
                total_tasks: e.total_tasks,
                success_rate: Number(e.success_rate),
                avg_quality_score: Number(e.avg_quality_score),
                avg_duration_ms: avgDuration,
            });
        }
        return result;
    }
    // ==================== 内部方法 ====================
    /**
     * 重新计算员工累计统计
     */
    async recalculateEmployeeStats(employeeId) {
        const records = await this.prisma.agentPerformance.findMany({
            where: { employee_id: employeeId },
            select: { quality_score: true, success: true },
        });
        if (records.length === 0)
            return;
        const totalTasks = records.length;
        const successCount = records.filter((r) => r.success).length;
        const successRate = Math.round((successCount / totalTasks) * 1000) / 10;
        const avgQuality = Math.round((records.reduce((sum, r) => sum + Number(r.quality_score), 0) / totalTasks) * 10) / 10;
        await this.prisma.digitalEmployee.update({
            where: { id: employeeId },
            data: {
                total_tasks: totalTasks,
                success_rate: successRate,
                avg_quality_score: avgQuality,
            },
        });
        this.logger.log(`员工统计更新: total=${totalTasks}, success_rate=${successRate}%, avg_quality=${avgQuality}`);
    }
    /**
     * 淘汰机制检查：连续3次低分 → retired
     */
    async checkRetirement(employeeId) {
        const recentRecords = await this.prisma.agentPerformance.findMany({
            where: { employee_id: employeeId },
            orderBy: { created_at: 'desc' },
            take: CONSECUTIVE_LOW_LIMIT,
        });
        if (recentRecords.length < CONSECUTIVE_LOW_LIMIT)
            return;
        const consecutiveLow = recentRecords.every((r) => Number(r.quality_score) < LOW_SCORE_THRESHOLD);
        if (consecutiveLow) {
            const employee = await this.prisma.digitalEmployee.update({
                where: { id: employeeId },
                data: {
                    status: 'retired',
                    retired_at: new Date(),
                },
            });
            this.logger.warn(`淘汰机制触发: 员工 ${employee.name} 连续${CONSECUTIVE_LOW_LIMIT}次质量分低于${LOW_SCORE_THRESHOLD}，已自动淘汰`);
        }
    }
};
exports.PerformanceService = PerformanceService;
exports.PerformanceService = PerformanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PerformanceService);
//# sourceMappingURL=performance.service.js.map