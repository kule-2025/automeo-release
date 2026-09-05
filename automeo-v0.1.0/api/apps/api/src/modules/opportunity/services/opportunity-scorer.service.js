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
exports.OpportunityScorerService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const ai_gateway_service_1 = require("../../ai-gateway/services/ai-gateway.service");
const shared_1 = require("../../../../../../packages/shared/src");
/**
 * 商机评分服务
 * 调用 AI 网关分析商机，计算匹配度和盈利评分，自动决策
 */
let OpportunityScorerService = class OpportunityScorerService {
    constructor(prisma, aiGateway) {
        this.prisma = prisma;
        this.aiGateway = aiGateway;
        this.logger = new common_1.Logger('OpportunityScorer');
    }
    /**
     * 对单个商机进行评分
     * match_score = 技术匹配40% + 预算匹配30% + 工期匹配30%
     * profit_score = 基于预估金额和预估成本的盈利评分
     * 自动决策：match_score >= 70 且 profit_score >= 60 → claimed
     */
    async scoreOpportunity(opportunityId) {
        const opportunity = await this.prisma.opportunity.findUnique({
            where: { id: opportunityId },
        });
        if (!opportunity) {
            throw new Error('商机不存在');
        }
        // 标记为评分中
        await this.prisma.opportunity.update({
            where: { id: opportunityId },
            data: { status: shared_1.OpportunityStatus.SCORING },
        });
        try {
            // 调用 AI 网关分析
            const aiContent = await this.aiGateway.analyzeOpportunity(opportunity.title, opportunity.description || '', {
                source_platform: opportunity.source_platform,
                estimated_amount: opportunity.estimated_amount?.toString() || '未知',
                author: opportunity.author || '未知',
            });
            // 解析 AI 返回的结构化评分
            const parsed = this.aiGateway.parseJSON(aiContent);
            let matchScore;
            let profitScore;
            let analysis;
            if (parsed && typeof parsed.match_score === 'number') {
                matchScore = Math.min(100, Math.max(0, Math.round(parsed.match_score)));
                profitScore = Math.min(100, Math.max(0, Math.round(parsed.profit_score || 50)));
                analysis = parsed.analysis || aiContent;
            }
            else {
                // AI 返回非结构化时，基于规则计算兜底评分
                const fallback = this.calculateFallbackScore(opportunity.title, opportunity.description || '');
                matchScore = fallback.match_score;
                profitScore = fallback.profit_score;
                analysis = aiContent || fallback.analysis;
            }
            // 自动决策：匹配度≥70 且 盈利评分≥60 → 自动认领
            const autoClaimed = matchScore >= 70 && profitScore >= 60;
            const newStatus = autoClaimed ? shared_1.OpportunityStatus.CLAIMED : shared_1.OpportunityStatus.EVALUATING;
            await this.prisma.opportunity.update({
                where: { id: opportunityId },
                data: {
                    match_score: matchScore,
                    profit_score: profitScore,
                    analysis,
                    status: newStatus,
                },
            });
            this.logger.log(`商机评分完成 id=${opportunityId} match=${matchScore} profit=${profitScore} auto_claimed=${autoClaimed}`);
            return { match_score: matchScore, profit_score: profitScore, analysis, auto_claimed: autoClaimed };
        }
        catch (error) {
            // 评分失败，回退为评估中
            await this.prisma.opportunity.update({
                where: { id: opportunityId },
                data: { status: shared_1.OpportunityStatus.EVALUATING },
            });
            this.logger.error(`商机评分失败 id=${opportunityId}: ${error.message}`);
            throw error;
        }
    }
    /**
     * 批量评分新商机
     */
    async scoreNewOpportunities(limit = 10) {
        const newOpps = await this.prisma.opportunity.findMany({
            where: { status: shared_1.OpportunityStatus.NEW },
            orderBy: { found_at: 'desc' },
            take: limit,
        });
        let scored = 0;
        for (const opp of newOpps) {
            try {
                await this.scoreOpportunity(opp.id);
                scored++;
            }
            catch (error) {
                this.logger.warn(`批量评分跳过 id=${opp.id}: ${error.message}`);
            }
        }
        return scored;
    }
    /**
     * 基于规则的兜底评分（AI 不可用时）
     */
    calculateFallbackScore(title, description) {
        const text = `${title} ${description}`.toLowerCase();
        // 技术匹配关键词
        const techKeywords = ['react', 'vue', 'node', 'typescript', 'python', 'java', 'go', '小程序', 'app', 'web', '前端', '后端', '全栈'];
        const techHits = techKeywords.filter((k) => text.includes(k)).length;
        const techMatch = Math.min(100, 40 + techHits * 8);
        // 预算匹配（有明确金额关键词加分）
        const budgetKeywords = ['预算', '报价', '价格', '费用', '元', '万', 'k$', '$'];
        const budgetHits = budgetKeywords.filter((k) => text.includes(k)).length;
        const budgetMatch = Math.min(100, 30 + budgetHits * 15);
        // 工期匹配（有明确时间关键词加分）
        const timeKeywords = ['工期', '周期', 'deadline', '上线', '交付', '周', '月', '天'];
        const timeHits = timeKeywords.filter((k) => text.includes(k)).length;
        const timeMatch = Math.min(100, 30 + timeHits * 12);
        const matchScore = Math.round(techMatch * 0.4 + budgetMatch * 0.3 + timeMatch * 0.3);
        // 盈利评分：基于描述完整度和金额线索
        const descLength = description.length;
        let profitScore = 40;
        if (descLength > 100)
            profitScore += 10;
        if (descLength > 300)
            profitScore += 10;
        if (budgetHits > 0)
            profitScore += 15;
        if (techHits >= 2)
            profitScore += 10;
        profitScore = Math.min(100, profitScore);
        return {
            match_score: matchScore,
            profit_score: profitScore,
            analysis: `[规则兜底评分] 技术匹配:${techMatch}/100, 预算匹配:${budgetMatch}/100, 工期匹配:${timeMatch}/100。描述长度:${descLength}字符。`,
        };
    }
};
exports.OpportunityScorerService = OpportunityScorerService;
exports.OpportunityScorerService = OpportunityScorerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ai_gateway_service_1.AIGatewayService])
], OpportunityScorerService);
//# sourceMappingURL=opportunity-scorer.service.js.map