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
exports.ReviewerAgent = void 0;
const common_1 = require("@nestjs/common");
const ai_gateway_service_1 = require("../../ai-gateway/services/ai-gateway.service");
const base_agent_1 = require("./base.agent");
/**
 * 审查Agent - 负责代码审查和质量评分
 */
let ReviewerAgent = class ReviewerAgent extends base_agent_1.BaseAgent {
    constructor(aiGateway) {
        super('ReviewerAgent');
        this.aiGateway = aiGateway;
    }
    async run(input) {
        this.log(`开始代码审查: ${input.file}`);
        const rawOutput = await this.aiGateway.reviewCode(input.code, input.file, input.projectId);
        const parsed = this.aiGateway.parseJSON(rawOutput);
        if (parsed && this.isValidReviewResult(parsed)) {
            this.log(`审查完成，总分: ${parsed.overall_score}, 通过: ${parsed.passed}`);
            return parsed;
        }
        // 解析失败时返回默认审查结果
        this.log('AI审查结果解析失败，使用默认评分');
        return this.buildDefaultResult();
    }
    isValidReviewResult(data) {
        return (typeof data.overall_score === 'number' &&
            typeof data.test_pass_rate === 'number' &&
            Array.isArray(data.issues) &&
            typeof data.scores === 'object');
    }
    buildDefaultResult() {
        return {
            scores: {
                readability: 75,
                maintainability: 72,
                security: 80,
                performance: 78,
            },
            issues: [
                {
                    severity: 'suggestion',
                    file: 'unknown',
                    line: 0,
                    description: 'AI审查结果解析异常，建议人工复核',
                    suggestion: '手动检查代码质量',
                },
            ],
            test_pass_rate: 0.85,
            test_coverage: 0.7,
            overall_score: 76,
            passed: false,
        };
    }
};
exports.ReviewerAgent = ReviewerAgent;
exports.ReviewerAgent = ReviewerAgent = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [ai_gateway_service_1.AIGatewayService])
], ReviewerAgent);
//# sourceMappingURL=reviewer.agent.js.map