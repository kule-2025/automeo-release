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
exports.ChatAgentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const ai_gateway_service_1 = require("../../ai-gateway/services/ai-gateway.service");
const intent_service_1 = require("./intent.service");
const customer_profile_service_1 = require("./customer-profile.service");
const shared_1 = require("../../../../../../packages/shared/src");
/**
 * 聊天代理服务
 * 处理客户回复，进行意图识别，生成智能回复
 */
let ChatAgentService = class ChatAgentService {
    constructor(prisma, aiGateway, intentService, profileService) {
        this.prisma = prisma;
        this.aiGateway = aiGateway;
        this.intentService = intentService;
        this.profileService = profileService;
        this.logger = new common_1.Logger('ChatAgent');
    }
    /**
     * 处理客户回复
     * 1. 保存客户消息
     * 2. 意图识别
     * 3. 更新客户等级和状态
     * 4. 生成智能回复
     * 5. 更新客户画像
     */
    async handleReply(customerId, content) {
        const customer = await this.prisma.customer.findUnique({
            where: { id: customerId },
            include: {
                communications: {
                    orderBy: { created_at: 'desc' },
                    take: 10,
                },
            },
        });
        if (!customer) {
            throw new Error('客户不存在');
        }
        // 1. 保存客户消息
        const customerMessage = await this.prisma.communication.create({
            data: {
                customer_id: customerId,
                direction: shared_1.CommunicationDirection.INBOUND,
                content,
            },
        });
        // 2. 构建对话历史
        const historyText = customer.communications
            .slice()
            .reverse()
            .map((m) => `${m.direction === 'inbound' ? '客户' : '我方'}: ${m.content}`)
            .join('\n');
        // 3. 意图识别
        const intentResult = await this.intentService.analyze(content, historyText);
        // 更新客户消息的意图标签
        await this.prisma.communication.update({
            where: { id: customerMessage.id },
            data: {
                intent_tag: intentResult.intent,
                emotion: intentResult.emotion,
            },
        });
        // 4. 更新客户等级和状态
        const newLevel = this.determineLevel(customer.level, intentResult, customer.communications.length + 1);
        const newStatus = this.determineStatus(customer.status, intentResult.intent);
        await this.prisma.customer.update({
            where: { id: customerId },
            data: {
                level: newLevel,
                status: newStatus,
                last_contact_at: new Date(),
                deal_probability: this.calculateDealProbability(newLevel, newStatus, intentResult),
                intent_project: intentResult.intent === shared_1.IntentTag.CLEAR_REQUIREMENT
                    ? (customer.intent_project || '待明确需求')
                    : customer.intent_project,
            },
        });
        // 5. 生成智能回复
        let reply;
        try {
            const customerContext = `客户等级: ${newLevel}\n客户状态: ${newStatus}\n意图: ${intentResult.intent}\n情绪: ${intentResult.emotion}\n关键信息: ${intentResult.key_info.join(', ')}`;
            reply = await this.aiGateway.generateChatReply(customerContext, historyText, content);
            reply = reply.trim();
        }
        catch (error) {
            this.logger.warn(`智能回复生成失败，使用模板回复: ${error.message}`);
            reply = this.generateTemplateReply(intentResult.intent);
        }
        // 6. 保存智能回复
        const replyMessage = await this.prisma.communication.create({
            data: {
                customer_id: customerId,
                direction: shared_1.CommunicationDirection.OUTBOUND,
                content: reply,
                intent_tag: 'auto_reply',
                emotion: 'professional',
            },
        });
        // 7. 异步更新画像（不阻塞）
        this.profileService.updateProfile(customerId).catch((err) => {
            this.logger.warn(`画像更新失败: ${err.message}`);
        });
        this.logger.log(`客户回复处理完成 customer=${customerId} intent=${intentResult.intent} level=${newLevel}`);
        return {
            customer_message_id: customerMessage.id,
            intent: intentResult.intent,
            emotion: intentResult.emotion,
            customer_level: newLevel,
            next_action: intentResult.next_action,
            reply,
            reply_id: replyMessage.id,
        };
    }
    /**
     * 根据意图和沟通历史确定客户等级
     */
    determineLevel(currentLevel, intent, messageCount) {
        // AI 给出的等级作为主要参考
        const aiLevel = intent.customer_level;
        // A类降级保护：A类客户不会因为单条消息降级
        if (currentLevel === shared_1.CustomerLevel.A && messageCount < 10) {
            if (intent.intent === shared_1.IntentTag.NO_INTEREST)
                return shared_1.CustomerLevel.B;
            return shared_1.CustomerLevel.A;
        }
        return aiLevel || currentLevel;
    }
    /**
     * 根据意图确定客户状态
     */
    determineStatus(currentStatus, intent) {
        switch (intent) {
            case shared_1.IntentTag.CLEAR_REQUIREMENT:
                return shared_1.CustomerStatus.INTENT_CLEAR;
            case shared_1.IntentTag.NEGOTIATION:
                return shared_1.CustomerStatus.COMMUNICATING;
            case shared_1.IntentTag.QUESTION:
            case shared_1.IntentTag.GENERAL_CHAT:
                return shared_1.CustomerStatus.COMMUNICATING;
            case shared_1.IntentTag.NO_INTEREST:
                return shared_1.CustomerStatus.FOLLOW_UP;
            default:
                return currentStatus === shared_1.CustomerStatus.NEW ? shared_1.CustomerStatus.CONTACTED : currentStatus;
        }
    }
    /**
     * 计算成交概率
     */
    calculateDealProbability(level, status, intent) {
        let probability = 20;
        // 等级权重
        if (level === shared_1.CustomerLevel.A)
            probability += 40;
        else if (level === shared_1.CustomerLevel.B)
            probability += 20;
        // 状态权重
        if (status === shared_1.CustomerStatus.INTENT_CLEAR)
            probability += 20;
        else if (status === shared_1.CustomerStatus.COMMUNICATING)
            probability += 10;
        else if (status === shared_1.CustomerStatus.CONVERTED)
            probability = 100;
        // 意图置信度
        probability += Math.round(intent.confidence * 10);
        return Math.min(95, Math.max(5, probability));
    }
    generateTemplateReply(intent) {
        switch (intent) {
            case shared_1.IntentTag.CLEAR_REQUIREMENT:
                return '感谢您的详细说明！我已记录您的需求，稍后会整理一份初步的方案和报价供您参考。';
            case shared_1.IntentTag.NEGOTIATION:
                return '理解您的关注。我们可以根据具体需求调整方案，在保证质量的前提下尽量优化成本，您方便说一下预算范围吗？';
            case shared_1.IntentTag.QUESTION:
                return '好的，我来详细解答您的问题。请问您具体想了解哪方面的信息？';
            case shared_1.IntentTag.NO_INTEREST:
                return '好的，理解您的情况。如果后续有需要，随时联系我们，祝您工作顺利！';
            default:
                return '收到您的消息，我们会尽快回复您。';
        }
    }
};
exports.ChatAgentService = ChatAgentService;
exports.ChatAgentService = ChatAgentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ai_gateway_service_1.AIGatewayService,
        intent_service_1.IntentService,
        customer_profile_service_1.CustomerProfileService])
], ChatAgentService);
//# sourceMappingURL=chat-agent.service.js.map