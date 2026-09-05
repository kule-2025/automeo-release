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
exports.IntentService = void 0;
const common_1 = require("@nestjs/common");
const ai_gateway_service_1 = require("../../ai-gateway/services/ai-gateway.service");
const shared_1 = require("../../../../../../packages/shared/src");
/**
 * 意图识别服务
 * 调用 AI 网关分析客户消息，返回意图、情绪、关键信息、客户等级和下一步建议
 */
let IntentService = class IntentService {
    constructor(aiGateway) {
        this.aiGateway = aiGateway;
        this.logger = new common_1.Logger('IntentService');
    }
    /**
     * 分析客户消息意图
     */
    async analyze(message, history) {
        try {
            const aiContent = await this.aiGateway.analyzeIntent(message, history);
            const parsed = this.aiGateway.parseJSON(aiContent);
            if (parsed && parsed.intent) {
                return {
                    intent: this.normalizeIntent(parsed.intent),
                    confidence: parsed.confidence || 0.8,
                    emotion: parsed.emotion || 'neutral',
                    key_info: parsed.key_info || [],
                    customer_level: this.normalizeLevel(parsed.customer_level),
                    next_action: parsed.next_action || this.getDefaultNextAction(parsed.intent),
                };
            }
            // AI 返回非结构化时，基于规则兜底
            return this.ruleBasedAnalysis(message);
        }
        catch (error) {
            this.logger.warn(`意图分析AI调用失败，使用规则兜底: ${error.message}`);
            return this.ruleBasedAnalysis(message);
        }
    }
    /**
     * 客户分级规则：
     * A = 明确需求 + 预算匹配 + 积极回复
     * B = 需求不明确
     * C = 模糊/无预算
     */
    classifyCustomer(hasClearRequirement, hasBudget, isPositive, messageCount) {
        if (hasClearRequirement && hasBudget && isPositive) {
            return shared_1.CustomerLevel.A;
        }
        if (hasClearRequirement || (messageCount >= 3 && isPositive)) {
            return shared_1.CustomerLevel.B;
        }
        return shared_1.CustomerLevel.C;
    }
    normalizeIntent(intent) {
        const map = {
            clear_requirement: shared_1.IntentTag.CLEAR_REQUIREMENT,
            requirement: shared_1.IntentTag.CLEAR_REQUIREMENT,
            negotiation: shared_1.IntentTag.NEGOTIATION,
            price: shared_1.IntentTag.NEGOTIATION,
            question: shared_1.IntentTag.QUESTION,
            inquiry: shared_1.IntentTag.QUESTION,
            no_interest: shared_1.IntentTag.NO_INTEREST,
            reject: shared_1.IntentTag.NO_INTEREST,
            general_chat: shared_1.IntentTag.GENERAL_CHAT,
            chat: shared_1.IntentTag.GENERAL_CHAT,
        };
        return map[intent.toLowerCase()] || shared_1.IntentTag.UNKNOWN;
    }
    normalizeLevel(level) {
        const upper = level.toUpperCase();
        if (upper === 'A' || upper === 'B' || upper === 'C')
            return upper;
        return shared_1.CustomerLevel.C;
    }
    getDefaultNextAction(intent) {
        switch (intent) {
            case shared_1.IntentTag.CLEAR_REQUIREMENT:
                return '引导客户确认需求细节，进入需求对接流程';
            case shared_1.IntentTag.NEGOTIATION:
                return '了解客户预算范围，提供报价方案';
            case shared_1.IntentTag.QUESTION:
                return '详细解答客户疑问，建立信任';
            case shared_1.IntentTag.NO_INTEREST:
                return '礼貌结束对话，标记为低优先级，定期回访';
            case shared_1.IntentTag.GENERAL_CHAT:
                return '保持友好互动，逐步引导到业务话题';
            default:
                return '继续跟进，了解客户真实需求';
        }
    }
    /**
     * 基于关键词的规则兜底意图分析
     */
    ruleBasedAnalysis(message) {
        const text = message.toLowerCase();
        const hasBudget = /预算|报价|价格|费用|多少钱|元|万|k\$|\$/.test(text);
        const hasRequirement = /需要|想要|功能|开发|做一个|实现|系统|平台|app|小程序/.test(text);
        const isPositive = !(/不需要|不用|算了|不考虑|太贵|拒绝|没兴趣/.test(text));
        const isQuestion = /[?？]|怎么|如何|什么|多少|能不能|可以吗/.test(text);
        const isNegotiation = /便宜|优惠|打折|砍价|太贵|能不能少/.test(text);
        const isNoInterest = /不需要|不用|算了|不考虑|没兴趣|再看看/.test(text);
        let intent;
        let confidence = 0.6;
        if (isNoInterest) {
            intent = shared_1.IntentTag.NO_INTEREST;
            confidence = 0.85;
        }
        else if (isNegotiation) {
            intent = shared_1.IntentTag.NEGOTIATION;
            confidence = 0.8;
        }
        else if (hasRequirement && hasBudget) {
            intent = shared_1.IntentTag.CLEAR_REQUIREMENT;
            confidence = 0.75;
        }
        else if (isQuestion) {
            intent = shared_1.IntentTag.QUESTION;
            confidence = 0.7;
        }
        else if (hasRequirement) {
            intent = shared_1.IntentTag.CLEAR_REQUIREMENT;
            confidence = 0.6;
        }
        else {
            intent = shared_1.IntentTag.GENERAL_CHAT;
            confidence = 0.5;
        }
        const level = this.classifyCustomer(hasRequirement, hasBudget, isPositive, 1);
        const keyInfo = [];
        if (hasBudget)
            keyInfo.push('提及预算/价格');
        if (hasRequirement)
            keyInfo.push('提及开发需求');
        if (isQuestion)
            keyInfo.push('包含疑问');
        return {
            intent,
            confidence,
            emotion: isPositive ? 'positive' : isNoInterest ? 'negative' : 'neutral',
            key_info: keyInfo,
            customer_level: level,
            next_action: this.getDefaultNextAction(intent),
        };
    }
};
exports.IntentService = IntentService;
exports.IntentService = IntentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [ai_gateway_service_1.AIGatewayService])
], IntentService);
//# sourceMappingURL=intent.service.js.map