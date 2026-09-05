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
exports.EvolutionController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const metric_service_1 = require("../services/metric.service");
const prompt_version_service_1 = require("../services/prompt-version.service");
const ab_test_service_1 = require("../services/ab-test.service");
const optimization_service_1 = require("../services/optimization.service");
const experience_service_1 = require("../services/experience.service");
let EvolutionController = class EvolutionController {
    constructor(metricService, promptVersionService, abTestService, optimizationService, experienceService) {
        this.metricService = metricService;
        this.promptVersionService = promptVersionService;
        this.abTestService = abTestService;
        this.optimizationService = optimizationService;
        this.experienceService = experienceService;
        this.logger = new common_1.Logger('EvolutionController');
    }
    // ========== 进化指标 ==========
    /**
     * GET /evolution/metrics
     * 获取所有进化指标（含30天历史和趋势）
     */
    async getMetrics() {
        return this.metricService.getAllMetrics();
    }
    /**
     * POST /evolution/metrics/collect
     * 手动触发指标采集计算
     */
    async collectMetrics() {
        this.logger.log('手动触发指标采集');
        return this.metricService.collectAndCalculate();
    }
    // ========== 提示词版本 ==========
    /**
     * GET /evolution/prompts
     * 获取所有提示词版本，可按task_type筛选
     */
    async getPrompts(taskType) {
        return this.promptVersionService.getAll(taskType);
    }
    /**
     * GET /evolution/prompts/:id
     * 获取单个提示词版本详情
     */
    async getPrompt(id) {
        return this.promptVersionService.getById(id);
    }
    /**
     * POST /evolution/prompts
     * 创建新提示词版本
     */
    async createPrompt(dto) {
        return this.promptVersionService.create(dto);
    }
    /**
     * PUT /evolution/prompts/:id/activate
     * 激活指定提示词版本
     */
    async activatePrompt(id) {
        this.logger.log(`激活提示词版本: ${id}`);
        return this.promptVersionService.activate(id);
    }
    /**
     * PUT /evolution/prompts/:id/deactivate
     * 停用指定提示词版本
     */
    async deactivatePrompt(id) {
        return this.promptVersionService.deactivate(id);
    }
    /**
     * GET /evolution/prompts/:id/compare?compare_id=xxx
     * 版本对比
     */
    async comparePrompts(baseId, compareId) {
        return this.promptVersionService.compare(baseId, compareId);
    }
    // ========== A/B测试 ==========
    /**
     * GET /evolution/ab-test-results
     * 获取所有A/B测试结果，可按status筛选
     */
    async getABTestResults(status) {
        return this.abTestService.getAll(status);
    }
    /**
     * GET /evolution/ab-test-results/:id
     * 获取单个A/B测试详情（含统计显著性分析）
     */
    async getABTestResult(id) {
        return this.abTestService.getById(id);
    }
    /**
     * POST /evolution/prompts/:id/ab-test
     * 基于指定提示词版本启动A/B测试
     */
    async startABTest(_promptVersionId, dto) {
        this.logger.log(`启动A/B测试: ${dto.task_type}`);
        return this.abTestService.startTest(dto);
    }
    /**
     * PUT /evolution/ab-test-results/:id/end
     * 结束A/B测试并判定赢家
     */
    async endABTest(id) {
        this.logger.log(`结束A/B测试: ${id}`);
        return this.abTestService.endTest(id);
    }
    // ========== 经验库 ==========
    /**
     * GET /evolution/experiences
     * 获取经验列表，支持分类/来源/标签/关键词筛选
     */
    async getExperiences(category, source, tag, keyword) {
        const query = { category, source, tag, keyword };
        return this.experienceService.getAll(query);
    }
    /**
     * GET /evolution/experiences/:id
     * 获取单条经验详情
     */
    async getExperience(id) {
        return this.experienceService.getById(id);
    }
    /**
     * POST /evolution/experiences
     * 沉淀新经验
     */
    async createExperience(dto) {
        this.logger.log(`沉淀经验: [${dto.category}] ${dto.title}`);
        return this.experienceService.create(dto);
    }
    // ========== 自动调优 ==========
    /**
     * GET /evolution/optimizations
     * 获取调优建议列表
     */
    async getOptimizations(status) {
        return this.optimizationService.getSuggestions(status);
    }
    /**
     * POST /evolution/optimize
     * 触发自动调优分析
     */
    async optimize(dto) {
        this.logger.log(`触发自动调优: auto_apply=${dto?.auto_apply ?? false}`);
        return this.optimizationService.optimize(dto);
    }
    /**
     * PUT /evolution/optimizations/:id/apply
     * 应用单条调优建议
     */
    async applyOptimization(id) {
        this.logger.log(`应用调优建议: ${id}`);
        return this.optimizationService.applySuggestion(id);
    }
};
exports.EvolutionController = EvolutionController;
__decorate([
    (0, common_1.Get)('metrics'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EvolutionController.prototype, "getMetrics", null);
__decorate([
    (0, common_1.Post)('metrics/collect'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EvolutionController.prototype, "collectMetrics", null);
__decorate([
    (0, common_1.Get)('prompts'),
    __param(0, (0, common_1.Query)('task_type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EvolutionController.prototype, "getPrompts", null);
__decorate([
    (0, common_1.Get)('prompts/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EvolutionController.prototype, "getPrompt", null);
__decorate([
    (0, common_1.Post)('prompts'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EvolutionController.prototype, "createPrompt", null);
__decorate([
    (0, common_1.Put)('prompts/:id/activate'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EvolutionController.prototype, "activatePrompt", null);
__decorate([
    (0, common_1.Put)('prompts/:id/deactivate'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EvolutionController.prototype, "deactivatePrompt", null);
__decorate([
    (0, common_1.Get)('prompts/:id/compare'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('compare_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], EvolutionController.prototype, "comparePrompts", null);
__decorate([
    (0, common_1.Get)('ab-test-results'),
    __param(0, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EvolutionController.prototype, "getABTestResults", null);
__decorate([
    (0, common_1.Get)('ab-test-results/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EvolutionController.prototype, "getABTestResult", null);
__decorate([
    (0, common_1.Post)('prompts/:id/ab-test'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EvolutionController.prototype, "startABTest", null);
__decorate([
    (0, common_1.Put)('ab-test-results/:id/end'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EvolutionController.prototype, "endABTest", null);
__decorate([
    (0, common_1.Get)('experiences'),
    __param(0, (0, common_1.Query)('category')),
    __param(1, (0, common_1.Query)('source')),
    __param(2, (0, common_1.Query)('tag')),
    __param(3, (0, common_1.Query)('keyword')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], EvolutionController.prototype, "getExperiences", null);
__decorate([
    (0, common_1.Get)('experiences/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EvolutionController.prototype, "getExperience", null);
__decorate([
    (0, common_1.Post)('experiences'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EvolutionController.prototype, "createExperience", null);
__decorate([
    (0, common_1.Get)('optimizations'),
    __param(0, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EvolutionController.prototype, "getOptimizations", null);
__decorate([
    (0, common_1.Post)('optimize'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EvolutionController.prototype, "optimize", null);
__decorate([
    (0, common_1.Put)('optimizations/:id/apply'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EvolutionController.prototype, "applyOptimization", null);
exports.EvolutionController = EvolutionController = __decorate([
    (0, common_1.Controller)('evolution'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [metric_service_1.MetricService,
        prompt_version_service_1.PromptVersionService,
        ab_test_service_1.ABTestService,
        optimization_service_1.OptimizationService,
        experience_service_1.ExperienceService])
], EvolutionController);
//# sourceMappingURL=evolution.controller.js.map