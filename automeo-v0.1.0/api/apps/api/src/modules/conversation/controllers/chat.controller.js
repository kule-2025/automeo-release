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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatController = void 0;
const common_1 = require("@nestjs/common");
const chat_service_1 = require("../services/chat.service");
const intent_router_service_1 = require("../services/intent-router.service");
const workflow_executor_service_1 = require("../services/workflow-executor.service");
const chat_dto_1 = require("../dto/chat.dto");
/**
 * 对话式工作流控制器
 *
 * 路由前缀：/chat
 *
 * 接口列表：
 * - GET    /chat/sessions              会话列表
 * - POST   /chat/sessions              创建会话
 * - GET    /chat/sessions/:id/messages 会话消息列表
 * - POST   /chat/sessions/:id/messages 发送消息（核心接口）
 * - PUT    /chat/sessions/:id          重命名/归档会话
 */
let ChatController = class ChatController {
    constructor(chatService, intentRouter, workflowExecutor) {
        this.chatService = chatService;
        this.intentRouter = intentRouter;
        this.workflowExecutor = workflowExecutor;
        this.logger = new common_1.Logger('ChatController');
    }
    // ==================== 会话管理 ====================
    /**
     * GET /chat/sessions - 获取当前用户的会话列表
     */
    async listSessions() {
        // 演示模式使用固定用户ID，实际应从 JWT 中提取
        const userId = 'system-user';
        const sessions = await this.chatService.listSessions(userId);
        return { code: 0, message: 'success', data: sessions };
    }
    /**
     * POST /chat/sessions - 创建新会话
     */
    async createSession(dto) {
        const userId = 'system-user';
        const session = await this.chatService.createSession(userId, dto.title);
        return {
            code: 0,
            message: 'success',
            data: {
                id: session.id,
                title: session.title,
                status: session.status,
                created_at: session.created_at,
            },
        };
    }
    /**
     * PUT /chat/sessions/:id - 重命名或归档会话
     */
    async updateSession(id, dto) {
        const session = await this.chatService.updateSession(id, {
            title: dto.title,
            status: dto.status,
        });
        return {
            code: 0,
            message: 'success',
            data: {
                id: session.id,
                title: session.title,
                status: session.status,
                updated_at: session.updated_at,
            },
        };
    }
    // ==================== 消息管理 ====================
    /**
     * GET /chat/sessions/:id/messages - 获取会话消息列表
     */
    async getMessages(id) {
        const messages = await this.chatService.getMessages(id);
        const data = messages.map((m) => ({
            session_id: m.session_id,
            message_id: m.id,
            role: m.role,
            content: m.content,
            intent: m.intent || undefined,
            action_json: m.action_json || undefined,
            structured_data: m.action_json?.data,
            created_at: m.created_at,
        }));
        return { code: 0, message: 'success', data };
    }
    /**
     * POST /chat/sessions/:id/messages - 发送消息（核心接口）
     *
     * 处理流程：
     * 1. 保存用户消息
     * 2. 构建多轮对话上下文
     * 3. 意图识别（关键词 + AI）
     * 4. 工作流执行（调用真实业务服务）
     * 5. 生成自然语言回复
     * 6. 保存助手消息
     * 7. 返回完整响应
     */
    async sendMessage(sessionId, dto) {
        const startTime = Date.now();
        this.logger.log(`收到消息: session=${sessionId} content="${dto.content.slice(0, 50)}..."`);
        // 1. 保存用户消息
        await this.chatService.saveUserMessage(sessionId, dto.content);
        // 2. 自动生成会话标题（基于首条消息）
        await this.chatService.autoTitleFromFirstMessage(sessionId, dto.content);
        // 3. 构建多轮上下文
        const context = await this.chatService.buildContext(sessionId);
        // 4. 意图识别
        const intent = await this.intentRouter.route(dto.content, context.history);
        this.logger.log(`意图识别: action=${intent.action} confidence=${intent.confidence} source=${intent.source} ` +
            `keywords=[${intent.matched_keywords.join(',')}]`);
        // 5. 执行工作流
        const execution = await this.workflowExecutor.execute(intent);
        // 6. 生成自然语言回复
        const replyContent = this.buildReplyContent(dto.content, intent, execution);
        // 7. 保存助手消息
        const assistantMessage = await this.chatService.saveAssistantMessage(sessionId, replyContent, intent, execution);
        // 8. 每5轮更新一次摘要
        if (context.round % 5 === 0) {
            const summary = `第${context.round}轮：用户询问"${dto.content.slice(0, 30)}"，识别意图为${intent.action}。`;
            await this.chatService.updateSummary(sessionId, summary);
        }
        const duration = Date.now() - startTime;
        this.logger.log(`消息处理完成: duration=${duration}ms action=${intent.action} success=${execution.success}`);
        return {
            code: 0,
            message: 'success',
            data: {
                session_id: sessionId,
                message_id: assistantMessage.id,
                role: chat_dto_1.ChatRole.ASSISTANT,
                content: replyContent,
                intent: intent.action,
                action_json: {
                    action: execution.action,
                    success: execution.success,
                    summary: execution.summary,
                    intent_confidence: intent.confidence,
                    intent_source: intent.source,
                    matched_keywords: intent.matched_keywords,
                    params: intent.params,
                    duration_ms: duration,
                },
                structured_data: execution.data,
                created_at: assistantMessage.created_at,
            },
        };
    }
    // ==================== 内部方法 ====================
    /**
     * 构建助手回复内容
     * 结合执行结果摘要 + 结构化数据指引
     */
    buildReplyContent(userMessage, intent, execution) {
        if (!execution.success) {
            return `抱歉，处理您的请求时遇到问题：${execution.error || '未知错误'}。请稍后重试或换一种方式描述。`;
        }
        // 意图标签前缀
        const intentLabels = {
            query_opportunities: '查询商机',
            query_customers: '查询客户',
            trigger_communication: '客户沟通',
            query_projects: '查询项目',
            query_finance: '查询财务',
            generate_quote: '生成报价',
            query_quality: '代码质量',
            query_alerts: '查看告警',
            generate_report: '经营报表',
            system_help: '系统帮助',
        };
        const label = intentLabels[intent.action] || intent.action;
        // 对于帮助类，直接返回完整内容
        if (intent.action === 'system_help') {
            return execution.summary;
        }
        // 对于经营报表，返回完整摘要
        if (intent.action === 'generate_report') {
            return execution.summary;
        }
        // 通用回复：摘要 + 数据卡片提示
        const dataCount = this.countDataItems(execution.data);
        if (dataCount > 0) {
            return `${execution.summary}\n\n*已为您查询到 ${dataCount} 条相关数据，详见下方数据卡片。*`;
        }
        return execution.summary;
    }
    /**
     * 统计结构化数据中的条目数量
     */
    countDataItems(data) {
        if (Array.isArray(data.list))
            return data.list.length;
        if (Array.isArray(data.actions))
            return data.actions.length;
        if (Array.isArray(data.recent_submissions))
            return data.recent_submissions.length;
        if (data.total !== undefined && typeof data.total === 'number')
            return data.total;
        return 0;
    }
};
exports.ChatController = ChatController;
__decorate([
    (0, common_1.Get)('sessions'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "listSessions", null);
__decorate([
    (0, common_1.Post)('sessions'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [chat_dto_1.CreateSessionDto]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "createSession", null);
__decorate([
    (0, common_1.Put)('sessions/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, chat_dto_1.UpdateSessionDto]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "updateSession", null);
__decorate([
    (0, common_1.Get)('sessions/:id/messages'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getMessages", null);
__decorate([
    (0, common_1.Post)('sessions/:id/messages'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, chat_dto_1.SendMessageDto]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "sendMessage", null);
exports.ChatController = ChatController = __decorate([
    (0, common_1.Controller)('chat'),
    __metadata("design:paramtypes", [chat_service_1.ChatService,
        intent_router_service_1.IntentRouterService,
        workflow_executor_service_1.WorkflowExecutorService])
], ChatController);
//# sourceMappingURL=chat.controller.js.map