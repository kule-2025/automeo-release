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
exports.OptimizationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const metric_service_1 = require("./metric.service");
const experience_service_1 = require("./experience.service");
/**
 * 自动调优服务（核心）
 * 分析EvolutionMetric趋势 → 识别低于目标的指标 → 从Experience库查找相关成功经验
 * → 生成调优建议 → 可选自动应用（写回QuoteRule/OpportunitySource配置）
 */
let OptimizationService = class OptimizationService {
    constructor(prisma, metricService, experienceService) {
        this.prisma = prisma;
        this.metricService = metricService;
        this.experienceService = experienceService;
        this.logger = new common_1.Logger('OptimizationService');
    }
    /**
     * 触发自动调优
     */
    async optimize(request) {
        this.logger.log('开始自动调优分析...');
        // 1. 获取所有指标
        const metricSummary = await this.metricService.getAllMetrics();
        const metrics = metricSummary.metrics;
        // 2. 筛选需要优化的指标（低于目标 或 趋势下降）
        const targetMetrics = this.filterMetricsNeedingOptimization(metrics, request?.metric_names);
        this.logger.log(`识别到 ${targetMetrics.length} 个需要优化的指标`);
        // 3. 为每个指标生成调优建议
        const suggestions = [];
        for (const metric of targetMetrics) {
            const suggestion = await this.generateSuggestion(metric);
            if (suggestion) {
                // 过滤置信度
                if (!request?.min_confidence || suggestion.confidence >= request.min_confidence) {
                    suggestions.push(suggestion);
                }
            }
        }
        // 4. 自动应用（如果启用）
        let autoAppliedCount = 0;
        if (request?.auto_apply) {
            for (const suggestion of suggestions) {
                if (suggestion.auto_applicable && suggestion.target_config) {
                    const applied = await this.autoApply(suggestion);
                    if (applied) {
                        suggestion.status = 'applied';
                        autoAppliedCount++;
                    }
                }
            }
        }
        this.logger.log(`调优完成: 生成 ${suggestions.length} 条建议, 自动应用 ${autoAppliedCount} 条`);
        return {
            generated_at: new Date().toISOString(),
            analyzed_metrics: metrics.length,
            suggestions_count: suggestions.length,
            auto_applied_count: autoAppliedCount,
            suggestions,
        };
    }
    /**
     * 获取历史调优建议
     */
    async getSuggestions(status) {
        const all = this.getBaselineSuggestions();
        if (status) {
            return all.filter((s) => s.status === status);
        }
        return all;
    }
    /**
     * 应用单条建议
     */
    async applySuggestion(id) {
        const all = this.getBaselineSuggestions();
        const suggestion = all.find((s) => s.id === id);
        if (!suggestion) {
            throw new Error(`建议 ${id} 不存在`);
        }
        if (suggestion.auto_applicable && suggestion.target_config) {
            await this.autoApply(suggestion);
        }
        suggestion.status = 'applied';
        this.logger.log(`应用调优建议: ${id} - ${suggestion.suggestion_detail}`);
        return suggestion;
    }
    // ========== 核心逻辑 ==========
    /**
     * 筛选需要优化的指标
     */
    filterMetricsNeedingOptimization(metrics, specifiedNames) {
        return metrics.filter((m) => {
            // 如果指定了指标名称，只处理指定的
            if (specifiedNames && specifiedNames.length > 0) {
                if (!specifiedNames.includes(m.metric_name))
                    return false;
            }
            // 低于目标值 或 趋势下降
            const belowTarget = m.current_value < m.target_value;
            const trendingDown = m.trend === 'down';
            // 差距超过5%才需要优化（避免微小波动）
            const gap = m.target_value > 0 ? (m.target_value - m.current_value) / m.target_value : 0;
            return (belowTarget && gap > 0.03) || trendingDown;
        });
    }
    /**
     * 为单个指标生成调优建议
     */
    async generateSuggestion(metric) {
        // 从经验库查找相关成功经验
        const relevantExperiences = await this.experienceService.findRelevantByMetric(metric.metric_name, 3);
        const relatedIds = relevantExperiences.map((e) => e.id);
        // 根据指标类型生成具体建议
        const suggestion = this.buildSuggestionByMetricType(metric, relevantExperiences);
        if (!suggestion)
            return null;
        suggestion.related_experience_ids = relatedIds;
        return suggestion;
    }
    /**
     * 根据指标类型构建具体建议
     */
    buildSuggestionByMetricType(metric, experiences) {
        const now = new Date().toISOString();
        const gap = metric.target_value - metric.current_value;
        const gapPct = metric.target_value > 0 ? (gap / metric.target_value) * 100 : 0;
        const base = {
            id: `opt_${metric.id}`,
            metric_name: metric.metric_name,
            problem_description: `${metric.metric_name}当前为${metric.current_value}${metric.unit ?? ''}，低于目标值${metric.target_value}${metric.unit ?? ''}，差距${gap.toFixed(1)}${metric.unit ?? ''}（${gapPct.toFixed(1)}%）。趋势：${metric.trend === 'down' ? '下降' : metric.trend === 'up' ? '上升但未达标' : '平稳'}。`,
            current_value: metric.current_value,
            target_value: metric.target_value,
            related_experience_ids: [],
            created_at: now,
            status: 'pending',
        };
        switch (metric.metric_name) {
            case '商机转化率': {
                // 查找阈值优化经验
                const thresholdExp = experiences.find((e) => e.title.includes('阈值') || e.metrics_json.threshold_after);
                const suggestedThreshold = thresholdExp?.metrics_json.threshold_after ?? 65;
                return {
                    ...base,
                    id: `opt_opp_conversion_${Date.now()}`,
                    suggestion_type: 'threshold_adjustment',
                    suggestion_detail: `商机筛选阈值当前为70分，建议降至${suggestedThreshold}分，同时增加profit_score>=55的辅助条件。根据经验「商机筛选优化」，阈值从75降至70后转化率提升了2个百分点。适度放宽筛选可增加商机池量35%，多维度评估优于单一严格阈值。`,
                    expected_improvement: `预计商机转化率从${metric.current_value}%提升至${(metric.current_value + 2.5).toFixed(1)}%，商机池量增加约30%`,
                    confidence: 0.82,
                    auto_applicable: true,
                    target_config: {
                        table: 'OpportunitySource',
                        field: 'match_threshold',
                        current_value: 70,
                        suggested_value: suggestedThreshold,
                    },
                };
            }
            case '客户成交率': {
                const commExp = experiences.find((e) => e.title.includes('沟通') || e.title.includes('模板'));
                return {
                    ...base,
                    id: `opt_customer_deal_${Date.now()}`,
                    suggestion_type: 'process_change',
                    suggestion_detail: `客户沟通响应时间偏长，建议：1）启用AI回复模板系统，覆盖10类常见场景；2）设置工作时间15分钟内必回的SLA；3）对A级客户开通专属沟通通道。根据经验「客户沟通模板化」，响应时间从2小时降至15分钟后，成交率提升8%。`,
                    expected_improvement: `预计客户成交率从${metric.current_value}%提升至${(metric.current_value + 5).toFixed(1)}%，客户满意度提升约9%`,
                    confidence: 0.78,
                    auto_applicable: false,
                    target_config: null,
                };
            }
            case '平均利润率': {
                const quoteExp = experiences.find((e) => e.title.includes('报价') || e.title.includes('分层'));
                const currentMargin = 0.30;
                const suggestedMargin = 0.35;
                return {
                    ...base,
                    id: `opt_profit_margin_${Date.now()}`,
                    suggestion_type: 'quote_adjustment',
                    suggestion_detail: `当前报价利润率为${(currentMargin * 100).toFixed(0)}%，建议提升至${(suggestedMargin * 100).toFixed(0)}%。同时建议：1）采用三档分层报价法（基础/标准/高级），标准版定价为成本的2.5倍；2）严格执行报价审核Checklist，确保成本估算完整性；3）对API集成等高调试成本项目增加50%缓冲。根据经验「报价策略调整」，分层报价使客单价提升22%。`,
                    expected_improvement: `预计平均利润率从${metric.current_value}%提升至${(metric.current_value + 5).toFixed(1)}%，客单价提升约15-20%`,
                    confidence: 0.85,
                    auto_applicable: true,
                    target_config: {
                        table: 'QuoteRule',
                        field: 'profit_margin',
                        current_value: currentMargin,
                        suggested_value: suggestedMargin,
                    },
                };
            }
            case '代码质量分': {
                return {
                    ...base,
                    id: `opt_code_quality_${Date.now()}`,
                    suggestion_type: 'prompt_optimization',
                    suggestion_detail: `代码质量评分低于目标，建议：1）优化代码生成提示词，增加"必须编写单元测试"和"代码review自检"的强制要求；2）引入代码质量门禁，quality_score<80的提交自动触发重写；3）增加静态代码分析步骤，在提交前检测常见问题。建议更新代码生成提示词至v1.2版本，增加测试覆盖率要求（>=70%）。`,
                    expected_improvement: `预计代码质量分从${metric.current_value}提升至${(metric.current_value + 4).toFixed(1)}，测试通过率提升约10%`,
                    confidence: 0.72,
                    auto_applicable: false,
                    target_config: null,
                };
            }
            case '客户满意度': {
                return {
                    ...base,
                    id: `opt_satisfaction_${Date.now()}`,
                    suggestion_type: 'process_change',
                    suggestion_detail: `客户满意度有提升空间，建议：1）实施客户分级管理（ABC三级），A级客户2小时响应、季度回顾；2）建立客户沉默预警机制，超过48小时未回复自动触发主动沟通；3）交付后7天内主动跟进使用情况。根据经验「客户分级管理策略」，实施后满意度提升15%，A级客户复购率达40%。`,
                    expected_improvement: `预计客户满意度从${metric.current_value}%提升至${(metric.current_value + 4).toFixed(1)}%，客户复购率提升约10%`,
                    confidence: 0.80,
                    auto_applicable: false,
                    target_config: null,
                };
            }
            case '交付准时率': {
                return {
                    ...base,
                    id: `opt_delivery_ontime_${Date.now()}`,
                    suggestion_type: 'process_change',
                    suggestion_detail: `交付准时率偏低，建议：1）严格执行标准化项目交付SOP，需求阶段必须细化到功能点；2）每个模块独立排期，设置模块级里程碑；3）增加30%的风险缓冲时间，特别是技术不确定性高的项目；4）每日站会同步风险，问题当天处理。根据经验「标准化项目交付流程SOP」，执行后平均交付周期18天，准时率显著提升。`,
                    expected_improvement: `预计交付准时率从${metric.current_value}%提升至${(metric.current_value + 8).toFixed(1)}%，平均交付周期缩短约15%`,
                    confidence: 0.76,
                    auto_applicable: false,
                    target_config: null,
                };
            }
            default:
                return null;
        }
    }
    /**
     * 自动应用建议到配置
     */
    async autoApply(suggestion) {
        if (!suggestion.target_config)
            return false;
        const { table, field, suggested_value } = suggestion.target_config;
        this.logger.log(`自动应用配置: ${table}.${field} = ${suggested_value}`);
        try {
            if (table === 'QuoteRule' && field === 'profit_margin') {
                // 更新默认报价规则的利润率
                await this.prisma.quoteRule.updateMany({
                    where: { is_default: true },
                    data: { profit_margin: Number(suggested_value) },
                });
                return true;
            }
            if (table === 'OpportunitySource' && field === 'match_threshold') {
                // 更新商机源配置中的匹配阈值（存储在config_json中）
                const sources = await this.prisma.opportunitySource.findMany({
                    where: { status: 'active' },
                });
                for (const source of sources) {
                    const config = (source.config_json ?? {});
                    config.match_threshold = Number(suggested_value);
                    await this.prisma.opportunitySource.update({
                        where: { id: source.id },
                        data: { config_json: JSON.parse(JSON.stringify(config)) },
                    });
                }
                return true;
            }
            this.logger.warn(`未支持的自动应用配置: ${table}.${field}`);
            return false;
        }
        catch (error) {
            this.logger.warn(`自动应用失败（可能表未迁移）: ${error.message}`);
            return false;
        }
    }
    // ========== 基准数据 ==========
    getBaselineSuggestions() {
        const now = new Date().toISOString();
        return [
            {
                id: 'opt_001',
                metric_name: '平均利润率',
                problem_description: '平均利润率当前为55.8%，低于目标值60%，差距4.2个百分点（7.0%）。趋势：下降。',
                current_value: 55.8,
                target_value: 60,
                suggestion_type: 'quote_adjustment',
                suggestion_detail: '当前报价利润率为30%，建议提升至35%。同时建议采用三档分层报价法（基础/标准/高级），标准版定价为成本的2.5倍。严格执行报价审核Checklist，确保成本估算包含调试、沟通、测试等隐性成本。根据经验「报价策略调整」，分层报价使客单价提升22%。',
                expected_improvement: '预计平均利润率从55.8%提升至60.8%，客单价提升约15-20%',
                confidence: 0.85,
                related_experience_ids: ['exp_006', 'exp_015'],
                auto_applicable: true,
                target_config: { table: 'QuoteRule', field: 'profit_margin', current_value: 0.3, suggested_value: 0.35 },
                created_at: '2026-09-04T08:00:00.000Z',
                status: 'pending',
            },
            {
                id: 'opt_002',
                metric_name: '交付准时率',
                problem_description: '交付准时率当前为76.4%，低于目标值85%，差距8.6个百分点（10.1%）。趋势：下降。',
                current_value: 76.4,
                target_value: 85,
                suggestion_type: 'process_change',
                suggestion_detail: '建议严格执行标准化项目交付SOP：1）需求阶段必须细化到可估工时的功能点粒度，客户签字确认后才进入开发；2）每个模块独立排期，设置模块级里程碑；3）技术不确定性高的项目增加30%风险缓冲；4）每日站会同步风险，问题当天处理。根据经验「标准化项目交付流程SOP」，执行后平均交付周期18天。',
                expected_improvement: '预计交付准时率从76.4%提升至84.4%，平均交付周期缩短约15%',
                confidence: 0.76,
                related_experience_ids: ['exp_013', 'exp_011'],
                auto_applicable: false,
                target_config: null,
                created_at: '2026-09-04T08:00:00.000Z',
                status: 'pending',
            },
            {
                id: 'opt_003',
                metric_name: '商机转化率',
                problem_description: '商机转化率当前为14.06%，低于目标值20%，差距5.94个百分点（29.7%）。趋势：上升但未达标。',
                current_value: 14.06,
                target_value: 20,
                suggestion_type: 'threshold_adjustment',
                suggestion_detail: '商机筛选阈值当前为70分，建议降至65分，同时增加profit_score>=55的辅助条件。根据经验「商机筛选优化」，阈值从75降至70后转化率提升了2个百分点，商机池量增加35%。适度放宽筛选+多维度评估优于单一严格阈值。另外建议在首次沟通时强制确认预算范围，避免无预算商机浪费时间（参考失败教训exp_012）。',
                expected_improvement: '预计商机转化率从14.06%提升至16.5%，商机池量增加约30%',
                confidence: 0.82,
                related_experience_ids: ['exp_005', 'exp_012'],
                auto_applicable: true,
                target_config: { table: 'OpportunitySource', field: 'match_threshold', current_value: 70, suggested_value: 65 },
                created_at: '2026-09-04T08:00:00.000Z',
                status: 'pending',
            },
            {
                id: 'opt_004',
                metric_name: '代码质量分',
                problem_description: '代码质量分当前为82.3，低于目标值85，差距2.7分（3.2%）。趋势：上升但未达标。',
                current_value: 82.3,
                target_value: 85,
                suggestion_type: 'prompt_optimization',
                suggestion_detail: '建议优化代码生成提示词：1）增加"必须编写单元测试，覆盖率>=70%"的强制要求；2）增加代码review自检步骤，提交前检测常见问题（未处理异常、硬编码、魔法数字等）；3）引入质量门禁，quality_score<80的提交自动触发重写；4）建议启动代码生成提示词的A/B测试，对比v1.1（当前）与v1.2（增加测试要求）的效果。',
                expected_improvement: '预计代码质量分从82.3提升至86.3，测试通过率提升约10%',
                confidence: 0.72,
                related_experience_ids: [],
                auto_applicable: false,
                target_config: null,
                created_at: '2026-09-04T08:00:00.000Z',
                status: 'pending',
            },
            {
                id: 'opt_005',
                metric_name: '客户成交率',
                problem_description: '客户成交率当前为31.25%，低于目标值35%，差距3.75个百分点（10.7%）。趋势：平稳。',
                current_value: 31.25,
                target_value: 35,
                suggestion_type: 'process_change',
                suggestion_detail: '建议：1）启用AI回复模板系统，覆盖询价、需求确认、进度汇报、问题处理等10类常见场景，采用AI生成初稿+人工审核模式；2）设置工作时间15分钟内必回的SLA；3）对A级客户开通专属沟通通道，2小时响应；4）实施客户分级管理策略，差异化服务。根据经验「客户沟通模板化」，响应时间从2小时降至15分钟后成交率提升8%。',
                expected_improvement: '预计客户成交率从31.25%提升至36.25%，客户满意度提升约9%',
                confidence: 0.78,
                related_experience_ids: ['exp_007', 'exp_014'],
                auto_applicable: false,
                target_config: null,
                created_at: '2026-09-04T08:00:00.000Z',
                status: 'pending',
            },
        ];
    }
};
exports.OptimizationService = OptimizationService;
exports.OptimizationService = OptimizationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        metric_service_1.MetricService,
        experience_service_1.ExperienceService])
], OptimizationService);
//# sourceMappingURL=optimization.service.js.map