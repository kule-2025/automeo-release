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
exports.InvoiceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
let InvoiceService = class InvoiceService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger('InvoiceService');
    }
    /**
     * 基于结算单生成HTML电子收据
     */
    async generateReceipt(settlementId) {
        const settlement = await this.prisma.settlement.findUnique({
            where: { id: settlementId },
            include: {
                project: {
                    select: {
                        id: true,
                        name: true,
                        user: { select: { real_name: true, nickname: true } },
                    },
                },
            },
        });
        if (!settlement) {
            throw new common_1.NotFoundException('结算单不存在');
        }
        const revenue = Number(settlement.revenue);
        const cost = Number(settlement.cost);
        const profit = Number(settlement.profit);
        const profitMargin = (Number(settlement.profit_margin) * 100).toFixed(2);
        const settledAt = settlement.settled_at
            ? new Date(settlement.settled_at).toLocaleString('zh-CN')
            : '未结算';
        const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>电子收据 - ${settlement.id.slice(0, 8)}</title>
  <style>
    body { font-family: -apple-system, sans-serif; padding: 40px; color: #333; }
    .receipt { max-width: 600px; margin: 0 auto; border: 1px solid #e8e8e8; border-radius: 8px; padding: 32px; }
    .header { text-align: center; border-bottom: 2px solid #1890ff; padding-bottom: 16px; margin-bottom: 24px; }
    .header h1 { margin: 0; font-size: 24px; color: #1890ff; }
    .header p { margin: 8px 0 0; color: #999; font-size: 12px; }
    .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f5f5f5; }
    .row .label { color: #666; }
    .row .value { font-weight: 500; }
    .total { font-size: 18px; color: #f5222d; font-weight: 700; }
    .footer { margin-top: 24px; text-align: center; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <h1>全自动经营管理系统 - 电子收据</h1>
      <p>收据编号: ${settlement.id}</p>
    </div>
    <div class="row"><span class="label">项目名称</span><span class="value">${settlement.project?.name || '-'}</span></div>
    <div class="row"><span class="label">客户/用户</span><span class="value">${settlement.project?.user?.real_name || settlement.project?.user?.nickname || '-'}</span></div>
    <div class="row"><span class="label">项目收入</span><span class="value">¥ ${revenue.toFixed(2)}</span></div>
    <div class="row"><span class="label">项目成本</span><span class="value">¥ ${cost.toFixed(2)}</span></div>
    <div class="row"><span class="label">项目利润</span><span class="value total">¥ ${profit.toFixed(2)}</span></div>
    <div class="row"><span class="label">利润率</span><span class="value">${profitMargin}%</span></div>
    <div class="row"><span class="label">结算时间</span><span class="value">${settledAt}</span></div>
    <div class="footer">
      <p>本收据由系统自动生成，具有同等法律效力</p>
      <p>生成时间: ${new Date().toLocaleString('zh-CN')}</p>
    </div>
  </div>
</body>
</html>`;
        this.logger.log(`生成电子收据: settlementId=${settlementId}`);
        return html;
    }
    /**
     * 获取发票/收据信息
     */
    async getInvoice(id) {
        const settlement = await this.prisma.settlement.findUnique({
            where: { id },
            include: { project: { select: { name: true } } },
        });
        if (!settlement) {
            throw new common_1.NotFoundException('结算单不存在');
        }
        return {
            id: settlement.id,
            project_id: settlement.project_id,
            project_name: settlement.project?.name,
            revenue: Number(settlement.revenue),
            cost: Number(settlement.cost),
            profit: Number(settlement.profit),
            profit_margin: Number(settlement.profit_margin),
            status: settlement.status,
            settled_at: settlement.settled_at,
            created_at: settlement.created_at,
        };
    }
};
exports.InvoiceService = InvoiceService;
exports.InvoiceService = InvoiceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InvoiceService);
//# sourceMappingURL=invoice.service.js.map