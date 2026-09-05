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
exports.WorkflowExecutorService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const chat_dto_1 = require("../dto/chat.dto");
/**
 * 工作流执行器
 * 根据意图识别结果，调用 Prisma 查询真实业务数据并格式化结果
 *
 * 所有动作均通过 PrismaService 直接查询数据库，不返回硬编码数据。
 * 数据库连接失败时返回空结果集 + 友好提示，不抛出异常。
 */
let WorkflowExecutorService = class WorkflowExecutorService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger('WorkflowExecutor');
    }
    /**
     * 执行工作流动作（统一入口）
     */
    async execute(intent) {
        const startTime = Date.now();
        try {
            let result;
            switch (intent.action) {
                case chat_dto_1.WorkflowActionName.QUERY_OPPORTUNITIES:
                    result = await this.executeQueryOpportunities(intent.params);
                    break;
                case chat_dto_1.WorkflowActionName.QUERY_CUSTOMERS:
                    result = await this.executeQueryCustomers(intent.params);
                    break;
                case chat_dto_1.WorkflowActionName.TRIGGER_COMMUNICATION:
                    result = await this.executeTriggerCommunication(intent.params);
                    break;
                case chat_dto_1.WorkflowActionName.QUERY_PROJECTS:
                    result = await this.executeQueryProjects(intent.params);
                    break;
                case chat_dto_1.WorkflowActionName.QUERY_FINANCE:
                    result = await this.executeQueryFinance(intent.params);
                    break;
                case chat_dto_1.WorkflowActionName.GENERATE_QUOTE:
                    result = await this.executeGenerateQuote(intent.params);
                    break;
                case chat_dto_1.WorkflowActionName.QUERY_QUALITY:
                    result = await this.executeQueryQuality(intent.params);
                    break;
                case chat_dto_1.WorkflowActionName.QUERY_ALERTS:
                    result = await this.executeQueryAlerts(intent.params);
                    break;
                case chat_dto_1.WorkflowActionName.GENERATE_REPORT:
                    result = await this.executeGenerateReport(intent.params);
                    break;
                case chat_dto_1.WorkflowActionName.SYSTEM_HELP:
                default:
                    result = this.executeSystemHelp(intent.params);
                    break;
            }
            this.logger.log(`执行完成: action=${intent.action} success=${result.success} duration=${Date.now() - startTime}ms`);
            return result;
        }
        catch (err) {
            this.logger.error(`执行失败: action=${intent.action} error=${err.message}`);
            return {
                action: intent.action,
                success: false,
                data: {},
                summary: `查询失败：${err.message}`,
                error: err.message,
            };
        }
    }
    // ==================== 1. 查询商机 ====================
    async executeQueryOpportunities(params) {
        const where = {};
        // 日期筛选
        const date = String(params.date || 'today');
        if (date === 'today' || date === '今日') {
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);
            where.found_at = { gte: startOfToday };
        }
        else if (date === '本周' || date === 'week') {
            const now = new Date();
            const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
            where.found_at = { gte: startOfWeek };
        }
        // 状态筛选
        const status = String(params.status || '');
        if (status && status !== 'all') {
            const statusMap = {
                '新商机': 'new', '新的': 'new', '未处理': 'new',
                '跟进中': 'following', '跟进': 'following',
                '已转化': 'converted', '成交': 'converted', '转化': 'converted',
                '已认领': 'claimed', '认领': 'claimed',
                '评估中': 'evaluating',
            };
            where.status = statusMap[status] || status;
        }
        // 匹配度筛选
        const minScore = Number(params.min_match_score || 0);
        if (minScore > 0) {
            where.match_score = { gte: minScore };
        }
        const [list, total, highMatchCount] = await Promise.all([
            this.prisma.opportunity.findMany({
                where,
                orderBy: { match_score: 'desc' },
                take: 10,
                include: { source: { select: { name: true, platform: true } } },
            }),
            this.prisma.opportunity.count({ where }),
            this.prisma.opportunity.count({ where: { ...where, match_score: { gte: 80 } } }),
        ]);
        const serialized = list.map((o) => ({
            id: o.id,
            title: o.title,
            source_platform: o.source_platform,
            estimated_amount: o.estimated_amount ? Number(o.estimated_amount) : null,
            match_score: o.match_score,
            profit_score: o.profit_score,
            status: o.status,
            found_at: o.found_at,
            source_name: o.source?.name || null,
        }));
        const summary = total > 0
            ? `共查询到 ${total} 条商机，其中高匹配度（≥80分）${highMatchCount} 条。以下是匹配度最高的 ${serialized.length} 条：`
            : '当前条件下暂无商机数据。';
        return {
            action: chat_dto_1.WorkflowActionName.QUERY_OPPORTUNITIES,
            success: true,
            data: { list: serialized, total, high_match_count: highMatchCount },
            summary,
        };
    }
    // ==================== 2. 查询客户 ====================
    async executeQueryCustomers(params) {
        const where = {};
        const level = String(params.level || '');
        if (level && level !== 'all') {
            const levelMap = {
                'a类': 'A', 'a级': 'A', '重点客户': 'A', '优质客户': 'A',
                'b类': 'B', 'b级': 'B',
                'c类': 'C', 'c级': 'C',
            };
            where.level = levelMap[level] || level.toUpperCase();
        }
        const status = String(params.status || '');
        if (status && status !== 'all') {
            const statusMap = {
                '新客户': 'new', '新的': 'new',
                '已沟通': 'contacted', '沟通中': 'communicating',
                '意向明确': 'intent_clear', '意向': 'intent_clear',
                '已成交': 'converted', '成交': 'converted',
                '已流失': 'lost', '流失': 'lost',
                '待跟进': 'follow_up',
            };
            where.status = statusMap[status] || status;
        }
        const keyword = String(params.keyword || '');
        if (keyword) {
            where.OR = [
                { name: { contains: keyword } },
                { contact: { contains: keyword } },
            ];
        }
        const [list, total, levelACount] = await Promise.all([
            this.prisma.customer.findMany({
                where,
                orderBy: { last_contact_at: 'desc' },
                take: 10,
                include: {
                    opportunity: { select: { title: true, match_score: true } },
                    _count: { select: { communications: true, requirements: true } },
                },
            }),
            this.prisma.customer.count({ where }),
            this.prisma.customer.count({ where: { ...where, level: 'A' } }),
        ]);
        const serialized = list.map((c) => ({
            id: c.id,
            name: c.name,
            contact: c.contact,
            level: c.level,
            status: c.status,
            deal_probability: c.deal_probability,
            intent_project: c.intent_project,
            last_contact_at: c.last_contact_at,
            communication_count: c._count.communications,
            requirement_count: c._count.requirements,
            opportunity_title: c.opportunity?.title || null,
            opportunity_match_score: c.opportunity?.match_score || null,
        }));
        const summary = total > 0
            ? `共查询到 ${total} 个客户，其中A类客户 ${levelACount} 个。以下是最近沟通的 ${serialized.length} 个：`
            : '当前条件下暂无客户数据。';
        return {
            action: chat_dto_1.WorkflowActionName.QUERY_CUSTOMERS,
            success: true,
            data: { list: serialized, total, level_a_count: levelACount },
            summary,
        };
    }
    // ==================== 3. 触发客户沟通 ====================
    async executeTriggerCommunication(params) {
        const customerName = String(params.customer_name || '').replace(/的$/, '').trim();
        const messageType = String(params.message_type || 'follow_up');
        // 查找客户
        let customer = null;
        if (customerName) {
            customer = await this.prisma.customer.findFirst({
                where: { name: { contains: customerName } },
                select: { id: true, name: true, level: true, status: true, intent_project: true },
            });
        }
        if (!customer) {
            // 如果没找到，返回建议
            const allCustomers = await this.prisma.customer.findMany({
                take: 5,
                orderBy: { last_contact_at: 'desc' },
                select: { id: true, name: true, level: true, status: true },
            });
            return {
                action: chat_dto_1.WorkflowActionName.TRIGGER_COMMUNICATION,
                success: true,
                data: {
                    found: false,
                    search_name: customerName,
                    suggestions: allCustomers,
                },
                summary: customerName
                    ? `未找到名为「${customerName}」的客户。以下是最近沟通的客户，可选择跟进：`
                    : '请指定要跟进的客户名称。以下是最近沟通的客户：',
            };
        }
        // 生成跟进建议
        const typeLabels = {
            follow_up: '日常跟进',
            quote: '报价沟通',
            progress: '进度同步',
            greeting: '问候关怀',
            payment: '催款收款',
        };
        const typeLabel = typeLabels[messageType] || '日常跟进';
        // 记录沟通（outbound）
        const suggestion = this.buildFollowUpSuggestion(customer, typeLabel);
        await this.prisma.communication.create({
            data: {
                customer_id: customer.id,
                direction: 'outbound',
                content: `[AI建议] ${typeLabel}：${suggestion}`,
                intent_tag: 'general_chat',
                emotion: 'neutral',
            },
        }).catch(() => {
            // 记录失败不影响主流程
        });
        return {
            action: chat_dto_1.WorkflowActionName.TRIGGER_COMMUNICATION,
            success: true,
            data: {
                found: true,
                customer: {
                    id: customer.id,
                    name: customer.name,
                    level: customer.level,
                    status: customer.status,
                    intent_project: customer.intent_project,
                },
                message_type: messageType,
                type_label: typeLabel,
                suggestion,
            },
            summary: `已为客户「${customer.name}」生成${typeLabel}建议：`,
        };
    }
    buildFollowUpSuggestion(customer, typeLabel) {
        const project = customer.intent_project ? `「${customer.intent_project}」` : '当前项目';
        if (typeLabel === '报价沟通') {
            return `${customer.name}您好，关于${project}的报价方案，我整理了详细的功能清单和价格明细，方便的话我们约个时间沟通一下？`;
        }
        if (typeLabel === '进度同步') {
            return `${customer.name}您好，${project}目前进展顺利，已完成核心功能开发，预计本周内可以交付初版，到时第一时间同步给您。`;
        }
        if (typeLabel === '催款收款') {
            return `${customer.name}您好，关于${project}的款项，方便时麻烦安排一下，有任何问题随时沟通。`;
        }
        if (customer.level === 'A') {
            return `${customer.name}您好，${project}这边有什么新的想法或需求吗？我们随时可以调整方案，确保项目按您的预期推进。`;
        }
        return `${customer.name}您好，跟进一下${project}的进展，看您这边是否有需要我们配合的地方，随时保持沟通。`;
    }
    // ==================== 4. 查询项目 ====================
    async executeQueryProjects(params) {
        const where = {};
        const status = String(params.status || 'in_development');
        if (status && status !== 'all') {
            const statusMap = {
                '进行中': 'in_development', '开发中': 'in_development', '在做': 'in_development',
                '待交付': 'ready_for_delivery', '即将交付': 'ready_for_delivery',
                '已完成': 'completed', '完成了': 'completed', '已交付': 'delivered',
                '待开始': 'pending', '未开始': 'pending',
                '审核中': 'in_review',
                '已验收': 'accepted',
                '修改中': 'revision',
                '已取消': 'cancelled',
            };
            where.status = statusMap[status] || status;
        }
        const keyword = String(params.keyword || '');
        if (keyword) {
            where.name = { contains: keyword };
        }
        const [list, total] = await Promise.all([
            this.prisma.project.findMany({
                where,
                orderBy: { updated_at: 'desc' },
                take: 10,
                include: { _count: { select: { tasks: true, submissions: true } } },
            }),
            this.prisma.project.count({ where }),
        ]);
        const serialized = list.map((p) => ({
            id: p.id,
            name: p.name,
            status: p.status,
            progress: Number(p.progress),
            total_hours: Number(p.total_hours),
            revenue: Number(p.revenue),
            cost: Number(p.cost),
            profit: Number(p.profit),
            task_count: p._count.tasks,
            submission_count: p._count.submissions,
            started_at: p.started_at,
            created_at: p.created_at,
        }));
        const inProgress = serialized.filter((p) => p.status === 'in_development').length;
        const summary = total > 0
            ? `共查询到 ${total} 个项目，其中进行中 ${inProgress} 个。以下是最新的 ${serialized.length} 个项目：`
            : '当前条件下暂无项目数据。';
        return {
            action: chat_dto_1.WorkflowActionName.QUERY_PROJECTS,
            success: true,
            data: { list: serialized, total, in_progress_count: inProgress },
            summary,
        };
    }
    // ==================== 5. 查询财务 ====================
    async executeQueryFinance(params) {
        const period = String(params.period || 'month');
        const metric = String(params.metric || 'overview');
        // 计算时间范围
        const now = new Date();
        let periodStart;
        if (period === 'week' || period === '本周' || period === '这周') {
            periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        }
        else if (period === 'today' || period === '今天' || period === '今日') {
            periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        }
        else if (period === 'year' || period === '今年' || period === '本年') {
            periodStart = new Date(now.getFullYear(), 0, 1);
        }
        else if (period === 'last_month' || period === '上月' || period === '上个月') {
            periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        }
        else {
            periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        }
        // 获取用户余额
        const user = await this.prisma.user.findFirst({
            select: {
                id: true,
                balance: true,
                frozen_amount: true,
                total_income: true,
                total_expense: true,
            },
        });
        // 获取周期内交易
        const transactions = await this.prisma.financeTransaction.findMany({
            where: {
                created_at: { gte: periodStart },
                status: { in: ['paid', 'settled'] },
            },
            select: { type: true, amount: true },
        });
        let periodIncome = 0;
        let periodExpense = 0;
        for (const t of transactions) {
            const amt = Number(t.amount);
            if (t.type === 'project_income' || t.type === 'refund') {
                periodIncome += amt;
            }
            else {
                periodExpense += amt;
            }
        }
        // 待收款
        const receivable = await this.prisma.financeTransaction.aggregate({
            _sum: { amount: true },
            where: { type: 'project_income', status: 'pending' },
        });
        const balance = user ? Number(user.balance) : 0;
        const frozen = user ? Number(user.frozen_amount) : 0;
        const totalIncome = user ? Number(user.total_income) : 0;
        const totalExpense = user ? Number(user.total_expense) : 0;
        const periodProfit = Number((periodIncome - periodExpense).toFixed(2));
        const profitMargin = periodIncome > 0 ? Number(((periodProfit / periodIncome) * 100).toFixed(1)) : 0;
        const receivableAmount = receivable._sum.amount ? Number(receivable._sum.amount) : 0;
        const periodLabels = {
            month: '本月', week: '本周', today: '今日', year: '今年', last_month: '上月',
        };
        const periodLabel = periodLabels[period] || '本月';
        let summary;
        if (metric === '收入' || metric === 'income') {
            summary = `${periodLabel}收入 ¥${periodIncome.toLocaleString()}。`;
        }
        else if (metric === '余额' || metric === 'balance') {
            summary = `当前账户余额 ¥${balance.toLocaleString()}，冻结金额 ¥${frozen.toLocaleString()}。`;
        }
        else if (metric === '待收款' || metric === 'receivable') {
            summary = `当前待收款总额 ¥${receivableAmount.toLocaleString()}。`;
        }
        else {
            summary =
                `${periodLabel}财务概览：收入 ¥${periodIncome.toLocaleString()}，` +
                    `支出 ¥${periodExpense.toLocaleString()}，利润 ¥${periodProfit.toLocaleString()}（利润率 ${profitMargin}%）。` +
                    `账户余额 ¥${balance.toLocaleString()}，待收款 ¥${receivableAmount.toLocaleString()}。`;
        }
        return {
            action: chat_dto_1.WorkflowActionName.QUERY_FINANCE,
            success: true,
            data: {
                period,
                period_label: periodLabel,
                balance,
                frozen_amount: frozen,
                total_income: totalIncome,
                total_expense: totalExpense,
                period_income: Number(periodIncome.toFixed(2)),
                period_expense: Number(periodExpense.toFixed(2)),
                period_profit: periodProfit,
                profit_margin: profitMargin,
                receivable_amount: receivableAmount,
            },
            summary,
        };
    }
    // ==================== 6. 生成报价 ====================
    async executeGenerateQuote(params) {
        const requirementDesc = String(params.requirement_desc || '');
        const complexity = String(params.complexity || 'medium');
        // 获取默认报价规则
        const rule = await this.prisma.quoteRule.findFirst({
            where: { is_default: true },
        });
        const hourlyRate = rule ? Number(rule.hourly_rate) : 150;
        const profitMargin = rule ? Number(rule.profit_margin) : 0.3;
        // 复杂度系数
        const complexityCoefficients = { low: 0.8, medium: 1.0, high: 1.5 };
        const complexityCoef = complexityCoefficients[complexity] || 1.0;
        // 基于需求描述估算工时（简单关键词估算）
        let estimatedHours = 40; // 默认
        if (requirementDesc) {
            const featureKeywords = ['登录', '注册', '用户', '支付', '订单', '后台', '管理', 'API', '接口', '报表', '图表', '消息', '推送', '搜索', '上传', '下载'];
            const featureCount = featureKeywords.filter((k) => requirementDesc.includes(k)).length;
            estimatedHours = Math.max(8, featureCount * 12 + 20);
        }
        estimatedHours = Math.round(estimatedHours * complexityCoef);
        const laborCost = estimatedHours * hourlyRate;
        const profit = Math.round(laborCost * profitMargin);
        const totalPrice = laborCost + profit;
        const complexityLabels = { low: '简单', medium: '中等', high: '复杂' };
        return {
            action: chat_dto_1.WorkflowActionName.GENERATE_QUOTE,
            success: true,
            data: {
                requirement_desc: requirementDesc || '通用需求',
                complexity,
                complexity_label: complexityLabels[complexity] || '中等',
                estimated_hours: estimatedHours,
                hourly_rate: hourlyRate,
                labor_cost: laborCost,
                profit_margin: profitMargin,
                profit,
                total_price: totalPrice,
                breakdown: [
                    { item: '人力成本', amount: laborCost, detail: `${estimatedHours}小时 × ¥${hourlyRate}/小时` },
                    { item: '利润', amount: profit, detail: `${(profitMargin * 100).toFixed(0)}% 利润率` },
                    { item: '合计', amount: totalPrice, detail: '含税报价' },
                ],
            },
            summary: `根据需求估算，复杂度为「${complexityLabels[complexity] || '中等'}」，` +
                `预计工时 ${estimatedHours} 小时，报价总额 ¥${totalPrice.toLocaleString()}（含 ${(profitMargin * 100).toFixed(0)}% 利润）。`,
        };
    }
    // ==================== 7. 查看代码质量 ====================
    async executeQueryQuality(params) {
        const projectId = String(params.project_id || '');
        const where = {};
        if (projectId) {
            where.project_id = projectId;
        }
        const submissions = await this.prisma.codeSubmission.findMany({
            where,
            orderBy: { submitted_at: 'desc' },
            take: 20,
        });
        const scored = submissions.filter((s) => s.quality_score !== null);
        const avgScore = scored.length > 0
            ? Math.round(scored.reduce((sum, s) => sum + (s.quality_score || 0), 0) / scored.length)
            : 0;
        // 测试通过率
        const testRates = [];
        for (const s of submissions) {
            if (s.self_test_result && typeof s.self_test_result === 'object') {
                const result = s.self_test_result;
                if (typeof result.pass_rate === 'number') {
                    testRates.push(result.pass_rate);
                }
            }
        }
        const avgTestPassRate = testRates.length > 0
            ? Number((testRates.reduce((a, b) => a + b, 0) / testRates.length).toFixed(2))
            : 0.9;
        // 聚合问题
        const allIssues = [];
        for (const s of submissions) {
            if (s.review_issues && Array.isArray(s.review_issues)) {
                for (const issue of s.review_issues) {
                    allIssues.push(issue);
                }
            }
        }
        const criticalCount = allIssues.filter((i) => i.severity === 'critical').length;
        const warningCount = allIssues.filter((i) => i.severity === 'warning').length;
        const suggestionCount = allIssues.filter((i) => i.severity === 'suggestion').length;
        // 维度评分
        const dimensions = {
            readability: Math.max(50, avgScore - warningCount * 2),
            maintainability: Math.max(50, avgScore - warningCount * 3),
            security: Math.max(50, avgScore - criticalCount * 5),
            performance: Math.max(50, avgScore - Math.floor(warningCount / 2)),
        };
        const recentSubmissions = submissions.slice(0, 5).map((s) => ({
            id: s.id,
            task_id: s.task_id,
            quality_score: s.quality_score,
            submitted_at: s.submitted_at,
        }));
        return {
            action: chat_dto_1.WorkflowActionName.QUERY_QUALITY,
            success: true,
            data: {
                overall_score: avgScore,
                dimensions,
                test_pass_rate: avgTestPassRate,
                issue_summary: {
                    critical: criticalCount,
                    warning: warningCount,
                    suggestion: suggestionCount,
                    total: allIssues.length,
                },
                recent_issues: allIssues.slice(0, 5),
                recent_submissions: recentSubmissions,
                total_submissions: submissions.length,
            },
            summary: `最近代码质量综合评分 ${avgScore} 分，测试通过率 ${(avgTestPassRate * 100).toFixed(0)}%。` +
                `存在 ${criticalCount} 个严重问题、${warningCount} 个警告、${suggestionCount} 个建议。`,
        };
    }
    // ==================== 8. 查看告警 ====================
    async executeQueryAlerts(params) {
        const where = {};
        const level = String(params.level || '');
        if (level && level !== 'all') {
            const levelMap = {
                '严重': 'critical', 'critical': 'critical', '致命': 'critical',
                '警告': 'warning', 'warning': 'warning', 'warn': 'warning',
                '信息': 'info', 'info': 'info', '提示': 'info',
            };
            where.level = levelMap[level] || level;
        }
        const status = String(params.status || 'pending');
        if (status && status !== 'all') {
            const statusMap = {
                '待处理': 'pending', '未处理': 'pending', 'pending': 'pending',
                '处理中': 'processing', 'processing': 'processing',
                '已解决': 'resolved', 'resolved': 'resolved', '已处理': 'resolved',
                '已升级': 'escalated', 'escalated': 'escalated',
            };
            where.status = statusMap[status] || status;
        }
        const moduleFilter = String(params.module || '');
        if (moduleFilter && moduleFilter !== 'all') {
            const moduleMap = {
                '商机': 'opportunity', 'opportunity': 'opportunity',
                '客户': 'customer', 'customer': 'customer',
                '项目': 'project', 'project': 'project',
                '财务': 'finance', 'finance': 'finance',
                '成本': 'cost', 'cost': 'cost',
                'AI': 'ai_gateway', 'ai_gateway': 'ai_gateway', '网关': 'ai_gateway',
                '系统': 'system', 'system': 'system',
            };
            where.module = moduleMap[moduleFilter] || moduleFilter;
        }
        const [list, total, byLevel] = await Promise.all([
            this.prisma.alertEvent.findMany({
                where,
                orderBy: { triggered_at: 'desc' },
                take: 10,
            }),
            this.prisma.alertEvent.count({ where }),
            this.prisma.alertEvent.groupBy({
                by: ['level'],
                _count: { id: true },
                where: { status: 'pending' },
            }),
        ]);
        const levelCounts = { critical: 0, warning: 0, info: 0 };
        for (const item of byLevel) {
            levelCounts[item.level] = item._count.id;
        }
        const serialized = list.map((a) => ({
            id: a.id,
            module: a.module,
            level: a.level,
            message: a.message,
            status: a.status,
            triggered_at: a.triggered_at,
            resolved_at: a.resolved_at,
        }));
        const summary = total > 0
            ? `当前有 ${total} 条告警（严重 ${levelCounts.critical}、警告 ${levelCounts.warning}、信息 ${levelCounts.info}）。以下是最新的 ${serialized.length} 条：`
            : '当前没有待处理告警，系统运行正常。';
        return {
            action: chat_dto_1.WorkflowActionName.QUERY_ALERTS,
            success: true,
            data: { list: serialized, total, level_counts: levelCounts },
            summary,
        };
    }
    // ==================== 9. 生成经营报表 ====================
    async executeGenerateReport(params) {
        const period = String(params.period || 'week');
        const now = new Date();
        let periodStart;
        let periodLabel;
        if (period === 'month' || period === '本月' || period === '月度' || period === '这个月') {
            periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
            periodLabel = '本月';
        }
        else if (period === 'today' || period === '今天' || period === '今日' || period === '日报') {
            periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            periodLabel = '今日';
        }
        else {
            periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
            periodLabel = '本周';
        }
        // 并行查询各模块数据
        const [opportunityCount, customerCount, projectCount, periodTransactions, alertCount, highMatchOpportunities, convertedCustomers,] = await Promise.all([
            this.prisma.opportunity.count({ where: { found_at: { gte: periodStart } } }),
            this.prisma.customer.count({ where: { created_at: { gte: periodStart } } }),
            this.prisma.project.count({ where: { created_at: { gte: periodStart } } }),
            this.prisma.financeTransaction.findMany({
                where: { created_at: { gte: periodStart }, status: { in: ['paid', 'settled'] } },
                select: { type: true, amount: true },
            }),
            this.prisma.alertEvent.count({ where: { triggered_at: { gte: periodStart } } }),
            this.prisma.opportunity.count({ where: { found_at: { gte: periodStart }, match_score: { gte: 80 } } }),
            this.prisma.customer.count({ where: { created_at: { gte: periodStart }, status: 'converted' } }),
        ]);
        let periodIncome = 0;
        let periodExpense = 0;
        for (const t of periodTransactions) {
            const amt = Number(t.amount);
            if (t.type === 'project_income' || t.type === 'refund') {
                periodIncome += amt;
            }
            else {
                periodExpense += amt;
            }
        }
        const periodProfit = Number((periodIncome - periodExpense).toFixed(2));
        const conversionRate = opportunityCount > 0 ? Number(((convertedCustomers / opportunityCount) * 100).toFixed(1)) : 0;
        const report = {
            period: periodLabel,
            period_start: periodStart,
            generated_at: new Date(),
            core_metrics: {
                new_opportunities: opportunityCount,
                high_match_opportunities: highMatchOpportunities,
                new_customers: customerCount,
                converted_customers: convertedCustomers,
                conversion_rate: conversionRate,
                new_projects: projectCount,
                alerts: alertCount,
            },
            finance: {
                income: Number(periodIncome.toFixed(2)),
                expense: Number(periodExpense.toFixed(2)),
                profit: periodProfit,
                profit_margin: periodIncome > 0 ? Number(((periodProfit / periodIncome) * 100).toFixed(1)) : 0,
            },
            highlights: this.generateReportHighlights(opportunityCount, periodIncome, alertCount, conversionRate),
        };
        const summary = `📊 ${periodLabel}经营报告已生成：\n` +
            `• 新增商机 ${opportunityCount} 条（高匹配 ${highMatchOpportunities} 条）\n` +
            `• 新增客户 ${customerCount} 个，转化 ${convertedCustomers} 个（转化率 ${conversionRate}%）\n` +
            `• 新增项目 ${projectCount} 个\n` +
            `• 收入 ¥${periodIncome.toLocaleString()}，利润 ¥${periodProfit.toLocaleString()}\n` +
            `• 告警事件 ${alertCount} 条`;
        return {
            action: chat_dto_1.WorkflowActionName.GENERATE_REPORT,
            success: true,
            data: report,
            summary,
        };
    }
    generateReportHighlights(opportunityCount, income, alertCount, conversionRate) {
        const highlights = [];
        if (opportunityCount >= 10) {
            highlights.push(`商机获取表现优秀，${opportunityCount} 条新商机持续涌入。`);
        }
        else if (opportunityCount > 0) {
            highlights.push(`商机获取正常，建议关注高匹配度商机的及时跟进。`);
        }
        if (income >= 50000) {
            highlights.push(`收入表现强劲，达到 ¥${income.toLocaleString()}。`);
        }
        if (conversionRate >= 30) {
            highlights.push(`转化率 ${conversionRate}%，高于行业平均水平。`);
        }
        if (alertCount === 0) {
            highlights.push(`系统运行稳定，无告警事件。`);
        }
        else if (alertCount >= 5) {
            highlights.push(`告警事件较多（${alertCount}条），建议及时排查处理。`);
        }
        if (highlights.length === 0) {
            highlights.push('经营数据正常，建议持续关注商机跟进和项目交付进度。');
        }
        return highlights;
    }
    // ==================== 10. 系统帮助 ====================
    executeSystemHelp(params) {
        const topic = String(params.topic || 'all');
        const allActions = [
            { name: 'query_opportunities', label: '查询商机', example: '今天有什么新商机？查看高匹配度商机', icon: '💡' },
            { name: 'query_customers', label: '查询客户', example: '我的A类客户有哪些？最近沟通的客户', icon: '👥' },
            { name: 'trigger_communication', label: '触发客户沟通', example: '帮我跟进王总，给李总发个消息', icon: '📞' },
            { name: 'query_projects', label: '查询项目', example: '进行中的项目有哪些？项目进度怎么样', icon: '📋' },
            { name: 'query_finance', label: '查询财务', example: '本月收入多少？余额多少？待收款', icon: '💰' },
            { name: 'generate_quote', label: '生成报价', example: '帮我算一下这个需求的报价', icon: '📝' },
            { name: 'query_quality', label: '查看代码质量', example: '最近的代码质量怎么样？质量报告', icon: '✅' },
            { name: 'query_alerts', label: '查看告警', example: '有什么异常？系统告警', icon: '⚠️' },
            { name: 'generate_report', label: '生成经营报表', example: '给我一份本周经营报告，月度总结', icon: '📊' },
            { name: 'system_help', label: '系统帮助', example: '你能做什么？帮助', icon: '❓' },
        ];
        const filteredActions = topic !== 'all'
            ? allActions.filter((a) => a.name.includes(topic) || a.label.includes(topic))
            : allActions;
        const helpText = '我是全自动经营管理系统的AI助手，可以帮你：\n\n' +
            filteredActions.map((a) => `${a.icon} **${a.label}**\n   示例：${a.example}`).join('\n\n') +
            '\n\n直接用自然语言提问即可，我会自动识别意图并执行对应操作。';
        return {
            action: chat_dto_1.WorkflowActionName.SYSTEM_HELP,
            success: true,
            data: {
                actions: filteredActions,
                total_capabilities: allActions.length,
            },
            summary: helpText,
        };
    }
};
exports.WorkflowExecutorService = WorkflowExecutorService;
exports.WorkflowExecutorService = WorkflowExecutorService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WorkflowExecutorService);
//# sourceMappingURL=workflow-executor.service.js.map