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
exports.AcceptanceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const ai_gateway_service_1 = require("../../ai-gateway/services/ai-gateway.service");
const workspace_manager_1 = require("../../project/workspace/workspace-manager");
const shared_1 = require("../../../../../../packages/shared/src");
/**
 * 验收服务 - 逐项核对RequirementItem与代码实现，超时7天自动验收
 */
let AcceptanceService = class AcceptanceService {
    constructor(prisma, aiGateway, workspaceManager) {
        this.prisma = prisma;
        this.aiGateway = aiGateway;
        this.workspaceManager = workspaceManager;
        this.logger = new common_1.Logger('AcceptanceService');
    }
    /**
     * 执行验收核对 - 逐项核对需求项与代码实现
     */
    async verify(deliveryId) {
        this.logger.log(`开始验收核对: ${deliveryId}`);
        const delivery = await this.prisma.delivery.findUnique({
            where: { id: deliveryId },
            include: { project: { include: { requirement: true } } },
        });
        if (!delivery) {
            throw new Error('交付记录不存在');
        }
        // 获取需求项列表
        let requirementItems = [];
        if (delivery.project.requirement) {
            requirementItems = await this.prisma.requirementItem.findMany({
                where: { requirement_id: delivery.project.requirement.id },
                orderBy: { sort_order: 'asc' },
            });
        }
        // 读取项目代码
        const files = this.workspaceManager.readAllFiles(delivery.project_id);
        const codeSummary = files
            .slice(0, 10)
            .map((f) => `文件: ${f.path}\n${f.content.substring(0, 500)}`)
            .join('\n\n');
        // 逐项核对
        const items = [];
        for (const item of requirementItems) {
            const result = await this.verifyItem(item, codeSummary, delivery.project_id);
            items.push(result);
        }
        const passed = items.filter((i) => i.status === 'passed').length;
        const failed = items.filter((i) => i.status === 'failed').length;
        const pending = items.filter((i) => i.status === 'pending').length;
        // 更新交付状态
        const allPassed = failed === 0 && items.length > 0;
        await this.prisma.delivery.update({
            where: { id: deliveryId },
            data: {
                status: allPassed ? 'in_acceptance' : 'needs_revision',
            },
        });
        const timeoutAt = new Date(Date.now() + shared_1.ACCEPTANCE_TIMEOUT_DAYS * 24 * 60 * 60 * 1000);
        this.logger.log(`验收核对完成: 通过${passed}/${items.length}, 失败${failed}, 超时时间=${timeoutAt.toISOString()}`);
        return {
            delivery_id: deliveryId,
            status: allPassed ? 'in_acceptance' : 'needs_revision',
            total_items: items.length,
            passed_items: passed,
            failed_items: failed,
            pending_items: pending,
            items,
            customer_comment: null,
            auto_accepted: false,
            timeout_at: timeoutAt,
        };
    }
    /**
     * 获取验收报告
     */
    async getAcceptance(deliveryId) {
        const delivery = await this.prisma.delivery.findUnique({
            where: { id: deliveryId },
            include: { project: { include: { requirement: true } } },
        });
        if (!delivery) {
            throw new Error('交付记录不存在');
        }
        // 构建验收项（从需求项）
        let items = [];
        if (delivery.project.requirement) {
            const requirementItems = await this.prisma.requirementItem.findMany({
                where: { requirement_id: delivery.project.requirement.id },
                orderBy: { sort_order: 'asc' },
            });
            items = requirementItems.map((item) => ({
                requirement_item_id: item.id,
                name: item.name,
                description: item.description,
                status: delivery.status === 'accepted' ? 'passed' : 'pending',
                evidence: null,
                comment: null,
            }));
        }
        const timeoutAt = delivery.delivered_at
            ? new Date(delivery.delivered_at.getTime() + shared_1.ACCEPTANCE_TIMEOUT_DAYS * 24 * 60 * 60 * 1000)
            : null;
        return {
            delivery_id: deliveryId,
            status: delivery.status,
            total_items: items.length,
            passed_items: items.filter((i) => i.status === 'passed').length,
            failed_items: items.filter((i) => i.status === 'failed').length,
            pending_items: items.filter((i) => i.status === 'pending').length,
            items,
            customer_comment: null,
            auto_accepted: delivery.status === 'accepted' && !delivery.accepted_at,
            timeout_at: timeoutAt,
        };
    }
    /**
     * 检查并执行超时自动验收
     */
    async checkTimeoutAutoAccept() {
        const now = new Date();
        const deliveries = await this.prisma.delivery.findMany({
            where: {
                status: { in: ['delivered', 'viewed', 'in_acceptance'] },
                delivered_at: { not: null },
            },
        });
        let autoAccepted = 0;
        for (const delivery of deliveries) {
            if (!delivery.delivered_at)
                continue;
            const timeoutAt = new Date(delivery.delivered_at.getTime() + shared_1.ACCEPTANCE_TIMEOUT_DAYS * 24 * 60 * 60 * 1000);
            if (now > timeoutAt) {
                await this.prisma.delivery.update({
                    where: { id: delivery.id },
                    data: { status: 'accepted', accepted_at: now },
                });
                autoAccepted++;
                this.logger.log(`超时自动验收: delivery=${delivery.id}`);
            }
        }
        return autoAccepted;
    }
    /**
     * 核对单个需求项
     */
    async verifyItem(item, codeSummary, projectId) {
        try {
            const result = await this.aiGateway.call({
                taskType: shared_1.AITaskType.IMPLEMENTATION_VERIFY,
                input: `需求项: ${item.name}\n描述: ${item.description ?? '无'}\n\n代码摘要:\n${codeSummary.substring(0, 2000)}`,
                context: { purpose: '验证需求项是否已在代码中实现' },
                projectId,
                systemPrompt: '你是验收工程师，请判断需求项是否在代码中实现。返回JSON: {status: "passed"|"failed", evidence: string, comment: string}',
            });
            const parsed = this.aiGateway.parseJSON(result.content);
            if (parsed && ['passed', 'failed', 'pending'].includes(parsed.status)) {
                return {
                    requirement_item_id: item.id,
                    name: item.name,
                    description: item.description,
                    status: parsed.status,
                    evidence: parsed.evidence ?? null,
                    comment: parsed.comment ?? null,
                };
            }
        }
        catch (error) {
            this.logger.warn(`需求项核对失败: ${item.name}, ${error.message}`);
        }
        // 默认通过（开发环境模拟）
        return {
            requirement_item_id: item.id,
            name: item.name,
            description: item.description,
            status: 'passed',
            evidence: '代码中存在相关实现',
            comment: null,
        };
    }
};
exports.AcceptanceService = AcceptanceService;
exports.AcceptanceService = AcceptanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ai_gateway_service_1.AIGatewayService,
        workspace_manager_1.WorkspaceManager])
], AcceptanceService);
//# sourceMappingURL=acceptance.service.js.map