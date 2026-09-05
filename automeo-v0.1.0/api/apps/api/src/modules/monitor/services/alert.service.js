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
exports.AlertService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
let AlertService = class AlertService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger('AlertService');
    }
    /**
     * 分级创建AlertEvent并通知
     */
    async report(data) {
        const alert = await this.prisma.alertEvent.create({
            data: {
                module: data.module,
                level: data.level,
                message: data.message,
                status: 'pending',
                detail_json: data.detail_json ? JSON.parse(JSON.stringify(data.detail_json)) : undefined,
            },
        });
        // 模拟通知（critical级别记录日志）
        if (data.level === 'critical') {
            this.logger.error(`[严重告警] ${data.module}: ${data.message}`);
        }
        else if (data.level === 'warning') {
            this.logger.warn(`[警告] ${data.module}: ${data.message}`);
        }
        return alert;
    }
    /**
     * 告警列表筛选
     */
    async getAlerts(query) {
        const page = query.page || 1;
        const pageSize = query.page_size || 20;
        const skip = (page - 1) * pageSize;
        const where = {};
        if (query.module)
            where.module = query.module;
        if (query.level)
            where.level = query.level;
        if (query.status)
            where.status = query.status;
        const [total, list] = await Promise.all([
            this.prisma.alertEvent.count({ where }),
            this.prisma.alertEvent.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { triggered_at: 'desc' },
            }),
        ]);
        // 统计
        const stats = await this.prisma.alertEvent.groupBy({
            by: ['level', 'status'],
            _count: { id: true },
        });
        return {
            total,
            page,
            page_size: pageSize,
            stats,
            list,
        };
    }
    /**
     * 处理告警：更新状态/处理人/处理结果
     */
    async handleAlert(id, dto) {
        const alert = await this.prisma.alertEvent.findUnique({ where: { id } });
        if (!alert) {
            throw new common_1.NotFoundException('告警事件不存在');
        }
        const updated = await this.prisma.alertEvent.update({
            where: { id },
            data: {
                status: dto.status,
                ...(dto.resolution && { resolution: dto.resolution }),
                ...(dto.resolved_by && { resolved_by: dto.resolved_by }),
                ...(dto.status === 'resolved' && { resolved_at: new Date() }),
            },
        });
        this.logger.log(`告警处理: id=${id}, status=${dto.status}`);
        return updated;
    }
};
exports.AlertService = AlertService;
exports.AlertService = AlertService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AlertService);
//# sourceMappingURL=alert.service.js.map