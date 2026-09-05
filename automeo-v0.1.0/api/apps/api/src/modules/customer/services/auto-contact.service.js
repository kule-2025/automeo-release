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
exports.AutoContactService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const ai_gateway_service_1 = require("../../ai-gateway/services/ai-gateway.service");
const shared_1 = require("../../../../../../packages/shared/src");
/**
 * 自动联系服务
 * 生成开场白、发送消息
 */
let AutoContactService = class AutoContactService {
    constructor(prisma, aiGateway) {
        this.prisma = prisma;
        this.aiGateway = aiGateway;
        this.logger = new common_1.Logger('AutoContact');
    }
    /**
     * 生成并发送开场白
     */
    async sendFirstMessage(customerId) {
        const customer = await this.prisma.customer.findUnique({
            where: { id: customerId },
            include: { opportunity: true },
        });
        if (!customer) {
            throw new Error('客户不存在');
        }
        // 调用 AI 生成开场白
        let content;
        try {
            const result = await this.aiGateway.call({
                taskType: shared_1.AITaskType.FIRST_MESSAGE,
                input: `客户名称: ${customer.name}\n商机标题: ${customer.opportunity?.title || '未知'}\n商机描述: ${customer.opportunity?.description || ''}\n客户来源: ${customer.opportunity?.source_platform || '未知'}`,
                context: {
                    customer_level: customer.level,
                    intent_project: customer.intent_project || '',
                },
                systemPrompt: '你是专业的商务开发人员，请根据商机信息生成一段自然、专业、不超过100字的开场白，表达对客户需求的关注并邀请进一步沟通。',
            });
            content = result.content.trim();
        }
        catch (error) {
            this.logger.warn(`开场白AI生成失败，使用模板: ${error.message}`);
            content = this.generateTemplateMessage(customer.name, customer.opportunity?.title || '');
        }
        // 保存为系统发出的消息
        const communication = await this.prisma.communication.create({
            data: {
                customer_id: customerId,
                direction: shared_1.CommunicationDirection.OUTBOUND,
                content,
                intent_tag: 'first_contact',
                emotion: 'friendly',
            },
        });
        // 更新客户状态
        await this.prisma.customer.update({
            where: { id: customerId },
            data: {
                status: shared_1.CustomerStatus.CONTACTED,
                last_contact_at: new Date(),
            },
        });
        this.logger.log(`开场白已发送 customer=${customerId}`);
        return { content, communication_id: communication.id };
    }
    /**
     * 发送消息（系统/人工）
     */
    async sendMessage(customerId, content, direction = shared_1.CommunicationDirection.OUTBOUND, intentTag) {
        const communication = await this.prisma.communication.create({
            data: {
                customer_id: customerId,
                direction,
                content,
                intent_tag: intentTag,
            },
        });
        await this.prisma.customer.update({
            where: { id: customerId },
            data: { last_contact_at: new Date() },
        });
        return communication;
    }
    generateTemplateMessage(customerName, projectTitle) {
        return `您好${customerName ? '，' + customerName : ''}！看到您关于「${projectTitle}」的需求，我们在这方面有丰富经验，方便详细沟通一下具体需求吗？`;
    }
};
exports.AutoContactService = AutoContactService;
exports.AutoContactService = AutoContactService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ai_gateway_service_1.AIGatewayService])
], AutoContactService);
//# sourceMappingURL=auto-contact.service.js.map