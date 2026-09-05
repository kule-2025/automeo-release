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
exports.RequirementController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const requirement_service_1 = require("../services/requirement.service");
const quote_service_1 = require("../services/quote.service");
const requirement_dto_1 = require("../dto/requirement.dto");
const quote_dto_1 = require("../dto/quote.dto");
let RequirementController = class RequirementController {
    constructor(requirementService, quoteService) {
        this.requirementService = requirementService;
        this.quoteService = quoteService;
    }
    // ===== 需求接口 =====
    /**
     * GET /requirements - 需求列表
     */
    async findAll(query) {
        return this.requirementService.findAll(query);
    }
    /**
     * GET /requirements/:id - 需求详情（含功能清单+报价）
     */
    async findOne(id) {
        return this.requirementService.findOne(id);
    }
    /**
     * POST /requirements - 创建需求草稿
     */
    async createDraft(dto) {
        return this.requirementService.createDraft(dto);
    }
    /**
     * POST /requirements/:id/confirm - 确认需求（创建项目）
     */
    async confirm(id, dto) {
        return this.requirementService.confirm(id, dto.user_id);
    }
    /**
     * GET /requirements/:id/quote - 报价明细
     */
    async getQuote(id, ruleId) {
        return this.requirementService.getQuote(id, ruleId);
    }
    /**
     * GET /requirements/:id/agreement - 合作协议 HTML
     */
    async getAgreement(id) {
        const html = await this.requirementService.getAgreement(id);
        return { html };
    }
    // ===== 报价规则接口 =====
    /**
     * GET /requirements/quote-rules - 报价规则列表
     */
    async getQuoteRules() {
        return this.quoteService.findAllRules();
    }
    /**
     * PUT /requirements/quote-rules/:id - 更新报价规则
     */
    async updateQuoteRule(id, dto) {
        return this.quoteService.updateRule(id, dto);
    }
    /**
     * POST /requirements/quote-rules/:id/preview - 报价预览
     */
    async previewQuote(id, dto) {
        return this.quoteService.previewQuote({ ...dto, rule_id: id });
    }
};
exports.RequirementController = RequirementController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [requirement_dto_1.RequirementQueryDto]),
    __metadata("design:returntype", Promise)
], RequirementController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RequirementController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [requirement_dto_1.CreateRequirementDraftDto]),
    __metadata("design:returntype", Promise)
], RequirementController.prototype, "createDraft", null);
__decorate([
    (0, common_1.Post)(':id/confirm'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, requirement_dto_1.ConfirmRequirementDto]),
    __metadata("design:returntype", Promise)
], RequirementController.prototype, "confirm", null);
__decorate([
    (0, common_1.Get)(':id/quote'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('rule_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], RequirementController.prototype, "getQuote", null);
__decorate([
    (0, common_1.Get)(':id/agreement'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RequirementController.prototype, "getAgreement", null);
__decorate([
    (0, common_1.Get)('quote-rules/list'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RequirementController.prototype, "getQuoteRules", null);
__decorate([
    (0, common_1.Put)('quote-rules/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, quote_dto_1.UpdateQuoteRuleDto]),
    __metadata("design:returntype", Promise)
], RequirementController.prototype, "updateQuoteRule", null);
__decorate([
    (0, common_1.Post)('quote-rules/:id/preview'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, quote_dto_1.PreviewQuoteDto]),
    __metadata("design:returntype", Promise)
], RequirementController.prototype, "previewQuote", null);
exports.RequirementController = RequirementController = __decorate([
    (0, common_1.Controller)('requirements'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [requirement_service_1.RequirementService,
        quote_service_1.QuoteService])
], RequirementController);
//# sourceMappingURL=requirement.controller.js.map