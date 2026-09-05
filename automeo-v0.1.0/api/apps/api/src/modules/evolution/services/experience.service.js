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
exports.ExperienceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
/**
 * 经验库服务
 * CRUD、自动沉淀（项目成功/失败后自动创建）、标签检索
 */
let ExperienceService = class ExperienceService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger('ExperienceService');
    }
    /**
     * 获取经验列表（支持筛选）
     */
    async getAll(query) {
        let all = this.getBaselineExperiences();
        if (query?.category) {
            all = all.filter((e) => e.category === query.category);
        }
        if (query?.source) {
            all = all.filter((e) => e.source === query.source);
        }
        if (query?.tag) {
            all = all.filter((e) => e.tags_json.includes(query.tag));
        }
        if (query?.keyword) {
            const kw = query.keyword.toLowerCase();
            all = all.filter((e) => e.title.toLowerCase().includes(kw) ||
                e.content.toLowerCase().includes(kw));
        }
        return all;
    }
    /**
     * 获取单条经验详情
     */
    async getById(id) {
        const all = this.getBaselineExperiences();
        const found = all.find((e) => e.id === id);
        if (!found) {
            throw new common_1.BadRequestException(`经验 ${id} 不存在`);
        }
        return found;
    }
    /**
     * 创建经验
     */
    async create(dto) {
        if (!dto.title || !dto.content || !dto.category || !dto.source) {
            throw new common_1.BadRequestException('title、content、category、source 为必填项');
        }
        const experience = {
            id: `exp_${Date.now()}`,
            category: dto.category,
            title: dto.title,
            content: dto.content,
            tags_json: dto.tags_json ?? [],
            source: dto.source,
            related_project_id: dto.related_project_id ?? null,
            metrics_json: dto.metrics_json ?? {},
            created_at: new Date().toISOString(),
        };
        this.logger.log(`沉淀经验: [${dto.category}] ${dto.title}`);
        return experience;
    }
    /**
     * 自动沉淀：项目成功后创建成功案例
     */
    async autoCaptureSuccess(projectId, projectName, metrics) {
        const profitMargin = metrics.profit_margin ?? 0;
        const title = `项目成功案例：${projectName}（利润率${(profitMargin * 100).toFixed(1)}%）`;
        const content = this.generateSuccessContent(projectName, metrics);
        return this.create({
            category: 'success_case',
            title,
            content,
            tags_json: this.extractSuccessTags(metrics),
            source: 'project_delivery',
            related_project_id: projectId,
            metrics_json: metrics,
        });
    }
    /**
     * 自动沉淀：项目失败后创建失败教训
     */
    async autoCaptureFailure(projectId, projectName, reason, metrics) {
        const title = `失败教训：${projectName} - ${reason}`;
        const content = this.generateFailureContent(projectName, reason, metrics);
        return this.create({
            category: 'failure_lesson',
            title,
            content,
            tags_json: this.extractFailureTags(reason),
            source: 'project_delivery',
            related_project_id: projectId,
            metrics_json: metrics,
        });
    }
    /**
     * 根据指标查找相关成功经验
     */
    async findRelevantByMetric(metricName, limit = 3) {
        const all = this.getBaselineExperiences();
        const keywordMap = {
            '商机转化率': ['商机', '转化', '筛选', '匹配'],
            '客户成交率': ['客户', '成交', '沟通', '谈判'],
            '平均利润率': ['利润', '报价', '成本', '定价'],
            '代码质量分': ['代码', '质量', '测试', 'review'],
            '客户满意度': ['客户', '满意', '交付', '验收'],
            '交付准时率': ['交付', '准时', '进度', '排期'],
        };
        const keywords = keywordMap[metricName] ?? [metricName];
        const scored = all
            .filter((e) => e.category === 'success_case' || e.category === 'best_practice')
            .map((e) => {
            let score = 0;
            for (const kw of keywords) {
                if (e.title.includes(kw))
                    score += 3;
                if (e.content.includes(kw))
                    score += 1;
                if (e.tags_json.some((t) => t.includes(kw)))
                    score += 2;
            }
            return { experience: e, score };
        })
            .filter((s) => s.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
        return scored.map((s) => s.experience);
    }
    // ========== 辅助方法 ==========
    generateSuccessContent(projectName, metrics) {
        const parts = [];
        parts.push(`项目「${projectName}」交付成功，关键指标如下：`);
        if (metrics.profit_margin !== undefined) {
            parts.push(`- 利润率：${(metrics.profit_margin * 100).toFixed(1)}%`);
        }
        if (metrics.revenue !== undefined) {
            parts.push(`- 收入：¥${metrics.revenue.toLocaleString()}`);
        }
        if (metrics.delivery_days !== undefined) {
            parts.push(`- 交付周期：${metrics.delivery_days}天`);
        }
        if (metrics.quality_score !== undefined) {
            parts.push(`- 质量评分：${metrics.quality_score}/100`);
        }
        parts.push('\n成功关键因素：');
        parts.push('1. 需求阶段充分沟通，明确范围边界');
        parts.push('2. 采用模块化开发，核心功能优先交付');
        parts.push('3. 每日进度同步，及时处理风险');
        return parts.join('\n');
    }
    generateFailureContent(projectName, reason, metrics) {
        const parts = [];
        parts.push(`项目「${projectName}」失败，原因：${reason}`);
        parts.push('\n教训总结：');
        if (reason.includes('需求') || reason.includes('范围')) {
            parts.push('1. 需求边界未明确，导致范围蔓延');
            parts.push('2. 变更管理流程缺失，客户随意增加需求');
        }
        else if (reason.includes('技术') || reason.includes('能力')) {
            parts.push('1. 技术评估不足，超出团队能力范围');
            parts.push('2. 应在商机筛选阶段加强技术匹配度审核');
        }
        else if (reason.includes('成本') || reason.includes('利润')) {
            parts.push('1. 成本估算严重偏低，工时溢出50%以上');
            parts.push('2. 报价时未充分考虑隐性成本（调试、沟通、返工）');
        }
        else {
            parts.push('1. 项目管理存在漏洞，风险识别不及时');
            parts.push('2. 需建立更严格的项目准入和过程监控机制');
        }
        parts.push('\n改进措施：已将该教训纳入经验库，后续类似项目将触发预警。');
        return parts.join('\n');
    }
    extractSuccessTags(metrics) {
        const tags = ['成功案例'];
        if ((metrics.profit_margin ?? 0) > 0.5)
            tags.push('高利润');
        if ((metrics.quality_score ?? 0) > 85)
            tags.push('高质量');
        if ((metrics.delivery_days ?? 999) < 14)
            tags.push('快速交付');
        return tags;
    }
    extractFailureTags(reason) {
        const tags = ['失败教训'];
        if (reason.includes('需求'))
            tags.push('需求蔓延');
        if (reason.includes('技术'))
            tags.push('技术风险');
        if (reason.includes('成本'))
            tags.push('成本失控');
        if (reason.includes('客户'))
            tags.push('客户管理');
        return tags;
    }
    // ========== 基准数据 ==========
    getBaselineExperiences() {
        return [
            // 成功案例 8条
            {
                id: 'exp_001',
                category: 'success_case',
                title: 'AI客服系统项目：利润率65.7%的高利润交付',
                content: '项目背景：为电商客户开发AI客服系统，预算35000元。\n\n成功关键：\n1. 需求阶段通过3轮沟通明确了功能边界，避免了范围蔓延\n2. 复用了之前项目的对话引擎模块，节省40%开发时间\n3. 采用分阶段交付，先上线核心问答功能，客户满意后再扩展\n4. 实际成本仅12000元，利润率达65.7%\n\n可复用经验：对话引擎模块已沉淀为通用组件，后续类似项目可直接复用。',
                tags_json: ['成功案例', '高利润', '模块复用', '分阶段交付'],
                source: 'project_delivery',
                related_project_id: 'proj_001',
                metrics_json: { revenue: 35000, cost: 12000, profit_margin: 0.657, delivery_days: 18, quality_score: 88 },
                created_at: '2026-08-15T00:00:00.000Z',
            },
            {
                id: 'exp_002',
                category: 'success_case',
                title: '电商平台重构：从需求到交付仅用21天',
                content: '项目背景：客户需要将旧版电商平台重构为现代化技术栈，预算28000元。\n\n成功关键：\n1. 精准的需求拆解：将大系统拆为8个独立模块，并行开发\n2. 技术选型合理：使用成熟框架避免重复造轮子\n3. 每日站会同步进度，风险当天处理\n4. 客户参与度高，每周验收一个里程碑\n\n结果：提前3天交付，客户主动推荐了2个新客户。',
                tags_json: ['成功案例', '快速交付', '并行开发', '客户推荐'],
                source: 'project_delivery',
                related_project_id: 'proj_002',
                metrics_json: { revenue: 28000, cost: 9800, profit_margin: 0.65, delivery_days: 21, quality_score: 85 },
                created_at: '2026-07-28T00:00:00.000Z',
            },
            {
                id: 'exp_003',
                category: 'success_case',
                title: '小程序开发：A级客户的高转化率沟通策略',
                content: '项目背景：通过V2EX获取的商机，客户为连锁餐饮品牌，需要开发点餐小程序。\n\n沟通成功关键：\n1. 首次沟通即识别客户为A级（预算充足、决策链短）\n2. 主动提供了3个同行业案例，建立信任\n3. 采用价值定价法，报价27000元（成本约9000元）\n4. 48小时内提供原型Demo，加速决策\n\n从商机到成交仅用5天，转化率远高于平均水平。',
                tags_json: ['成功案例', 'A级客户', '价值定价', '快速成交'],
                source: 'customer_communication',
                related_project_id: 'proj_003',
                metrics_json: { revenue: 27000, cost: 8500, profit_margin: 0.685, days_to_deal: 5, quality_score: 90 },
                created_at: '2026-08-05T00:00:00.000Z',
            },
            {
                id: 'exp_004',
                category: 'success_case',
                title: '企业官网项目：低预算高利润的标准化交付',
                content: '项目背景：小型企业官网，预算仅8500元。\n\n成功关键：\n1. 使用官网模板+定制化修改，开发时间压缩到3天\n2. 标准化的内容收集清单，减少沟通成本\n3. 一次性交付3套设计方案供选择\n4. 成本仅2100元，利润率75.3%\n\n经验：小预算项目应走标准化流程，避免过度定制。',
                tags_json: ['成功案例', '标准化', '小项目', '高利润率'],
                source: 'project_delivery',
                related_project_id: 'proj_005',
                metrics_json: { revenue: 8500, cost: 2100, profit_margin: 0.753, delivery_days: 3, quality_score: 82 },
                created_at: '2026-07-10T00:00:00.000Z',
            },
            {
                id: 'exp_005',
                category: 'success_case',
                title: '商机筛选优化：将匹配阈值从75降至70后转化率提升',
                content: '背景：原商机筛选阈值为match_score>=75，导致大量有潜力商机被过滤。\n\n优化过程：\n1. 分析了30天内被过滤的商机，发现其中15%实际转化成功\n2. 将阈值从75降至70，同时增加profit_score>=60的辅助条件\n3. 运行2周后统计：商机池量增加35%，转化率从12%提升至14%\n\n结论：适度放宽筛选阈值+多维度评估优于单一严格阈值。',
                tags_json: ['成功案例', '商机筛选', '阈值优化', '数据驱动'],
                source: 'opportunity_conversion',
                related_project_id: null,
                metrics_json: { before_conversion: 0.12, after_conversion: 0.14, pool_increase: 0.35, threshold_before: 75, threshold_after: 70 },
                created_at: '2026-08-20T00:00:00.000Z',
            },
            {
                id: 'exp_006',
                category: 'success_case',
                title: '报价策略调整：分层报价法使客单价提升22%',
                content: '背景：原报价方式为单一报价，客户经常压价。\n\n优化方案：\n1. 改为三档分层报价：基础版/标准版/高级版\n2. 标准版定价为成本的2.5倍（原2.0倍）\n3. 高级版包含增值服务，利润率更高\n4. 锚定效应：先展示高级版价格，使标准版显得合理\n\n结果：60%客户选择标准版，20%选择高级版，客单价从15000提升至18300元。',
                tags_json: ['成功案例', '报价策略', '分层定价', '客单价提升'],
                source: 'quote_strategy',
                related_project_id: null,
                metrics_json: { before_avg_price: 15000, after_avg_price: 18300, increase_pct: 0.22, standard_pct: 0.6, premium_pct: 0.2 },
                created_at: '2026-08-25T00:00:00.000Z',
            },
            {
                id: 'exp_007',
                category: 'success_case',
                title: '客户沟通模板化：回复响应时间从2小时降至15分钟',
                content: '背景：客户消息回复依赖人工，响应时间长导致客户流失。\n\n优化方案：\n1. 建立10类常见场景的AI回复模板（询价、需求确认、进度汇报、问题处理等）\n2. AI生成初稿+人工审核模式，平均审核时间5分钟\n3. 设置自动回复规则：工作时间15分钟内必回\n\n结果：响应时间从2小时降至15分钟，客户满意度从82%提升至91%，成交率提升8%。',
                tags_json: ['成功案例', '沟通效率', '模板化', 'AI辅助'],
                source: 'customer_communication',
                related_project_id: null,
                metrics_json: { before_response_min: 120, after_response_min: 15, satisfaction_before: 0.82, satisfaction_after: 0.91, deal_rate_increase: 0.08 },
                created_at: '2026-09-01T00:00:00.000Z',
            },
            {
                id: 'exp_008',
                category: 'success_case',
                title: '数据看板项目：通过主动沟通避免了一次潜在流失',
                content: '项目背景：数据看板项目开发中，客户连续3天未回复消息。\n\n处理过程：\n1. 识别异常：客户正常响应时间为4小时，3天未回属于高风险信号\n2. 主动电话沟通，发现客户对图表样式不满意但不好意思提\n3. 当天提供3套新样式方案，客户选择后2天内完成修改\n4. 客户最终验收通过，并追加了5000元的功能扩展\n\n经验：客户沉默不等于满意，主动沟通是防止流失的关键。',
                tags_json: ['成功案例', '主动沟通', '风险预警', '客户挽留'],
                source: 'customer_communication',
                related_project_id: 'proj_004',
                metrics_json: { revenue: 18000, additional_revenue: 5000, cost: 6500, profit_margin: 0.639, risk_days: 3 },
                created_at: '2026-08-12T00:00:00.000Z',
            },
            // 失败教训 4条
            {
                id: 'exp_009',
                category: 'failure_lesson',
                title: 'API集成服务：成本估算严重失误导致利润率仅13.3%',
                content: '项目背景：为客户集成多个第三方API，预算6000元。\n\n失败原因：\n1. 低估了第三方API的文档质量和调试难度，实际调试时间是预估的3倍\n2. 未考虑API限流和异常处理的开发成本\n3. 客户频繁要求增加新的API集成，未走变更流程\n4. 实际成本5200元，利润率仅13.3%\n\n教训：API集成类项目应增加50%的调试缓冲，所有变更必须书面确认并报价。',
                tags_json: ['失败教训', '成本失控', '估算失误', '变更管理'],
                source: 'project_delivery',
                related_project_id: 'proj_006',
                metrics_json: { revenue: 6000, cost: 5200, profit_margin: 0.133, estimated_hours: 20, actual_hours: 55, overrun_pct: 1.75 },
                created_at: '2026-07-20T00:00:00.000Z',
            },
            {
                id: 'exp_010',
                category: 'failure_lesson',
                title: '运维工具开发：技术选型错误导致项目亏损1200元',
                content: '项目背景：为客户开发运维监控工具，预算4000元。\n\n失败原因：\n1. 选择了过于复杂的技术栈，与项目规模不匹配\n2. 团队对所选技术不熟悉，学习成本高\n3. 开发周期从预估7天延长到15天\n4. 最终成本5200元，亏损1200元\n\n教训：技术选型应优先考虑团队熟悉度，小项目避免使用新技术。商机筛选阶段应增加技术匹配度审核。',
                tags_json: ['失败教训', '技术风险', '选型错误', '亏损'],
                source: 'project_delivery',
                related_project_id: 'proj_007',
                metrics_json: { revenue: 4000, cost: 5200, profit: -1200, profit_margin: -0.3, estimated_days: 7, actual_days: 15 },
                created_at: '2026-06-28T00:00:00.000Z',
            },
            {
                id: 'exp_011',
                category: 'failure_lesson',
                title: '需求蔓延失控：客户连续追加12个功能未重新报价',
                content: '项目背景：某管理系统开发，初始报价25000元。\n\n失败原因：\n1. 需求文档过于粗略，仅列出大功能模块未细化\n2. 客户以"小功能"为由连续追加12个功能点\n3. 项目经理未坚持变更流程，口头答应了所有需求\n4. 实际开发量增加60%，成本从10000增至18000\n5. 利润率从60%降至28%\n\n教训：需求文档必须细化到功能点，所有变更必须走书面确认+重新报价流程。',
                tags_json: ['失败教训', '需求蔓延', '变更管理', '流程缺失'],
                source: 'project_delivery',
                related_project_id: 'proj_008',
                metrics_json: { initial_revenue: 25000, initial_cost: 10000, actual_cost: 18000, actual_profit_margin: 0.28, features_added: 12, scope_increase: 0.6 },
                created_at: '2026-08-08T00:00:00.000Z',
            },
            {
                id: 'exp_012',
                category: 'failure_lesson',
                title: '低质量商机误判：花了10天沟通最终客户无预算',
                content: '项目背景：从电鸭平台获取的商机，描述看起来需求明确。\n\n失败原因：\n1. 商机描述中未提及预算，未在首次沟通时确认\n2. 花了10天做需求分析和方案设计\n3. 最终报价时客户表示预算只有报价的1/3\n4. 浪费了10天的沟通和方案设计成本\n\n教训：商机筛选阶段必须确认预算范围，首次沟通就要问预算。无预算信息的商机应降低优先级。',
                tags_json: ['失败教训', '商机质量', '预算确认', '时间浪费'],
                source: 'opportunity_conversion',
                related_project_id: null,
                metrics_json: { wasted_days: 10, quoted_price: 30000, customer_budget: 10000, gap_pct: 0.67 },
                created_at: '2026-07-15T00:00:00.000Z',
            },
            // 最佳实践 3条
            {
                id: 'exp_013',
                category: 'best_practice',
                title: '标准化项目交付流程SOP（v2.0）',
                content: '经过20+项目总结的标准化交付流程：\n\n1. 需求阶段（2-3天）\n   - 使用标准需求收集模板\n   - 功能清单必须细化到可估工时的粒度\n   - 客户签字确认后才进入开发\n\n2. 开发阶段（按模块）\n   - 每个模块独立估算、独立排期\n   - 每日站会15分钟同步进度和风险\n   - 模块完成后立即自测，不堆积到最后\n\n3. 交付阶段\n   - 提前3天通知客户验收\n   - 提供详细的交付清单和使用文档\n   - 验收后7天内跟进使用情况\n\n4. 复盘阶段\n   - 项目结束后3天内完成复盘\n   - 记录成功经验和失败教训到经验库\n   - 更新报价规则和流程文档',
                tags_json: ['最佳实践', 'SOP', '标准化流程', '项目管理'],
                source: 'project_delivery',
                related_project_id: null,
                metrics_json: { avg_profit_margin: 0.62, avg_delivery_days: 18, customer_satisfaction: 0.9 },
                created_at: '2026-08-30T00:00:00.000Z',
            },
            {
                id: 'exp_014',
                category: 'best_practice',
                title: '客户分级管理策略：ABC三级差异化服务',
                content: '基于客户价值和潜力的分级管理策略：\n\nA级客户（高价值高潜力）：\n- 占比约20%，贡献约60%收入\n- 专属沟通通道，2小时内响应\n- 主动提供行业洞察和增值建议\n- 季度回顾会议，挖掘追加需求\n- 可接受适度溢价（10-15%）\n\nB级客户（中等价值）：\n- 占比约30%，贡献约30%收入\n- 标准响应时间（工作时间4小时内）\n- 标准化服务流程\n- 关注满意度，有升级潜力的重点培养\n\nC级客户（低价值）：\n- 占比约50%，贡献约10%收入\n- 自助服务为主，模板化沟通\n- 严格控制服务成本\n- 小项目走标准化流程，不做深度定制\n\n效果：实施后客户整体满意度提升15%，A级客户复购率达40%。',
                tags_json: ['最佳实践', '客户分级', '差异化服务', '客户管理'],
                source: 'customer_communication',
                related_project_id: null,
                metrics_json: { a_pct: 0.2, a_revenue_pct: 0.6, a_repurchase_rate: 0.4, satisfaction_increase: 0.15 },
                created_at: '2026-09-02T00:00:00.000Z',
            },
            {
                id: 'exp_015',
                category: 'best_practice',
                title: '报价审核 Checklist：避免低价中标的5道防线',
                content: '每个项目报价前必须通过以下Checklist：\n\n1. 成本完整性检查\n   - 开发工时是否包含调试和联调时间？\n   - 是否包含沟通成本（按开发工时的20%估算）？\n   - 是否包含测试和修复时间？\n   - 是否包含部署和文档时间？\n\n2. 风险缓冲检查\n   - 技术不确定性是否增加了30%缓冲？\n   - 需求不明确是否增加了20%缓冲？\n   - 新客户是否增加了15%沟通风险缓冲？\n\n3. 利润率底线检查\n   - 计算利润率是否 >= 30%（底线）\n   - A级客户可接受25%（有长期价值）\n   - 低于20%必须拒绝或重新谈判\n\n4. 竞品价格检查\n   - 同类型项目历史报价是多少？\n   - 市场行情价是多少？\n   - 是否存在明显低于市场价的情况？\n\n5. 变更条款检查\n   - 报价是否明确了包含范围？\n   - 是否约定了变更的计价方式？\n   - 是否有书面确认机制？\n\n执行效果：因报价失误导致的低利润项目从30%降至8%。',
                tags_json: ['最佳实践', '报价审核', 'Checklist', '风险控制'],
                source: 'quote_strategy',
                related_project_id: null,
                metrics_json: { low_margin_projects_before: 0.3, low_margin_projects_after: 0.08, avg_margin_increase: 0.12 },
                created_at: '2026-08-18T00:00:00.000Z',
            },
        ];
    }
};
exports.ExperienceService = ExperienceService;
exports.ExperienceService = ExperienceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ExperienceService);
//# sourceMappingURL=experience.service.js.map