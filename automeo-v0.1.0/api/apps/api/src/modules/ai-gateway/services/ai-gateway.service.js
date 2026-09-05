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
exports.AIGatewayService = void 0;
const common_1 = require("@nestjs/common");
const shared_1 = require("../../../../../../packages/shared/src");
const model_router_service_1 = require("./model-router.service");
const token_meter_service_1 = require("./token-meter.service");
const fallback_service_1 = require("./fallback.service");
const prompt_builder_service_1 = require("./prompt-builder.service");
const doubao_provider_1 = require("../providers/doubao.provider");
const openai_compatible_provider_1 = require("../providers/openai-compatible.provider");
/**
 * AI网关统一调用入口 - 所有业务模块必须通过此服务调用AI
 */
let AIGatewayService = class AIGatewayService {
    constructor(modelRouter, tokenMeter, fallback, promptBuilder, doubaoProvider, openaiProvider) {
        this.modelRouter = modelRouter;
        this.tokenMeter = tokenMeter;
        this.fallback = fallback;
        this.promptBuilder = promptBuilder;
        this.doubaoProvider = doubaoProvider;
        this.openaiProvider = openaiProvider;
        this.logger = new common_1.Logger('AIGateway');
    }
    /**
     * 统一AI调用入口
     */
    async call(params) {
        const startTime = Date.now();
        const { taskType, input, context = {}, projectId, taskId, systemPrompt } = params;
        // 1. 构建提示词
        const prompt = this.promptBuilder.build(taskType, { input, ...context });
        const sysPrompt = systemPrompt || `你是全自动经营管理系统的AI助手。当前任务: ${taskType}`;
        // 2. 路由模型
        const { model } = this.modelRouter.route(taskType);
        // 3. 选择提供商
        const provider = this.getProvider();
        // 4. 带重试降级执行
        const messages = [
            { role: 'system', content: sysPrompt },
            { role: 'user', content: prompt },
        ];
        const { result, model: actualModel } = await this.fallback.executeWithFallback((m) => provider.chatCompletion(messages, m), model, (current) => this.modelRouter.getFallbackModel(current));
        const durationMs = Date.now() - startTime;
        // 5. 记录Token消耗
        await this.tokenMeter.record({
            project_id: projectId,
            task_id: taskId,
            model: actualModel,
            task_type: taskType,
            prompt_tokens: result.usage.prompt_tokens,
            completion_tokens: result.usage.completion_tokens,
        });
        const cost = this.tokenMeter.calculateCost(result.usage.prompt_tokens, result.usage.completion_tokens);
        this.logger.log(`AI调用完成 task=${taskType} model=${actualModel} tokens=${result.usage.total_tokens} cost=¥${cost.toFixed(4)} duration=${durationMs}ms`);
        return {
            content: result.content,
            model: actualModel,
            taskType,
            usage: result.usage,
            cost,
            duration_ms: durationMs,
        };
    }
    /**
     * 解析JSON格式的AI响应
     */
    parseJSON(content) {
        try {
            // 尝试提取JSON块
            const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : content;
            return JSON.parse(jsonStr.trim());
        }
        catch {
            try {
                return JSON.parse(content);
            }
            catch {
                this.logger.warn('AI响应JSON解析失败');
                return null;
            }
        }
    }
    getProvider() {
        const providerType = (process.env.AI_PROVIDER || 'doubao');
        switch (providerType) {
            case shared_1.AIProvider.OPENAI_COMPATIBLE:
                return this.openaiProvider;
            case shared_1.AIProvider.DOUBAO:
            default:
                return this.doubaoProvider;
        }
    }
    // ===== 业务便捷方法 =====
    async analyzeOpportunity(title, description, context) {
        const result = await this.call({
            taskType: shared_1.AITaskType.OPPORTUNITY_ANALYSIS,
            input: `商机标题: ${title}\n\n商机描述: ${description}`,
            context,
        });
        return result.content;
    }
    async generateChatReply(customerContext, history, customerMessage, projectId) {
        const result = await this.call({
            taskType: shared_1.AITaskType.CHAT_REPLY,
            input: `客户信息: ${customerContext}\n\n对话历史:\n${history}\n\n客户最新消息: ${customerMessage}`,
            projectId,
        });
        return result.content;
    }
    async analyzeIntent(message, history) {
        const result = await this.call({
            taskType: shared_1.AITaskType.INTENT_ANALYSIS,
            input: `对话历史:\n${history || '无'}\n\n最新消息: ${message}`,
        });
        return result.content;
    }
    async generateCode(taskDescription, techStack, context, projectId, taskId) {
        const result = await this.call({
            taskType: shared_1.AITaskType.CODE_GENERATION,
            input: `技术栈: ${techStack}\n\n任务描述: ${taskDescription}\n\n上下文: ${context || '无'}`,
            projectId,
            taskId,
            systemPrompt: `你是资深${techStack}开发者，请编写高质量、可维护的代码。`,
        });
        return result.content;
    }
    async reviewCode(code, file, projectId) {
        const result = await this.call({
            taskType: shared_1.AITaskType.CODE_REVIEW,
            input: `文件: ${file}\n\n代码:\n${code}`,
            projectId,
        });
        return result.content;
    }
};
exports.AIGatewayService = AIGatewayService;
exports.AIGatewayService = AIGatewayService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [model_router_service_1.ModelRouterService,
        token_meter_service_1.TokenMeterService,
        fallback_service_1.FallbackService,
        prompt_builder_service_1.PromptBuilderService,
        doubao_provider_1.DoubaoProvider,
        openai_compatible_provider_1.OpenAICompatibleProvider])
], AIGatewayService);
//# sourceMappingURL=ai-gateway.service.js.map