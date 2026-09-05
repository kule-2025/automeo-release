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
var FunctionCallingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FunctionCallingService = void 0;
const common_1 = require("@nestjs/common");
const tool_registry_service_1 = require("../../tool/services/tool-registry.service");
const doubao_provider_1 = require("../providers/doubao.provider");
/**
 * Function Calling 服务 - AI Agent工具调用核心
 *
 * 实现完整的工具调用循环：
 * 1. 调用AI（传入tools定义作为function definitions）
 * 2. 解析AI响应中的tool_calls
 * 3. 通过ToolRegistry执行对应工具
 * 4. 将工具结果作为tool role消息追加到对话
 * 5. 再次调用AI，让AI基于结果继续推理
 * 6. 循环直到AI不再调用工具（最多5轮）
 */
let FunctionCallingService = FunctionCallingService_1 = class FunctionCallingService {
    constructor(toolRegistry, doubaoProvider) {
        this.toolRegistry = toolRegistry;
        this.doubaoProvider = doubaoProvider;
        this.logger = new common_1.Logger('FunctionCalling');
    }
    /**
     * 带工具调用的AI对话 - 核心方法
     *
     * @param userInput 用户输入
     * @param availableTools 可用工具名称列表（空数组表示全部已启用工具）
     * @param systemPrompt 系统提示词
     * @param context 上下文信息（caller_type, caller_id, project_id）
     */
    async callWithTools(params) {
        const startTime = Date.now();
        const { userInput, availableTools = [], systemPrompt, context = {} } = params;
        // 1. 获取可用工具定义
        const allTools = this.toolRegistry.getToolDefinitionsForAI(true);
        const tools = availableTools.length > 0
            ? allTools.filter((t) => availableTools.includes(t.name))
            : allTools;
        if (tools.length === 0) {
            this.logger.warn('没有可用的工具，将执行普通AI对话');
        }
        // 2. 构建初始消息
        const enhancedSystemPrompt = this.buildSystemPrompt(systemPrompt, tools);
        const messages = [
            { role: 'system', content: enhancedSystemPrompt },
            { role: 'user', content: userInput },
        ];
        const toolCallHistory = [];
        let finalContent = '';
        let totalPromptTokens = 0;
        let totalCompletionTokens = 0;
        let modelUsed = 'doubao-function-calling';
        // 3. 工具调用循环（最多5轮）
        for (let round = 1; round <= FunctionCallingService_1.MAX_ROUNDS; round++) {
            this.logger.log(`Function Calling 第 ${round} 轮，当前消息数: ${messages.length}`);
            // 3.1 调用AI
            const aiResponse = await this.callAIWithTools(messages, tools, userInput, round);
            totalPromptTokens += aiResponse.usage.prompt_tokens;
            totalCompletionTokens += aiResponse.usage.completion_tokens;
            modelUsed = aiResponse.model;
            // 3.2 解析AI响应中的工具调用
            const toolCalls = this.parseToolCalls(aiResponse.content);
            if (toolCalls.length === 0) {
                // AI不再调用工具，返回最终回复
                finalContent = aiResponse.content;
                this.logger.log(`第 ${round} 轮：AI未请求工具调用，循环结束`);
                break;
            }
            this.logger.log(`第 ${round} 轮：AI请求调用 ${toolCalls.length} 个工具: ${toolCalls.map((tc) => tc.name).join(', ')}`);
            // 3.3 将AI的工具调用请求添加到消息历史
            messages.push({
                role: 'assistant',
                content: aiResponse.content,
                tool_calls: toolCalls.map((tc) => ({
                    id: tc.id,
                    type: 'function',
                    function: {
                        name: tc.name,
                        arguments: JSON.stringify(tc.arguments),
                    },
                })),
            });
            // 3.4 执行每个工具调用
            for (const toolCall of toolCalls) {
                const toolStartTime = Date.now();
                // 检查工具是否存在且可用
                const tool = this.toolRegistry.getTool(toolCall.name);
                if (!tool) {
                    const errorMsg = `工具不存在: ${toolCall.name}`;
                    this.logger.warn(errorMsg);
                    toolCallHistory.push({
                        id: toolCall.id,
                        tool_name: toolCall.name,
                        arguments: toolCall.arguments,
                        result: null,
                        success: false,
                        error: errorMsg,
                        duration_ms: Date.now() - toolStartTime,
                        round,
                    });
                    // 将错误结果返回给AI
                    messages.push({
                        role: 'tool',
                        tool_call_id: toolCall.id,
                        name: toolCall.name,
                        content: JSON.stringify({ error: errorMsg }),
                    });
                    continue;
                }
                // 执行工具
                const executionResult = await this.toolRegistry.execute(toolCall.name, toolCall.arguments, {
                    caller_type: context.caller_type || 'agent',
                    caller_id: context.caller_id,
                    project_id: context.project_id,
                });
                toolCallHistory.push({
                    id: toolCall.id,
                    tool_name: toolCall.name,
                    arguments: toolCall.arguments,
                    result: executionResult.data,
                    success: executionResult.success,
                    error: executionResult.error,
                    duration_ms: executionResult.duration_ms,
                    round,
                });
                // 将工具结果作为tool role消息追加
                messages.push({
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    name: toolCall.name,
                    content: JSON.stringify(executionResult.success
                        ? executionResult.data
                        : { error: executionResult.error }),
                });
                this.logger.log(`工具执行完成: ${toolCall.name} success=${executionResult.success} duration=${executionResult.duration_ms}ms`);
            }
            // 3.5 如果是最后一轮，AI还在调用工具，强制结束
            if (round === FunctionCallingService_1.MAX_ROUNDS) {
                finalContent = `（已达到最大工具调用轮次 ${FunctionCallingService_1.MAX_ROUNDS}，基于已有工具结果生成最终回复）\n\n` +
                    this.summarizeToolResults(toolCallHistory);
                this.logger.warn(`达到最大轮次限制 ${FunctionCallingService_1.MAX_ROUNDS}，强制结束`);
                break;
            }
        }
        const totalDuration = Date.now() - startTime;
        this.logger.log(`Function Calling 完成: ${toolCallHistory.length} 次工具调用, ${totalDuration}ms`);
        return {
            final_content: finalContent,
            tool_calls: toolCallHistory,
            total_rounds: toolCallHistory.length > 0 ? Math.max(...toolCallHistory.map((t) => t.round)) : 1,
            total_duration_ms: totalDuration,
            model: modelUsed,
            usage: {
                prompt_tokens: totalPromptTokens,
                completion_tokens: totalCompletionTokens,
                total_tokens: totalPromptTokens + totalCompletionTokens,
            },
        };
    }
    /**
     * 解析AI响应中的工具调用
     * 支持两种格式：
     * 1. JSON格式：{"tool_calls": [{"name": "...", "arguments": {...}}]}
     * 2. 代码块格式：```tool_call {"name": "...", "arguments": {...}} ```
     */
    parseToolCalls(content) {
        if (!content || content.trim().length === 0) {
            return [];
        }
        const toolCalls = [];
        // 格式1：```tool_call 代码块
        const codeBlockRegex = /```tool_call\s*([\s\S]*?)```/gi;
        let match;
        while ((match = codeBlockRegex.exec(content)) !== null) {
            try {
                const parsed = JSON.parse(match[1].trim());
                if (parsed.name && typeof parsed.name === 'string') {
                    toolCalls.push({
                        id: `call_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
                        name: parsed.name,
                        arguments: parsed.arguments || parsed.params || {},
                    });
                }
            }
            catch {
                this.logger.warn('tool_call代码块JSON解析失败');
            }
        }
        // 格式2：JSON中的tool_calls数组
        if (toolCalls.length === 0) {
            try {
                // 尝试提取JSON
                const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
                    if (Array.isArray(parsed.tool_calls)) {
                        for (const tc of parsed.tool_calls) {
                            if (tc.name && typeof tc.name === 'string') {
                                const args = typeof tc.arguments === 'string'
                                    ? JSON.parse(tc.arguments)
                                    : tc.arguments || {};
                                toolCalls.push({
                                    id: tc.id || `call_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
                                    name: tc.name,
                                    arguments: args,
                                });
                            }
                        }
                    }
                    // 也支持单个tool_call对象
                    if (parsed.tool_call && parsed.tool_call.name) {
                        const tc = parsed.tool_call;
                        toolCalls.push({
                            id: tc.id || `call_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
                            name: tc.name,
                            arguments: tc.arguments || tc.params || {},
                        });
                    }
                }
            }
            catch {
                // JSON解析失败，不做处理
            }
        }
        return toolCalls;
    }
    /**
     * 将工具定义格式化为AI可理解的function definitions（OpenAI格式）
     */
    formatToolsForPrompt(tools) {
        return tools.map((tool) => ({
            name: tool.name,
            description: tool.description,
            parameters: {
                type: 'object',
                properties: this.convertSchemaProperties(tool.parameters.properties),
                required: tool.parameters.required,
            },
        }));
    }
    // ===== 私有方法 =====
    /**
     * 构建增强的系统提示词，告知AI可用工具
     */
    buildSystemPrompt(basePrompt, tools) {
        const toolDescriptions = tools
            .map((t) => `- ${t.name} (${t.display_name}): ${t.description}\n  参数: ${JSON.stringify(t.parameters.properties)}`)
            .join('\n');
        const toolInstruction = `
你是一个具备工具调用能力的AI助手。你可以使用以下工具来完成任务：

${toolDescriptions}

## 工具调用规则
1. 当需要外部信息或执行操作时，使用工具调用
2. 工具调用格式：使用\`\`\`tool_call 代码块，内容为JSON：
   \`\`\`tool_call
   {"name": "工具名", "arguments": {"参数名": "参数值"}}
   \`\`\`
3. 每次可以调用一个或多个工具
4. 工具结果返回后，基于结果继续回答
5. 如果不需要工具，直接回答用户问题
6. 最多进行5轮工具调用

${basePrompt || '你是全自动经营管理系统的AI助手。'}
`;
        return toolInstruction;
    }
    /**
     * 调用AI（工具调用模式下执行Function Calling循环）
     */
    async callAIWithTools(messages, tools, originalUserInput, round) {
        const baseMessages = messages.map((m) => ({
            role: m.role === 'tool' ? 'user' : m.role,
            content: m.role === 'tool' ? `[工具结果 ${m.name}]: ${m.content}` : m.content,
        }));
        return this.doubaoProvider.chatCompletion(baseMessages, 'function-calling-model');
    }
    /**
     * 转换JSON Schema属性为OpenAI格式
     */
    convertSchemaProperties(properties) {
        const result = {};
        for (const [key, value] of Object.entries(properties)) {
            const prop = value;
            result[key] = {
                type: prop.type,
                description: prop.description || '',
                ...(prop.enum ? { enum: prop.enum } : {}),
                ...(prop.default !== undefined ? { default: prop.default } : {}),
                ...(prop.minimum !== undefined ? { minimum: prop.minimum } : {}),
                ...(prop.maximum !== undefined ? { maximum: prop.maximum } : {}),
            };
        }
        return result;
    }
    /**
     * 汇总工具调用结果（达到最大轮次时使用）
     */
    summarizeToolResults(toolCalls) {
        const successCalls = toolCalls.filter((tc) => tc.success);
        const failedCalls = toolCalls.filter((tc) => !tc.success);
        let summary = `共执行 ${toolCalls.length} 次工具调用（成功 ${successCalls.length}，失败 ${failedCalls.length}）：\n\n`;
        for (const tc of toolCalls) {
            summary += `- ${tc.tool_name}: ${tc.success ? '成功' : '失败'} (${tc.duration_ms}ms)\n`;
            if (tc.error) {
                summary += `  错误: ${tc.error}\n`;
            }
        }
        return summary;
    }
};
exports.FunctionCallingService = FunctionCallingService;
FunctionCallingService.MAX_ROUNDS = 5;
exports.FunctionCallingService = FunctionCallingService = FunctionCallingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [tool_registry_service_1.ToolRegistryService,
        doubao_provider_1.DoubaoProvider])
], FunctionCallingService);
//# sourceMappingURL=function-calling.service.js.map