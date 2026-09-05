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
exports.AgreementService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
/**
 * 合作协议生成服务
 * 基于模板填充需求范围、交付标准、金额、付款方式、工期、违约责任
 */
let AgreementService = class AgreementService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * 生成合作协议 HTML
     */
    async generate(requirementId) {
        const requirement = await this.prisma.requirement.findUnique({
            where: { id: requirementId },
            include: {
                customer: true,
                items: { orderBy: { sort_order: 'asc' } },
            },
        });
        if (!requirement) {
            throw new Error('需求不存在');
        }
        const customerName = requirement.customer?.name || '客户';
        const title = requirement.title;
        const totalHours = requirement.estimated_hours?.toNumber() || 0;
        const quotedPrice = requirement.quoted_price?.toNumber() || 0;
        const costEstimate = requirement.cost_estimate?.toNumber() || 0;
        // 功能清单
        const featureList = requirement.items
            .map((item, index) => {
            const hours = item.estimated_hours.toNumber();
            return `<tr>
          <td>${index + 1}</td>
          <td>${this.escapeHtml(item.name)}</td>
          <td>${this.escapeHtml(item.description || '')}</td>
          <td>${item.complexity}</td>
          <td>${hours}h</td>
        </tr>`;
        })
            .join('\n');
        // 工期估算（按每天8小时，每周5天）
        const workDays = Math.ceil(totalHours / 8);
        const workWeeks = Math.ceil(workDays / 5);
        const timeline = workWeeks > 0 ? `约${workWeeks}周（${workDays}个工作日）` : '待确认';
        // 付款方式：50%预付 + 50%验收
        const prepayment = Math.round(quotedPrice * 0.5 * 100) / 100;
        const finalPayment = quotedPrice - prepayment;
        const today = new Date().toLocaleDateString('zh-CN');
        const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>软件开发合作协议</title>
  <style>
    body { font-family: "Microsoft YaHei", sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; line-height: 1.8; color: #333; }
    h1 { text-align: center; font-size: 24px; margin-bottom: 30px; }
    h2 { font-size: 18px; border-left: 4px solid #1677ff; padding-left: 10px; margin-top: 30px; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; font-size: 14px; }
    th { background: #f5f5f5; }
    .party { display: flex; justify-content: space-between; margin: 20px 0; }
    .amount { color: #d4380d; font-weight: bold; font-size: 18px; }
    .footer { margin-top: 60px; display: flex; justify-content: space-between; }
    .sign-block { width: 45%; }
    .sign-line { border-bottom: 1px solid #333; margin-top: 40px; height: 30px; }
  </style>
</head>
<body>
  <h1>软件开发合作协议</h1>

  <div class="party">
    <div><strong>甲方（委托方）：</strong>${this.escapeHtml(customerName)}</div>
    <div><strong>乙方（开发方）：</strong>全自动经营管理系统服务商</div>
  </div>

  <p>签订日期：${today}</p>

  <h2>第一条 项目概述</h2>
  <p>甲方委托乙方开发「<strong>${this.escapeHtml(title)}</strong>」软件项目，双方经友好协商，达成如下协议。</p>

  <h2>第二条 需求范围与交付标准</h2>
  <p>乙方应按照以下功能清单完成开发：</p>
  <table>
    <thead>
      <tr><th>序号</th><th>功能模块</th><th>功能描述</th><th>复杂度</th><th>预估工时</th></tr>
    </thead>
    <tbody>
      ${featureList || '<tr><td colspan="5">详见需求文档</td></tr>'}
    </tbody>
  </table>
  <p><strong>交付标准：</strong></p>
  <ol>
    <li>所有功能模块通过甲方验收测试，无严重Bug；</li>
    <li>提供完整源代码、部署文档和使用说明；</li>
    <li>系统可正常部署运行，性能满足约定指标；</li>
    <li>总预估工时：${totalHours}小时。</li>
  </ol>

  <h2>第三条 项目金额与付款方式</h2>
  <p>项目总金额：<span class="amount">¥${quotedPrice.toLocaleString()}</span>（大写：${this.numberToChinese(quotedPrice)}元整）</p>
  <p>付款方式：</p>
  <ol>
    <li><strong>预付款（50%）：</strong>本协议签订后3个工作日内，甲方向乙方支付 ¥${prepayment.toLocaleString()}；</li>
    <li><strong>验收款（50%）：</strong>项目验收通过后5个工作日内，甲方向乙方支付 ¥${finalPayment.toLocaleString()}。</li>
  </ol>

  <h2>第四条 项目工期</h2>
  <p>预计工期：<strong>${timeline}</strong>，自甲方支付预付款之日起计算。如因甲方需求变更或反馈延迟导致工期延长，工期相应顺延。</p>

  <h2>第五条 双方权利与义务</h2>
  <p><strong>甲方：</strong></p>
  <ol>
    <li>按时提供项目所需的资料、反馈和确认；</li>
    <li>按约定支付项目款项；</li>
    <li>在收到交付物后5个工作日内完成验收并反馈。</li>
  </ol>
  <p><strong>乙方：</strong></p>
  <ol>
    <li>按需求范围和交付标准完成开发；</li>
    <li>定期向甲方汇报项目进度；</li>
    <li>对甲方提供的资料和信息保密。</li>
  </ol>

  <h2>第六条 违约责任</h2>
  <ol>
    <li>乙方逾期交付的，每逾期一日按项目总金额的0.5%向甲方支付违约金，累计不超过总金额的10%；</li>
    <li>甲方逾期付款的，每逾期一日按应付金额的0.5%向乙方支付违约金；</li>
    <li>任何一方擅自解除合同，应向对方支付项目总金额20%的违约金；</li>
    <li>因不可抗力导致无法履行的，双方互不承担违约责任。</li>
  </ol>

  <h2>第七条 其他</h2>
  <ol>
    <li>本协议自双方签字盖章之日起生效；</li>
    <li>本协议一式两份，甲乙双方各执一份，具有同等法律效力；</li>
    <li>未尽事宜由双方协商解决，协商不成的提交乙方所在地人民法院诉讼。</li>
  </ol>

  <div class="footer">
    <div class="sign-block">
      <p><strong>甲方（签字/盖章）：</strong></p>
      <div class="sign-line"></div>
      <p>日期：________年____月____日</p>
    </div>
    <div class="sign-block">
      <p><strong>乙方（签字/盖章）：</strong></p>
      <div class="sign-line"></div>
      <p>日期：________年____月____日</p>
    </div>
  </div>
</body>
</html>`;
        return html;
    }
    escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
    numberToChinese(num) {
        const digits = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
        const units = ['', '拾', '佰', '仟', '万', '拾', '佰', '仟', '亿'];
        const intPart = Math.floor(num);
        const str = intPart.toString();
        let result = '';
        for (let i = 0; i < str.length; i++) {
            const digit = parseInt(str[i], 10);
            const unitIndex = str.length - 1 - i;
            if (digit !== 0) {
                result += digits[digit] + units[unitIndex];
            }
            else if (result && !result.endsWith('零')) {
                result += '零';
            }
        }
        return result.replace(/零$/, '') || '零';
    }
};
exports.AgreementService = AgreementService;
exports.AgreementService = AgreementService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AgreementService);
//# sourceMappingURL=agreement.service.js.map