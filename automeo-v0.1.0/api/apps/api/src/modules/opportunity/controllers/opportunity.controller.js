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
exports.OpportunityController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const opportunity_service_1 = require("../services/opportunity.service");
const opportunity_scorer_service_1 = require("../services/opportunity-scorer.service");
const opportunity_dto_1 = require("../dto/opportunity.dto");
let OpportunityController = class OpportunityController {
    constructor(opportunityService, scorerService) {
        this.opportunityService = opportunityService;
        this.scorerService = scorerService;
    }
    /**
     * GET /opportunities - 商机列表（分页、筛选、排序）
     */
    async findAll(query) {
        return this.opportunityService.findAll(query);
    }
    /**
     * GET /opportunities/stats - 商机统计
     */
    async getStats() {
        return this.opportunityService.getStats();
    }
    /**
     * GET /opportunities/:id - 商机详情
     */
    async findOne(id) {
        return this.opportunityService.findOne(id);
    }
    /**
     * POST /opportunities/:id/score - 触发商机评分
     */
    async score(id) {
        return this.scorerService.scoreOpportunity(id);
    }
};
exports.OpportunityController = OpportunityController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [opportunity_dto_1.OpportunityQueryDto]),
    __metadata("design:returntype", Promise)
], OpportunityController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], OpportunityController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OpportunityController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/score'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OpportunityController.prototype, "score", null);
exports.OpportunityController = OpportunityController = __decorate([
    (0, common_1.Controller)('opportunities'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [opportunity_service_1.OpportunityService,
        opportunity_scorer_service_1.OpportunityScorerService])
], OpportunityController);
//# sourceMappingURL=opportunity.controller.js.map