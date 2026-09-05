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
exports.ComputeManagerService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
let ComputeManagerService = class ComputeManagerService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger('ComputeManagerService');
    }
    /**
     * 获取算力资源列表
     */
    async getResources() {
        const resources = await this.prisma.computeResource.findMany({
            orderBy: { created_at: 'desc' },
        });
        const totalMonthlyCost = resources.reduce((s, r) => Number((s + Number(r.monthly_cost)).toFixed(2)), 0);
        const avgLoad = resources.length > 0
            ? Math.round(resources.reduce((s, r) => s + r.load_percent, 0) / resources.length)
            : 0;
        return {
            total: resources.length,
            running: resources.filter((r) => r.status === 'running').length,
            total_monthly_cost: totalMonthlyCost,
            avg_load: avgLoad,
            list: resources.map((r) => ({
                ...r,
                monthly_cost: Number(r.monthly_cost),
            })),
        };
    }
    /**
     * 更新算力资源配置
     */
    async updateResource(id, dto) {
        const existing = await this.prisma.computeResource.findUnique({ where: { id } });
        if (!existing) {
            throw new common_1.NotFoundException('算力资源不存在');
        }
        const updated = await this.prisma.computeResource.update({
            where: { id },
            data: {
                ...(dto.name && { name: dto.name }),
                ...(dto.status && { status: dto.status }),
                ...(dto.max_concurrent !== undefined && { max_concurrent: dto.max_concurrent }),
                ...(dto.load_percent !== undefined && { load_percent: dto.load_percent }),
            },
        });
        this.logger.log(`更新算力资源: ${id}, status=${dto.status}, max_concurrent=${dto.max_concurrent}`);
        return {
            ...updated,
            monthly_cost: Number(updated.monthly_cost),
        };
    }
    /**
     * 动态调整并发（根据负载）
     */
    async autoScale() {
        const resources = await this.prisma.computeResource.findMany({
            where: { status: 'running' },
        });
        for (const r of resources) {
            let newConcurrent = r.max_concurrent;
            if (r.load_percent > 85 && r.max_concurrent < 10) {
                newConcurrent = r.max_concurrent + 1;
            }
            else if (r.load_percent < 30 && r.max_concurrent > 1) {
                newConcurrent = r.max_concurrent - 1;
            }
            if (newConcurrent !== r.max_concurrent) {
                await this.prisma.computeResource.update({
                    where: { id: r.id },
                    data: { max_concurrent: newConcurrent },
                });
                this.logger.log(`自动扩缩容: ${r.name} ${r.max_concurrent}→${newConcurrent}`);
            }
        }
    }
};
exports.ComputeManagerService = ComputeManagerService;
exports.ComputeManagerService = ComputeManagerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ComputeManagerService);
//# sourceMappingURL=compute-manager.service.js.map