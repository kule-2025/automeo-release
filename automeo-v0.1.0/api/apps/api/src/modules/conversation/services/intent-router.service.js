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
exports.IntentRouterService = void 0;
const common_1 = require("@nestjs/common");
const ai_gateway_service_1 = require("../../ai-gateway/services/ai-gateway.service");
const chat_dto_1 = require("../dto/chat.dto");
/**
 * 意图识别与工作流映射核心服务
 *
 * 双层识别策略：
 * 1. 关键词匹配层（确定性、零延迟、始终可用）
 * 2. AI 意图识别层（调用 AIGatewayService.analyzeIntent，失败时关键词兜底）
 *
 * 匹配流程：
 * - 对用户消息进行关键词评分，取最高分动作
 * - 若最高分 >= 阈值(2分)，直接使用关键词匹配结果
 * - 若最高分 < 阈值，尝试 AI 识别；AI 失败则回退到最高分动作或 system_help
 */
let IntentRouterService = class IntentRouterService {
    constructor(aiGateway) {
        this.aiGateway = aiGateway;
        this.logger = new common_1.Logger('IntentRouter');
        /** 关键词匹配阈值：达到此分数直接采用关键词结果 */
        this.KEYWORD_THRESHOLD = 2;
        /**
         * 工作流动作注册表（10种动作）
         */
        this.actionRegistry = [
            {
                name: chat_dto_1.WorkflowActionName.QUERY_OPPORTUNITIES,
                description: '查询商机列表，支持按日期、状态、匹配度筛选',
                keyword_groups: [
                    ['商机', '机会', '单子', '项目机会'],
                    ['新商机', '新机会', '最新商机'],
                    ['高匹配', '匹配度', '高分商机'],
                    ['今天', '今日', '本周', '最近'],
                ],
                high_weight_keywords: ['商机', '新商机', '匹配度'],
                parameter_extractors: [
                    {
                        param_name: 'date',
                        patterns: [/今天|今日/, /本周|这周/, /昨天|昨日/, /最近|近几天/],
                        default_value: 'today',
                        transform: 'to_lower',
                    },
                    {
                        param_name: 'status',
                        patterns: [/新商机|新的|未处理/, /跟进中|跟进/, /已转化|成交|转化/, /已认领|认领/],
                        default_value: 'new',
                        transform: 'to_lower',
                    },
                    {
                        param_name: 'min_match_score',
                        patterns: [/匹配度[超高于]?\s*(\d+)/, /(\d+)\s*分以上/],
                        default_value: 0,
                        transform: 'to_number',
                    },
                ],
                endpoint: '/opportunities',
                method: 'GET',
            },
            {
                name: chat_dto_1.WorkflowActionName.QUERY_CUSTOMERS,
                description: '查询客户列表，支持按等级、状态、关键词筛选',
                keyword_groups: [
                    ['客户', '顾客', '甲方', '客户列表'],
                    ['A类', 'A级', '重点客户', '优质客户'],
                    ['B类', 'B级', 'C类', 'C级'],
                    ['最近沟通', '刚联系', '联系过'],
                    ['我的客户'],
                ],
                high_weight_keywords: ['客户', 'A类客户', '我的客户'],
                parameter_extractors: [
                    {
                        param_name: 'level',
                        patterns: [/A类|A级/, /B类|B级/, /C类|C级/],
                        default_value: 'all',
                        transform: 'to_lower',
                    },
                    {
                        param_name: 'status',
                        patterns: [/新客户|新的/, /已沟通|沟通中/, /意向明确|意向/, /已成交|成交/, /已流失|流失/],
                        default_value: 'all',
                        transform: 'to_lower',
                    },
                    {
                        param_name: 'keyword',
                        patterns: [/叫(.+?)(?:的|客户|$)/, /名字是(.+?)(?:的|$)/],
                        default_value: '',
                        transform: 'trim',
                    },
                ],
                endpoint: '/customers',
                method: 'GET',
            },
            {
                name: chat_dto_1.WorkflowActionName.TRIGGER_COMMUNICATION,
                description: '触发客户沟通，生成跟进建议或发送消息',
                keyword_groups: [
                    ['跟进', '联系', '沟通', '触达'],
                    ['帮我跟', '帮我联系', '给我发', '发个消息'],
                    ['回访', '回个话', '回复'],
                    ['打招呼', '问候'],
                ],
                high_weight_keywords: ['跟进', '帮我跟', '发个消息', '回访'],
                parameter_extractors: [
                    {
                        param_name: 'customer_name',
                        patterns: [/跟进(.+?)(?:的|$)/, /联系(.+?)(?:的|$)/, /给(.+?)(?:发|$)/, /(.+总)/],
                        default_value: '',
                        transform: 'trim',
                    },
                    {
                        param_name: 'message_type',
                        patterns: [/报价|价格/, /进度|进展/, /问候|打招呼/, /催款|收款/],
                        default_value: 'follow_up',
                        transform: 'to_lower',
                    },
                ],
                endpoint: '/customers/:id/reply',
                method: 'POST',
            },
            {
                name: chat_dto_1.WorkflowActionName.QUERY_PROJECTS,
                description: '查询项目列表与进度',
                keyword_groups: [
                    ['项目', '工程项目', '开发项目'],
                    ['进行中', '在做', '开发中', '执行中'],
                    ['进度', '完成度', '多少了'],
                    ['项目列表', '所有项目'],
                    ['待交付', '即将完成'],
                ],
                high_weight_keywords: ['项目', '进行中项目', '项目进度'],
                parameter_extractors: [
                    {
                        param_name: 'status',
                        patterns: [/进行中|开发中|在做/, /待交付|即将交付/, /已完成|完成了|已交付/, /待开始|未开始/],
                        default_value: 'in_development',
                        transform: 'to_lower',
                    },
                    {
                        param_name: 'keyword',
                        patterns: [/项目[叫名称是]+(.+?)(?:的|$)/],
                        default_value: '',
                        transform: 'trim',
                    },
                ],
                endpoint: '/projects',
                method: 'GET',
            },
            {
                name: chat_dto_1.WorkflowActionName.QUERY_FINANCE,
                description: '查询财务数据：收入、支出、余额、待收款',
                keyword_groups: [
                    ['收入', '营收', '营业额', '赚了多少'],
                    ['支出', '花费', '成本多少'],
                    ['余额', '账户余额', '还有多少钱'],
                    ['待收款', '应收款', '未收款', '回款'],
                    ['利润', '盈利', '净收入'],
                    ['财务', '账单', '账目'],
                    ['本月', '这个月', '当月'],
                ],
                high_weight_keywords: ['收入', '余额', '待收款', '利润', '财务'],
                parameter_extractors: [
                    {
                        param_name: 'period',
                        patterns: [/本月|这个月|当月/, /本周|这周/, /今天|今日/, /今年|本年/, /上月|上个月/],
                        default_value: 'month',
                        transform: 'to_lower',
                    },
                    {
                        param_name: 'metric',
                        patterns: [/收入|营收|营业额/, /支出|花费|成本/, /余额/, /待收款|应收|回款/, /利润|盈利/],
                        default_value: 'overview',
                        transform: 'to_lower',
                    },
                ],
                endpoint: '/finance/overview',
                method: 'GET',
            },
            {
                name: chat_dto_1.WorkflowActionName.GENERATE_QUOTE,
                description: '根据需求生成报价',
                keyword_groups: [
                    ['报价', '算一下价格', '多少钱', '估价'],
                    ['生成报价', '做个报价', '报价单'],
                    ['预算', '费用估算', '成本估算'],
                    ['这个需求', '这个项目', '这个功能'],
                ],
                high_weight_keywords: ['报价', '算一下', '多少钱', '生成报价'],
                parameter_extractors: [
                    {
                        param_name: 'requirement_desc',
                        patterns: [/报价[：:]?\s*(.+)/, /算一下\s*(.+?)(?:的|$)/, /(.+?)\s*多少钱/],
                        default_value: '',
                        transform: 'trim',
                    },
                    {
                        param_name: 'complexity',
                        patterns: [/简单|低复杂度/, /中等|一般/, /复杂|高复杂度/],
                        default_value: 'medium',
                        transform: 'to_lower',
                    },
                ],
                endpoint: '/quote-rules/preview',
                method: 'POST',
            },
            {
                name: chat_dto_1.WorkflowActionName.QUERY_QUALITY,
                description: '查看代码质量报告与评分',
                keyword_groups: [
                    ['代码质量', '质量报告', '质量评分'],
                    ['代码怎么样', '代码好不好', '代码评分'],
                    ['测试通过率', '单元测试', '测试结果'],
                    ['代码审查', 'code review', 'review结果'],
                    ['最近的质量', '质量情况'],
                ],
                high_weight_keywords: ['代码质量', '质量报告', '测试通过率', '代码审查'],
                parameter_extractors: [
                    {
                        param_name: 'project_id',
                        patterns: [/项目\s*([a-zA-Z0-9-]+)/, /project[_\s]?id\s*[=:]\s*([a-zA-Z0-9-]+)/i],
                        default_value: '',
                        transform: 'trim',
                    },
                    {
                        param_name: 'time_range',
                        patterns: [/最近|近期/, /本周|这周/, /本月|这个月/],
                        default_value: 'recent',
                        transform: 'to_lower',
                    },
                ],
                endpoint: '/projects/:id/quality',
                method: 'GET',
            },
            {
                name: chat_dto_1.WorkflowActionName.QUERY_ALERTS,
                description: '查看系统告警与异常事件',
                keyword_groups: [
                    ['告警', '警报', '异常', '报错'],
                    ['有什么异常', '系统告警', '告警事件'],
                    ['错误', '故障', '宕机'],
                    ['预警', '警告', 'warning'],
                    ['系统状态', '运行状态'],
                ],
                high_weight_keywords: ['告警', '异常', '系统告警', '报错'],
                parameter_extractors: [
                    {
                        param_name: 'level',
                        patterns: [/严重|critical|致命/, /警告|warning|warn/, /信息|info|提示/],
                        default_value: 'all',
                        transform: 'to_lower',
                    },
                    {
                        param_name: 'status',
                        patterns: [/待处理|未处理|pending/, /处理中|processing/, /已解决|resolved|已处理/],
                        default_value: 'pending',
                        transform: 'to_lower',
                    },
                    {
                        param_name: 'module',
                        patterns: [/商机|opportunity/, /客户|customer/, /项目|project/, /财务|finance/, /成本|cost/, /AI|ai_gateway|网关/, /系统|system/],
                        default_value: 'all',
                        transform: 'to_lower',
                    },
                ],
                endpoint: '/monitor/alerts',
                method: 'GET',
            },
            {
                name: chat_dto_1.WorkflowActionName.GENERATE_REPORT,
                description: '生成经营报表（周报/月报/日报）',
                keyword_groups: [
                    ['经营报告', '经营报表', '运营报告'],
                    ['周报', '本周报告', '周总结', '周报表'],
                    ['月报', '月度报告', '月度总结', '月报表'],
                    ['日报', '今日报告', '日总结'],
                    ['总结', '汇总', '数据报告'],
                    ['给我一份', '生成一份'],
                ],
                high_weight_keywords: ['经营报告', '周报', '月报', '日报', '经营报表'],
                parameter_extractors: [
                    {
                        param_name: 'period',
                        patterns: [/本周|这周|周报/, /本月|这个月|月报|月度/, /今天|今日|日报|日/, /上周|上一周/, /上月|上个月/],
                        default_value: 'week',
                        transform: 'to_lower',
                    },
                    {
                        param_name: 'include_sections',
                        patterns: [/商机|机会/, /客户/, /项目/, /财务|收入/, /成本/, /告警|异常/],
                        default_value: 'all',
                        transform: 'to_lower',
                    },
                ],
                endpoint: '/analytics/dashboard',
                method: 'GET',
            },
            {
                name: chat_dto_1.WorkflowActionName.SYSTEM_HELP,
                description: '系统帮助：列出可用功能与操作指引',
                keyword_groups: [
                    ['帮助', 'help', '怎么用', '使用说明'],
                    ['你能做什么', '你会什么', '功能列表', '有什么功能'],
                    ['指令', '命令', '操作指南'],
                    ['介绍', '说明', '文档'],
                ],
                high_weight_keywords: ['帮助', '你能做什么', '功能列表', '使用说明'],
                parameter_extractors: [
                    {
                        param_name: 'topic',
                        patterns: [/商机/, /客户/, /项目/, /财务/, /报价/, /质量/, /告警/, /报告/],
                        default_value: 'all',
                        transform: 'to_lower',
                    },
                ],
                endpoint: '/chat/help',
                method: 'GET',
            },
        ];
    }
    /**
     * 核心方法：识别用户消息意图并映射到工作流动作
     */
    async route(message, history) {
        const normalized = this.normalizeMessage(message);
        // 第一层：关键词匹配（始终执行，作为兜底）
        const keywordResult = this.matchByKeywords(normalized);
        this.logger.debug(`关键词匹配: action=${keywordResult.action} score=${keywordResult.confidence} ` +
            `keywords=[${keywordResult.matched_keywords.join(',')}]`);
        // 如果关键词匹配分数达到阈值，直接使用（确定性优先，零延迟）
        if (keywordResult.confidence >= this.KEYWORD_THRESHOLD) {
            return {
                ...keywordResult,
                source: 'keyword',
            };
        }
        // 第二层：AI 意图识别（低置信度时尝试）
        try {
            const aiResult = await this.recognizeByAI(normalized, history);
            if (aiResult) {
                this.logger.log(`AI意图识别: action=${aiResult.action} confidence=${aiResult.confidence}`);
                return aiResult;
            }
        }
        catch (err) {
            this.logger.warn(`AI意图识别失败，回退关键词匹配: ${err.message}`);
        }
        // 兜底：使用关键词最高分结果（即使低于阈值），若仍无匹配则 system_help
        if (keywordResult.confidence > 0) {
            return {
                ...keywordResult,
                confidence: Math.max(keywordResult.confidence, 0.5),
                source: 'fallback',
            };
        }
        return {
            action: chat_dto_1.WorkflowActionName.SYSTEM_HELP,
            confidence: 0.3,
            params: {},
            matched_keywords: [],
            source: 'fallback',
        };
    }
    /**
     * 获取所有已注册动作（用于帮助信息）
     */
    getActionDefinitions() {
        return this.actionRegistry.map((a) => ({
            name: a.name,
            description: a.description,
            endpoint: a.endpoint,
            method: a.method,
        }));
    }
    // ==================== 关键词匹配 ====================
    /**
     * 基于关键词组的评分匹配
     * 评分规则：
     * - 每个关键词组命中任一关键词 → +1分
     * - 高权重关键词命中 → +2分（不与普通组重复计分）
     * - 最终分数 = 组命中数 + 高权重额外加分
     */
    matchByKeywords(message) {
        let bestAction = chat_dto_1.WorkflowActionName.SYSTEM_HELP;
        let bestScore = 0;
        let bestKeywords = [];
        let bestParams = {};
        for (const action of this.actionRegistry) {
            let score = 0;
            const matched = [];
            // 普通关键词组匹配
            for (const group of action.keyword_groups) {
                for (const keyword of group) {
                    if (message.includes(keyword)) {
                        score += 1;
                        matched.push(keyword);
                        break; // 每组只计一次
                    }
                }
            }
            // 高权重关键词额外加分
            for (const keyword of action.high_weight_keywords) {
                if (message.includes(keyword) && !matched.includes(keyword)) {
                    score += 1; // 额外+1（基础已在组中计+1，高权重共+2）
                    matched.push(keyword);
                }
            }
            if (score > bestScore) {
                bestScore = score;
                bestAction = action.name;
                bestKeywords = matched;
                bestParams = this.extractParameters(action, message);
            }
        }
        return {
            action: bestAction,
            confidence: bestScore,
            params: bestParams,
            matched_keywords: bestKeywords,
            source: 'keyword',
        };
    }
    // ==================== AI 意图识别 ====================
    /**
     * 调用 AIGatewayService.analyzeIntent 进行 AI 意图识别
     * 返回结构化的意图结果，失败时返回 null
     */
    async recognizeByAI(message, history) {
        try {
            const actionNames = this.actionRegistry.map((a) => a.name).join(', ');
            const systemPrompt = `你是意图识别引擎。请从以下动作中选择最匹配的一个：\n${actionNames}\n\n` +
                `只返回JSON格式：{"action":"动作名","confidence":0.0-1.0,"params":{"参数名":"值"}}`;
            const result = await this.aiGateway.call({
                taskType: 'intent_analysis',
                input: `对话历史:\n${history || '无'}\n\n最新消息: ${message}`,
                systemPrompt,
            });
            const parsed = this.aiGateway.parseJSON(result.content);
            if (!parsed || !parsed.action) {
                return null;
            }
            // 验证 AI 返回的动作是否在注册表中
            const validAction = this.actionRegistry.find((a) => a.name === parsed.action);
            if (!validAction) {
                this.logger.warn(`AI返回未知动作: ${parsed.action}`);
                return null;
            }
            return {
                action: validAction.name,
                confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.7,
                params: parsed.params || {},
                matched_keywords: [],
                source: 'ai',
            };
        }
        catch (err) {
            this.logger.warn(`AI意图识别异常: ${err.message}`);
            return null;
        }
    }
    // ==================== 参数提取 ====================
    /**
     * 从消息中提取动作参数
     */
    extractParameters(action, message) {
        const params = {};
        for (const extractor of action.parameter_extractors) {
            let value = extractor.default_value;
            for (const pattern of extractor.patterns) {
                const match = message.match(pattern);
                if (match) {
                    // 如果有捕获组，使用第一个捕获组；否则使用匹配文本
                    value = match[1] !== undefined ? match[1] : match[0];
                    break;
                }
            }
            if (value !== undefined) {
                params[extractor.param_name] = this.transformValue(value, extractor.transform);
            }
        }
        return params;
    }
    /**
     * 值转换
     */
    transformValue(value, transform) {
        if (typeof value !== 'string')
            return value;
        switch (transform) {
            case 'to_lower':
                return value.toLowerCase();
            case 'to_number': {
                const num = parseInt(value, 10);
                return isNaN(num) ? 0 : num;
            }
            case 'trim':
                return value.trim();
            default:
                return value;
        }
    }
    // ==================== 工具方法 ====================
    /**
     * 消息归一化：去除多余空白、统一标点
     */
    normalizeMessage(message) {
        return message
            .replace(/\s+/g, ' ')
            .replace(/[，。！？、；：]/g, (m) => {
            const map = {
                '，': ',', '。': '.', '！': '!', '？': '?',
                '、': ',', '；': ';', '：': ':',
            };
            return map[m] || m;
        })
            .trim()
            .toLowerCase();
    }
};
exports.IntentRouterService = IntentRouterService;
exports.IntentRouterService = IntentRouterService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [ai_gateway_service_1.AIGatewayService])
], IntentRouterService);
//# sourceMappingURL=intent-router.service.js.map