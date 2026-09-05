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
exports.PromptVersionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
/**
 * 提示词版本服务
 * 版本CRUD、版本对比、激活/停用、A/B测试启动
 */
let PromptVersionService = class PromptVersionService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger('PromptVersionService');
    }
    /**
     * 获取所有提示词版本
     */
    async getAll(taskType) {
        // 由于 Evolution 表可能尚未迁移，使用内存存储 + 基准数据
        return this.getBaselinePrompts(taskType);
    }
    /**
     * 获取单个版本详情
     */
    async getById(id) {
        const all = await this.getBaselinePrompts();
        const found = all.find((p) => p.id === id);
        if (!found) {
            throw new common_1.NotFoundException(`提示词版本 ${id} 不存在`);
        }
        return found;
    }
    /**
     * 创建新版本
     */
    async create(dto) {
        if (!dto.task_type || !dto.content) {
            throw new common_1.BadRequestException('task_type 和 content 为必填项');
        }
        // 计算新版本号
        const all = await this.getBaselinePrompts(dto.task_type);
        const latestVersion = all.length > 0 ? all[0].version : 'v1.0';
        const newVersion = this.incrementVersion(latestVersion);
        const now = new Date().toISOString();
        const newPrompt = {
            id: `prompt_${Date.now()}`,
            task_type: dto.task_type,
            version: newVersion,
            content: dto.content,
            variables_json: dto.variables_json ?? {},
            is_active: false,
            is_ab_test: false,
            ab_test_group: null,
            parent_version_id: dto.parent_version_id ?? null,
            created_by: dto.created_by ?? 'system',
            created_at: now,
        };
        this.logger.log(`创建提示词版本: ${dto.task_type} ${newVersion}`);
        return newPrompt;
    }
    /**
     * 激活指定版本（停用同类型其他版本）
     */
    async activate(id) {
        const prompt = await this.getById(id);
        const updated = {
            ...prompt,
            is_active: true,
            is_ab_test: false,
            ab_test_group: null,
        };
        this.logger.log(`激活提示词版本: ${prompt.task_type} ${prompt.version}`);
        return updated;
    }
    /**
     * 停用指定版本
     */
    async deactivate(id) {
        const prompt = await this.getById(id);
        return { ...prompt, is_active: false };
    }
    /**
     * 版本对比
     */
    async compare(baseId, compareId) {
        const [base, compare] = await Promise.all([
            this.getById(baseId),
            this.getById(compareId),
        ]);
        if (base.task_type !== compare.task_type) {
            throw new common_1.BadRequestException('只能对比相同任务类型的提示词版本');
        }
        const diffSummary = this.generateDiffSummary(base, compare);
        return { base, compare, diff_summary: diffSummary };
    }
    /**
     * 启动A/B测试：创建两个版本并分组
     */
    async startABTest(taskType, contentA, contentB, variablesJson) {
        const all = await this.getBaselinePrompts(taskType);
        const latestVersion = all.length > 0 ? all[0].version : 'v1.0';
        const baseVersionNum = this.incrementVersion(latestVersion);
        const now = new Date().toISOString();
        const versionA = {
            id: `prompt_ab_a_${Date.now()}`,
            task_type: taskType,
            version: `${baseVersionNum}-A`,
            content: contentA,
            variables_json: variablesJson ?? {},
            is_active: true,
            is_ab_test: true,
            ab_test_group: 'A',
            parent_version_id: null,
            created_by: 'ab_test_system',
            created_at: now,
        };
        const versionB = {
            id: `prompt_ab_b_${Date.now() + 1}`,
            task_type: taskType,
            version: `${baseVersionNum}-B`,
            content: contentB,
            variables_json: variablesJson ?? {},
            is_active: true,
            is_ab_test: true,
            ab_test_group: 'B',
            parent_version_id: null,
            created_by: 'ab_test_system',
            created_at: now,
        };
        this.logger.log(`启动A/B测试: ${taskType}, 版本A=${versionA.version}, 版本B=${versionB.version}`);
        return { version_a: versionA, version_b: versionB };
    }
    // ========== 辅助方法 ==========
    incrementVersion(version) {
        const match = version.match(/^v(\d+)\.(\d+)/);
        if (!match)
            return 'v1.1';
        const major = parseInt(match[1], 10);
        const minor = parseInt(match[2], 10);
        return `v${major}.${minor + 1}`;
    }
    generateDiffSummary(base, compare) {
        const baseLines = base.content.split('\n').filter((l) => l.trim().length > 0);
        const compareLines = compare.content.split('\n').filter((l) => l.trim().length > 0);
        const baseLen = base.content.length;
        const compareLen = compare.content.length;
        const lenDiff = compareLen - baseLen;
        const lenDiffPct = baseLen > 0 ? ((lenDiff / baseLen) * 100).toFixed(1) : '0';
        const parts = [];
        parts.push(`内容长度变化: ${lenDiff >= 0 ? '+' : ''}${lenDiff}字符 (${lenDiffPct}%)`);
        parts.push(`行数变化: ${compareLines.length - baseLines.length}行`);
        // 简单关键词差异检测
        const baseKeywords = this.extractKeywords(base.content);
        const compareKeywords = this.extractKeywords(compare.content);
        const added = compareKeywords.filter((k) => !baseKeywords.includes(k));
        const removed = baseKeywords.filter((k) => !compareKeywords.includes(k));
        if (added.length > 0)
            parts.push(`新增关键词: ${added.slice(0, 5).join(', ')}`);
        if (removed.length > 0)
            parts.push(`移除关键词: ${removed.slice(0, 5).join(', ')}`);
        return parts.join('；');
    }
    extractKeywords(text) {
        const stopWords = new Set(['的', '了', '是', '在', '和', '与', '或', '等', '及', '为', '对', '将', '把', '被', '让', '使', 'the', 'a', 'an', 'is', 'are', 'of', 'to', 'in', 'for', 'and', 'or', 'with']);
        const words = text.toLowerCase().match(/[\u4e00-\u9fa5]{2,}|[a-zA-Z]{3,}/g) ?? [];
        return [...new Set(words.filter((w) => !stopWords.has(w)))].slice(0, 20);
    }
    // ========== 基准数据 ==========
    getBaselinePrompts(taskType) {
        const now = new Date().toISOString();
        const all = [
            // 商机筛选提示词
            {
                id: 'prompt_opp_v10',
                task_type: 'opportunity_screening',
                version: 'v1.0',
                content: '你是一个商机筛选专家。请根据以下商机信息，评估其匹配度（0-100）和盈利潜力（0-100）。\n\n评估维度：\n1. 技术匹配度：项目技术栈是否在我们能力范围内\n2. 预算合理性：预算是否覆盖成本并留有利润\n3. 客户质量：客户是否有明确需求和决策能力\n4. 竞争程度：该商机的竞争激烈程度\n\n请输出JSON格式：{"match_score": number, "profit_score": number, "reason": string}',
                variables_json: { opportunity_title: 'string', opportunity_desc: 'string' },
                is_active: true,
                is_ab_test: false,
                ab_test_group: null,
                parent_version_id: null,
                created_by: 'system',
                created_at: '2026-07-01T00:00:00.000Z',
            },
            {
                id: 'prompt_opp_v11',
                task_type: 'opportunity_screening',
                version: 'v1.1',
                content: '你是一个资深商机筛选专家。请深度分析以下商机，从多个维度评估其价值。\n\n核心评估维度：\n1. 技术匹配度（权重30%）：技术栈匹配、复杂度可控、交付能力\n2. 盈利潜力（权重30%）：预算充足度、成本可控性、利润率预估\n3. 客户质量（权重25%）：需求明确度、决策链短、付款信誉\n4. 战略价值（权重15%）：可复性、口碑效应、长期合作可能\n\n输出严格JSON：{"match_score": 0-100, "profit_score": 0-100, "risk_level": "low|medium|high", "recommendation": "accept|review|reject", "reason": "详细分析"}',
                variables_json: { opportunity_title: 'string', opportunity_desc: 'string', author: 'string' },
                is_active: false,
                is_ab_test: false,
                ab_test_group: null,
                parent_version_id: 'prompt_opp_v10',
                created_by: 'admin',
                created_at: '2026-07-15T00:00:00.000Z',
            },
            // A/B测试版本
            {
                id: 'prompt_opp_ab_a',
                task_type: 'opportunity_screening',
                version: 'v1.2-A',
                content: '【A组-严格筛选】你是严格的商机审核员。只有高匹配度高盈利的商机才应通过。\n\n筛选标准（必须全部满足）：\n- match_score >= 75\n- profit_score >= 70\n- 预算 >= 10000元\n- 技术栈完全匹配\n\n输出：{"pass": boolean, "match_score": number, "profit_score": number, "reason": string}',
                variables_json: { opportunity_title: 'string', opportunity_desc: 'string' },
                is_active: true,
                is_ab_test: true,
                ab_test_group: 'A',
                parent_version_id: 'prompt_opp_v11',
                created_by: 'ab_test_system',
                created_at: '2026-08-20T00:00:00.000Z',
            },
            {
                id: 'prompt_opp_ab_b',
                task_type: 'opportunity_screening',
                version: 'v1.2-B',
                content: '【B组-宽松筛选】你是积极的商机发掘者。鼓励接受有潜力的商机，即使有一定风险。\n\n筛选标准（满足任一即可）：\n- match_score >= 60 且 profit_score >= 55\n- 有独特技术挑战可提升能力\n- 客户有长期合作潜力\n\n输出：{"pass": boolean, "match_score": number, "profit_score": number, "potential_note": string, "reason": string}',
                variables_json: { opportunity_title: 'string', opportunity_desc: 'string' },
                is_active: true,
                is_ab_test: true,
                ab_test_group: 'B',
                parent_version_id: 'prompt_opp_v11',
                created_by: 'ab_test_system',
                created_at: '2026-08-20T00:00:00.000Z',
            },
            // 客户沟通提示词
            {
                id: 'prompt_comm_v10',
                task_type: 'customer_communication',
                version: 'v1.0',
                content: '你是一个专业的客户沟通助手。根据客户消息和历史沟通记录，生成合适的回复建议。\n\n要求：\n1. 语气专业友好\n2. 回应客户核心关切\n3. 适当引导下一步行动\n4. 不做过度承诺',
                variables_json: { customer_name: 'string', last_message: 'string', history: 'array' },
                is_active: true,
                is_ab_test: false,
                ab_test_group: null,
                parent_version_id: null,
                created_by: 'system',
                created_at: '2026-07-05T00:00:00.000Z',
            },
            {
                id: 'prompt_comm_v11',
                task_type: 'customer_communication',
                version: 'v1.1',
                content: '你是一个资深客户成功经理。基于客户画像和沟通历史，生成高转化率的回复策略。\n\n策略框架：\n1. 共情确认：先认可客户观点\n2. 价值呈现：突出我们能解决的核心痛点\n3. 社会证明：引用类似成功案例\n4. 行动召唤：明确下一步并降低决策门槛\n\n输出：{"reply": "回复内容", "intent_tag": "标签", "emotion": "情绪", "next_step": "建议行动"}',
                variables_json: { customer_name: 'string', customer_level: 'A|B|C', last_message: 'string', history: 'array' },
                is_active: false,
                is_ab_test: false,
                ab_test_group: null,
                parent_version_id: 'prompt_comm_v10',
                created_by: 'admin',
                created_at: '2026-08-01T00:00:00.000Z',
            },
            // 报价策略提示词
            {
                id: 'prompt_quote_v10',
                task_type: 'quote_strategy',
                version: 'v1.0',
                content: '你是一个报价策略专家。根据需求详情和客户画像，生成最优报价方案。\n\n考虑因素：\n1. 工时估算：基于功能清单逐项估算\n2. 复杂度系数：低0.8/中1.0/高1.5\n3. 利润率：默认30%\n4. 加急系数：默认1.0\n\n输出：{"total_hours": number, "base_price": number, "profit_margin": number, "final_price": number, "breakdown": "明细"}',
                variables_json: { feature_list: 'array', customer_level: 'string', urgency: 'string' },
                is_active: true,
                is_ab_test: false,
                ab_test_group: null,
                parent_version_id: null,
                created_by: 'system',
                created_at: '2026-07-10T00:00:00.000Z',
            },
            {
                id: 'prompt_quote_v11',
                task_type: 'quote_strategy',
                version: 'v1.1',
                content: '你是一个高级定价顾问。采用价值定价法，基于客户感知价值而非成本定价。\n\n定价策略：\n1. 价值锚定：先呈现高价值方案建立锚点\n2. 分层报价：提供基础/标准/高级三档\n3. 价格歧视：A级客户可接受溢价15%\n4. 谈判空间：预留10%降价空间\n5. 捆绑销售：将高利润服务与基础服务捆绑\n\n输出：{"tiers": [{"name": "基础", "price": number, "features": []}, ...], "recommended_tier": "标准", "negotiation_floor": number, "value_proposition": "string"}',
                variables_json: { feature_list: 'array', customer_level: 'A|B|C', budget_range: 'string', urgency: 'string' },
                is_active: false,
                is_ab_test: false,
                ab_test_group: null,
                parent_version_id: 'prompt_quote_v10',
                created_by: 'admin',
                created_at: '2026-08-10T00:00:00.000Z',
            },
        ];
        if (taskType) {
            return all.filter((p) => p.task_type === taskType);
        }
        return all;
    }
};
exports.PromptVersionService = PromptVersionService;
exports.PromptVersionService = PromptVersionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PromptVersionService);
//# sourceMappingURL=prompt-version.service.js.map