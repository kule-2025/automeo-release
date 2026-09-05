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
exports.ABTestService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const prompt_version_service_1 = require("./prompt-version.service");
/**
 * A/B测试服务
 * 流量分配（50/50）、结果统计、自动判定赢家、结束测试并激活赢家
 */
let ABTestService = class ABTestService {
    constructor(prisma, promptVersionService) {
        this.prisma = prisma;
        this.promptVersionService = promptVersionService;
        this.logger = new common_1.Logger('ABTestService');
    }
    /**
     * 获取所有A/B测试结果（进行中 + 已完成）
     */
    async getAll(status) {
        const all = this.getBaselineABTests();
        if (status) {
            return all.filter((t) => t.status === status);
        }
        return all;
    }
    /**
     * 获取单个测试详情
     */
    async getById(id) {
        const all = this.getBaselineABTests();
        const test = all.find((t) => t.id === id);
        if (!test) {
            throw new common_1.NotFoundException(`A/B测试 ${id} 不存在`);
        }
        // 计算统计显著性
        const { pValue, significant } = this.calculateStatisticalSignificance(test.group_a_calls ?? 0, test.group_a_success ?? 0, test.group_b_calls ?? 0, test.group_b_success ?? 0);
        const recommendation = this.generateRecommendation(test, significant);
        return {
            test,
            version_a: await this.promptVersionService.getById('prompt_opp_ab_a'),
            version_b: await this.promptVersionService.getById('prompt_opp_ab_b'),
            statistical_significance: significant,
            p_value: pValue,
            recommendation,
        };
    }
    /**
     * 启动新的A/B测试
     */
    async startTest(dto) {
        if (!dto.task_type || !dto.version_a_content || !dto.version_b_content) {
            throw new common_1.BadRequestException('task_type、version_a_content、version_b_content 为必填项');
        }
        const { version_a, version_b } = await this.promptVersionService.startABTest(dto.task_type, dto.version_a_content, dto.version_b_content, dto.variables_json);
        const now = new Date();
        const durationHours = dto.duration_hours ?? 168; // 默认7天
        const endDate = new Date(now.getTime() + durationHours * 60 * 60 * 1000);
        const test = {
            id: `abtest_${Date.now()}`,
            prompt_version_id: version_a.id,
            task_type: dto.task_type,
            total_calls: 0,
            success_count: 0,
            avg_quality_score: 0,
            avg_duration_ms: 0,
            winner_group: null,
            started_at: now.toISOString(),
            ended_at: null,
            status: 'running',
            confidence: 0,
            group_a_calls: 0,
            group_b_calls: 0,
            group_a_success: 0,
            group_b_success: 0,
        };
        this.logger.log(`启动A/B测试: ${dto.task_type}, 预计持续 ${durationHours}小时, 结束于 ${endDate.toISOString()}`);
        return { test, version_a_id: version_a.id, version_b_id: version_b.id };
    }
    /**
     * 记录一次A/B测试调用
     */
    async recordCall(testId, group, success, qualityScore, durationMs) {
        const all = this.getBaselineABTests();
        const test = all.find((t) => t.id === testId);
        if (!test) {
            throw new common_1.NotFoundException(`A/B测试 ${testId} 不存在`);
        }
        if (test.status !== 'running') {
            throw new common_1.BadRequestException('测试已结束，无法记录新调用');
        }
        test.total_calls += 1;
        if (success)
            test.success_count += 1;
        test.avg_quality_score = Number(((test.avg_quality_score * (test.total_calls - 1) + qualityScore) / test.total_calls).toFixed(2));
        test.avg_duration_ms = Number(((test.avg_duration_ms * (test.total_calls - 1) + durationMs) / test.total_calls).toFixed(0));
        if (group === 'A') {
            test.group_a_calls = (test.group_a_calls ?? 0) + 1;
            if (success)
                test.group_a_success = (test.group_a_success ?? 0) + 1;
        }
        else {
            test.group_b_calls = (test.group_b_calls ?? 0) + 1;
            if (success)
                test.group_b_success = (test.group_b_success ?? 0) + 1;
        }
        // 检查是否可以提前判定赢家
        this.checkEarlyWinner(test);
        return test;
    }
    /**
     * 结束测试并判定赢家
     */
    async endTest(testId) {
        const all = this.getBaselineABTests();
        const test = all.find((t) => t.id === testId);
        if (!test) {
            throw new common_1.NotFoundException(`A/B测试 ${testId} 不存在`);
        }
        test.status = 'completed';
        test.ended_at = new Date().toISOString();
        // 判定赢家
        const winner = this.determineWinner(test);
        test.winner_group = winner;
        if (winner) {
            this.logger.log(`A/B测试结束: ${testId}, 赢家: ${winner}组, 总调用: ${test.total_calls}`);
            // 实际应用中会激活赢家版本
        }
        else {
            this.logger.log(`A/B测试结束: ${testId}, 无显著赢家, 总调用: ${test.total_calls}`);
        }
        return test;
    }
    /**
     * 流量分配：50/50 随机分配
     */
    assignTraffic() {
        return Math.random() < 0.5 ? 'A' : 'B';
    }
    // ========== 统计方法 ==========
    /**
     * 双比例Z检验计算统计显著性
     */
    calculateStatisticalSignificance(nA, successA, nB, successB) {
        if (nA < 5 || nB < 5) {
            return { pValue: 1, significant: false };
        }
        const pA = successA / nA;
        const pB = successB / nB;
        const pPooled = (successA + successB) / (nA + nB);
        const se = Math.sqrt(pPooled * (1 - pPooled) * (1 / nA + 1 / nB));
        if (se === 0)
            return { pValue: 1, significant: false };
        const z = Math.abs(pA - pB) / se;
        // 近似p值计算（标准正态分布CDF）
        const pValue = 2 * (1 - this.normalCDF(z));
        return { pValue: Number(pValue.toFixed(4)), significant: pValue < 0.05 };
    }
    normalCDF(x) {
        const t = 1 / (1 + 0.2316419 * Math.abs(x));
        const d = 0.3989423 * Math.exp(-x * x / 2);
        const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
        return x > 0 ? 1 - prob : prob;
    }
    /**
     * 判定赢家：成功率高5%以上 或 统计显著
     */
    determineWinner(test) {
        const nA = test.group_a_calls ?? 0;
        const nB = test.group_b_calls ?? 0;
        const sA = test.group_a_success ?? 0;
        const sB = test.group_b_success ?? 0;
        if (nA < 30 || nB < 30)
            return null; // 样本量不足
        const rateA = sA / nA;
        const rateB = sB / nB;
        const diff = Math.abs(rateA - rateB);
        const { significant } = this.calculateStatisticalSignificance(nA, sA, nB, sB);
        // 成功率差5%以上 或 p<0.05
        if (diff >= 0.05 || significant) {
            return rateA > rateB ? 'A' : 'B';
        }
        return null;
    }
    /**
     * 提前终止检查：如果已经达到统计显著且样本量足够，可提前结束
     */
    checkEarlyWinner(test) {
        const nA = test.group_a_calls ?? 0;
        const nB = test.group_b_calls ?? 0;
        if (nA < 100 || nB < 100)
            return; // 至少每组100次才考虑提前终止
        const winner = this.determineWinner(test);
        if (winner) {
            test.confidence = 0.95;
            this.logger.log(`A/B测试 ${test.id} 已达到统计显著，可提前结束，赢家: ${winner}组`);
        }
    }
    generateRecommendation(test, significant) {
        if (test.status === 'running') {
            return '测试进行中，建议等待更多数据积累后再做决策。当前样本量可能不足以得出可靠结论。';
        }
        if (test.winner_group) {
            const winnerRate = test.winner_group === 'A'
                ? ((test.group_a_success ?? 0) / (test.group_a_calls ?? 1) * 100).toFixed(1)
                : ((test.group_b_success ?? 0) / (test.group_b_calls ?? 1) * 100).toFixed(1);
            return `推荐激活${test.winner_group}组版本。该组成功率 ${winnerRate}%，${significant ? '结果具有统计显著性（p<0.05）' : '成功率差异超过5%阈值'}。建议将该版本设为默认提示词。`;
        }
        return '两组无显著差异。建议保持当前版本，或设计新的测试变量进行下一轮实验。可考虑增加样本量或调整测试内容差异度。';
    }
    // ========== 基准数据 ==========
    getBaselineABTests() {
        return [
            // 进行中的测试
            {
                id: 'abtest_001',
                prompt_version_id: 'prompt_opp_ab_a',
                task_type: 'opportunity_screening',
                total_calls: 247,
                success_count: 158,
                avg_quality_score: 81.5,
                avg_duration_ms: 3200,
                winner_group: null,
                started_at: '2026-08-20T00:00:00.000Z',
                ended_at: null,
                status: 'running',
                confidence: 0.72,
                group_a_calls: 122,
                group_b_calls: 125,
                group_a_success: 71,
                group_b_success: 87,
            },
            {
                id: 'abtest_002',
                prompt_version_id: 'prompt_comm_v11',
                task_type: 'customer_communication',
                total_calls: 89,
                success_count: 52,
                avg_quality_score: 78.2,
                avg_duration_ms: 2800,
                winner_group: null,
                started_at: '2026-09-01T00:00:00.000Z',
                ended_at: null,
                status: 'running',
                confidence: 0.45,
                group_a_calls: 44,
                group_b_calls: 45,
                group_a_success: 23,
                group_b_success: 29,
            },
            {
                id: 'abtest_003',
                prompt_version_id: 'prompt_quote_v11',
                task_type: 'quote_strategy',
                total_calls: 56,
                success_count: 38,
                avg_quality_score: 85.1,
                avg_duration_ms: 4500,
                winner_group: null,
                started_at: '2026-09-03T00:00:00.000Z',
                ended_at: null,
                status: 'running',
                confidence: 0.30,
                group_a_calls: 28,
                group_b_calls: 28,
                group_a_success: 17,
                group_b_success: 21,
            },
            // 已完成的测试
            {
                id: 'abtest_004',
                prompt_version_id: 'prompt_opp_v11',
                task_type: 'opportunity_screening',
                total_calls: 512,
                success_count: 342,
                avg_quality_score: 79.8,
                avg_duration_ms: 3100,
                winner_group: 'B',
                started_at: '2026-07-15T00:00:00.000Z',
                ended_at: '2026-08-05T00:00:00.000Z',
                status: 'completed',
                confidence: 0.96,
                group_a_calls: 255,
                group_b_calls: 257,
                group_a_success: 152,
                group_b_success: 190,
            },
            {
                id: 'abtest_005',
                prompt_version_id: 'prompt_comm_v10',
                task_type: 'customer_communication',
                total_calls: 380,
                success_count: 210,
                avg_quality_score: 75.3,
                avg_duration_ms: 2600,
                winner_group: 'A',
                started_at: '2026-06-20T00:00:00.000Z',
                ended_at: '2026-07-10T00:00:00.000Z',
                status: 'completed',
                confidence: 0.91,
                group_a_calls: 190,
                group_b_calls: 190,
                group_a_success: 115,
                group_b_success: 95,
            },
            {
                id: 'abtest_006',
                prompt_version_id: 'prompt_quote_v10',
                task_type: 'quote_strategy',
                total_calls: 220,
                success_count: 130,
                avg_quality_score: 82.0,
                avg_duration_ms: 4200,
                winner_group: null,
                started_at: '2026-07-01T00:00:00.000Z',
                ended_at: '2026-07-20T00:00:00.000Z',
                status: 'completed',
                confidence: 0.55,
                group_a_calls: 110,
                group_b_calls: 110,
                group_a_success: 63,
                group_b_success: 67,
            },
            {
                id: 'abtest_007',
                prompt_version_id: 'prompt_opp_v10',
                task_type: 'opportunity_screening',
                total_calls: 680,
                success_count: 410,
                avg_quality_score: 76.5,
                avg_duration_ms: 2900,
                winner_group: 'B',
                started_at: '2026-05-15T00:00:00.000Z',
                ended_at: '2026-06-05T00:00:00.000Z',
                status: 'completed',
                confidence: 0.98,
                group_a_calls: 340,
                group_b_calls: 340,
                group_a_success: 185,
                group_b_success: 225,
            },
            {
                id: 'abtest_008',
                prompt_version_id: 'prompt_comm_v11',
                task_type: 'customer_communication',
                total_calls: 150,
                success_count: 85,
                avg_quality_score: 80.1,
                avg_duration_ms: 3000,
                winner_group: null,
                started_at: '2026-08-10T00:00:00.000Z',
                ended_at: '2026-08-25T00:00:00.000Z',
                status: 'completed',
                confidence: 0.40,
                group_a_calls: 75,
                group_b_calls: 75,
                group_a_success: 40,
                group_b_success: 45,
            },
        ];
    }
};
exports.ABTestService = ABTestService;
exports.ABTestService = ABTestService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        prompt_version_service_1.PromptVersionService])
], ABTestService);
//# sourceMappingURL=ab-test.service.js.map