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
exports.ProfitCalculatorService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
let ProfitCalculatorService = class ProfitCalculatorService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger('ProfitCalculatorService');
        this.WARNING_THRESHOLD = 0.1; // 利润率<10%预警
    }
    /**
     * 计算项目利润：收入-成本=利润, 利润率, <10%预警
     */
    async calculate(projectId) {
        const project = await this.prisma.project.findUnique({
            where: { id: projectId },
            include: {
                requirement: { select: { quoted_price: true } },
                cost_records: { select: { amount: true } },
            },
        });
        if (!project) {
            throw new common_1.NotFoundException('项目不存在');
        }
        const revenue = project.requirement?.quoted_price
            ? Number(project.requirement.quoted_price)
            : Number(project.revenue);
        const cost = project.cost_records.reduce((s, r) => Number((s + Number(r.amount)).toFixed(2)), 0);
        const profit = Number((revenue - cost).toFixed(2));
        const profitMargin = revenue > 0 ? Number((profit / revenue).toFixed(4)) : 0;
        const warning = profitMargin < this.WARNING_THRESHOLD && revenue > 0;
        if (warning) {
            this.logger.warn(`利润预警: project=${project.name}, 利润率=${(profitMargin * 100).toFixed(1)}%`);
        }
        return {
            project_id: projectId,
            project_name: project.name,
            revenue,
            cost,
            profit,
            profit_margin: profitMargin,
            warning,
        };
    }
};
exports.ProfitCalculatorService = ProfitCalculatorService;
exports.ProfitCalculatorService = ProfitCalculatorService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProfitCalculatorService);
//# sourceMappingURL=profit-calculator.service.js.map