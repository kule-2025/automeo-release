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
exports.CostAllocatorService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
let CostAllocatorService = class CostAllocatorService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * 按项目汇总CostRecord
     */
    async getByProject() {
        const records = await this.prisma.costRecord.findMany({
            include: {
                project: { select: { id: true, name: true } },
                category: { select: { type: true } },
            },
        });
        const projectMap = new Map();
        for (const r of records) {
            const pid = r.project_id || 'unallocated';
            if (!projectMap.has(pid)) {
                projectMap.set(pid, {
                    project_id: pid,
                    project_name: r.project?.name || '未分摊',
                    token_cost: 0,
                    compute_cost: 0,
                    other_cost: 0,
                    total_cost: 0,
                    ratio: 0,
                });
            }
            const pc = projectMap.get(pid);
            const amt = Number(r.amount);
            const type = r.category?.type || 'other';
            if (type === 'token')
                pc.token_cost = Number((pc.token_cost + amt).toFixed(2));
            else if (type === 'compute')
                pc.compute_cost = Number((pc.compute_cost + amt).toFixed(2));
            else
                pc.other_cost = Number((pc.other_cost + amt).toFixed(2));
            pc.total_cost = Number((pc.total_cost + amt).toFixed(2));
        }
        const list = Array.from(projectMap.values()).sort((a, b) => b.total_cost - a.total_cost);
        const grandTotal = list.reduce((s, p) => s + p.total_cost, 0);
        for (const p of list) {
            p.ratio = grandTotal > 0 ? Number((p.total_cost / grandTotal).toFixed(4)) : 0;
        }
        return list;
    }
};
exports.CostAllocatorService = CostAllocatorService;
exports.CostAllocatorService = CostAllocatorService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CostAllocatorService);
//# sourceMappingURL=cost-allocator.service.js.map