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
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const chat_dto_1 = require("../dto/chat.dto");
const MAX_CONTEXT_ROUNDS = 10;
const DEFAULT_USER_ID = 'system-user';
/**
 * 会话与消息管理服务
 * 负责会话CRUD、消息持久化、多轮上下文管理（最近10轮+摘要）
 *
 * 注：由于不修改 prisma/schema.prisma，会话与消息使用内存存储；
 *     业务数据查询仍通过 PrismaService 走真实数据库。
 */
let ChatService = class ChatService {
    constructor() {
        this.logger = new common_1.Logger('ChatService');
        this.sessions = new Map();
        this.messages = new Map();
        this.seedDemoSessions();
    }
    // ==================== 会话管理 ====================
    /**
     * 创建会话
     */
    async createSession(userId, title) {
        const now = new Date();
        const session = {
            id: (0, crypto_1.randomUUID)(),
            user_id: userId,
            title: title || this.generateDefaultTitle(),
            status: chat_dto_1.ChatSessionStatus.ACTIVE,
            context_json: { summary: '', round: 0 },
            created_at: now,
            updated_at: now,
        };
        this.sessions.set(session.id, session);
        this.messages.set(session.id, []);
        this.logger.log(`创建会话: ${session.id} [${session.title}]`);
        return session;
    }
    /**
     * 获取会话列表
     */
    async listSessions(userId) {
        const result = [];
        for (const session of this.sessions.values()) {
            if (session.user_id !== userId)
                continue;
            const msgs = this.messages.get(session.id) || [];
            const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;
            result.push({
                id: session.id,
                title: session.title,
                status: session.status,
                last_message_at: lastMsg ? lastMsg.created_at : null,
                message_count: msgs.length,
                created_at: session.created_at,
                updated_at: session.updated_at,
            });
        }
        return result.sort((a, b) => (b.updated_at.getTime() - a.updated_at.getTime()));
    }
    /**
     * 获取会话详情
     */
    async getSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new common_1.NotFoundException('会话不存在');
        }
        return session;
    }
    /**
     * 更新会话（重命名/归档）
     */
    async updateSession(sessionId, updates) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new common_1.NotFoundException('会话不存在');
        }
        if (updates.title !== undefined)
            session.title = updates.title;
        if (updates.status !== undefined)
            session.status = updates.status;
        session.updated_at = new Date();
        this.sessions.set(sessionId, session);
        this.logger.log(`更新会话: ${sessionId} title=${updates.title} status=${updates.status}`);
        return session;
    }
    // ==================== 消息管理 ====================
    /**
     * 保存用户消息
     */
    async saveUserMessage(sessionId, content) {
        const message = {
            id: (0, crypto_1.randomUUID)(),
            session_id: sessionId,
            role: chat_dto_1.ChatRole.USER,
            content,
            intent: null,
            action_json: null,
            tool_calls_json: null,
            created_at: new Date(),
        };
        this.appendMessage(sessionId, message);
        return message;
    }
    /**
     * 保存助手消息（含意图与执行结果）
     */
    async saveAssistantMessage(sessionId, content, intent, execution) {
        const message = {
            id: (0, crypto_1.randomUUID)(),
            session_id: sessionId,
            role: chat_dto_1.ChatRole.ASSISTANT,
            content,
            intent: intent ? intent.action : null,
            action_json: execution
                ? {
                    action: execution.action,
                    success: execution.success,
                    summary: execution.summary,
                    data: execution.data,
                }
                : null,
            tool_calls_json: intent
                ? {
                    intent: intent.action,
                    confidence: intent.confidence,
                    params: intent.params,
                    matched_keywords: intent.matched_keywords,
                    source: intent.source,
                }
                : null,
            created_at: new Date(),
        };
        this.appendMessage(sessionId, message);
        return message;
    }
    /**
     * 获取会话消息列表
     */
    async getMessages(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new common_1.NotFoundException('会话不存在');
        }
        return this.messages.get(sessionId) || [];
    }
    // ==================== 上下文管理 ====================
    /**
     * 构建多轮对话上下文（最近10轮 + 摘要）
     * 返回格式化为 AI 可理解的对话历史字符串
     */
    async buildContext(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return { history: '', summary: '', round: 0 };
        }
        const allMessages = this.messages.get(sessionId) || [];
        // 取最近 2*MAX_CONTEXT_ROUNDS 条消息（每轮=用户+助手）
        const recent = allMessages.slice(-MAX_CONTEXT_ROUNDS * 2);
        const historyLines = [];
        for (const msg of recent) {
            const roleLabel = msg.role === chat_dto_1.ChatRole.USER ? '用户' : msg.role === chat_dto_1.ChatRole.ASSISTANT ? '助手' : msg.role;
            historyLines.push(`[${roleLabel}]: ${msg.content}`);
        }
        const summary = session.context_json.summary || '';
        const round = (session.context_json.round || 0) + 1;
        // 更新会话轮次
        session.context_json.round = round;
        session.updated_at = new Date();
        this.sessions.set(sessionId, session);
        return {
            history: historyLines.join('\n'),
            summary,
            round,
        };
    }
    /**
     * 更新会话摘要（每5轮更新一次）
     */
    async updateSummary(sessionId, summary) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return;
        session.context_json.summary = summary;
        session.updated_at = new Date();
        this.sessions.set(sessionId, session);
    }
    /**
     * 自动生成会话标题（基于首条用户消息）
     */
    async autoTitleFromFirstMessage(sessionId, content) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return;
        // 如果标题还是默认的"新对话"，则用消息前20字生成标题
        if (session.title.startsWith('新对话')) {
            const trimmed = content.replace(/\s+/g, ' ').trim();
            session.title = trimmed.length > 20 ? trimmed.slice(0, 20) + '…' : trimmed;
            session.updated_at = new Date();
            this.sessions.set(sessionId, session);
        }
    }
    // ==================== 内部方法 ====================
    appendMessage(sessionId, message) {
        const list = this.messages.get(sessionId) || [];
        list.push(message);
        this.messages.set(sessionId, list);
        const session = this.sessions.get(sessionId);
        if (session) {
            session.updated_at = message.created_at;
            this.sessions.set(sessionId, session);
        }
    }
    generateDefaultTitle() {
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        return `新对话 ${hh}:${mm}`;
    }
    /**
     * 预置3个演示会话（对应初始数据要求）
     */
    seedDemoSessions() {
        const now = Date.now();
        const demos = [
            {
                title: '商机查询与跟进',
                messages: [
                    { role: chat_dto_1.ChatRole.USER, content: '今天有什么新商机？' },
                    { role: chat_dto_1.ChatRole.ASSISTANT, content: '今天共发现 3 条新商机，其中 2 条匹配度超过 80 分。', intent: chat_dto_1.WorkflowActionName.QUERY_OPPORTUNITIES },
                    { role: chat_dto_1.ChatRole.USER, content: '帮我跟进王总' },
                    { role: chat_dto_1.ChatRole.ASSISTANT, content: '已为客户「王总」生成跟进建议，建议重点沟通报价细节。', intent: chat_dto_1.WorkflowActionName.TRIGGER_COMMUNICATION },
                ],
            },
            {
                title: '财务与经营报表',
                messages: [
                    { role: chat_dto_1.ChatRole.USER, content: '本月收入多少？' },
                    { role: chat_dto_1.ChatRole.ASSISTANT, content: '本月收入 ¥86,400，支出 ¥32,100，利润 ¥54,300，利润率 62.8%。', intent: chat_dto_1.WorkflowActionName.QUERY_FINANCE },
                    { role: chat_dto_1.ChatRole.USER, content: '给我一份本周经营报告' },
                    { role: chat_dto_1.ChatRole.ASSISTANT, content: '本周经营报告已生成：新增商机 24 条，成交 3 单，收入 ¥42,800。', intent: chat_dto_1.WorkflowActionName.GENERATE_REPORT },
                ],
            },
            {
                title: '项目进度与质量',
                messages: [
                    { role: chat_dto_1.ChatRole.USER, content: '进行中的项目有哪些？' },
                    { role: chat_dto_1.ChatRole.ASSISTANT, content: '当前有 2 个项目进行中：「电商平台重构」进度 65%，「小程序开发」进度 40%。', intent: chat_dto_1.WorkflowActionName.QUERY_PROJECTS },
                    { role: chat_dto_1.ChatRole.USER, content: '最近的代码质量怎么样？' },
                    { role: chat_dto_1.ChatRole.ASSISTANT, content: '最近代码质量综合评分 87 分，测试通过率 92%，存在 3 个警告级问题。', intent: chat_dto_1.WorkflowActionName.QUERY_QUALITY },
                    { role: chat_dto_1.ChatRole.USER, content: '有什么异常告警？' },
                    { role: chat_dto_1.ChatRole.ASSISTANT, content: '当前有 2 条待处理告警：1 条严重（预算熔断），1 条警告（模型降级）。', intent: chat_dto_1.WorkflowActionName.QUERY_ALERTS },
                ],
            },
        ];
        demos.forEach((demo, idx) => {
            const sessionId = `demo-session-${idx + 1}`;
            const createdAt = new Date(now - (idx + 1) * 3600000);
            const session = {
                id: sessionId,
                user_id: DEFAULT_USER_ID,
                title: demo.title,
                status: chat_dto_1.ChatSessionStatus.ACTIVE,
                context_json: { summary: demo.title, round: demo.messages.length / 2 },
                created_at: createdAt,
                updated_at: new Date(createdAt.getTime() + demo.messages.length * 60000),
            };
            this.sessions.set(sessionId, session);
            const msgs = demo.messages.map((m, mi) => ({
                id: `demo-msg-${idx + 1}-${mi + 1}`,
                session_id: sessionId,
                role: m.role,
                content: m.content,
                intent: m.intent || null,
                action_json: m.intent ? { action: m.intent, success: true } : null,
                tool_calls_json: null,
                created_at: new Date(createdAt.getTime() + (mi + 1) * 60000),
            }));
            this.messages.set(sessionId, msgs);
        });
        this.logger.log('已预置 3 个演示会话');
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], ChatService);
//# sourceMappingURL=chat.service.js.map