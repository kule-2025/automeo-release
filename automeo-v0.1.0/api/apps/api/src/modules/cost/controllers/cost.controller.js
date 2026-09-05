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
exports.CostController = void 0;
const common_1 = require("@nestjs/common");
const cost_service_1 = require("../services/cost.service");
const token_tracker_service_1 = require("../services/token-tracker.service");
const cost_allocator_service_1 = require("../services/cost-allocator.service");
const cost_dto_1 = require("../dto/cost.dto");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
let CostController = class CostController {
    constructor(costService, tokenTracker, costAllocator) {
        this.costService = costService;
        this.tokenTracker = tokenTracker;
        this.costAllocator = costAllocator;
    }
    async getOverview() {
        return this.costService.getOverview();
    }
    async getTrend(query) {
        return this.costService.getTrend(query);
    }
    async getByProject() {
        return this.costAllocator.getByProject();
    }
    async getTokenUsage(query) {
        return this.tokenTracker.getTokenUsage(query);
    }
};
exports.CostController = CostController;
__decorate([
    (0, common_1.Get)('overview'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CostController.prototype, "getOverview", null);
__decorate([
    (0, common_1.Get)('trend'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [cost_dto_1.CostTrendQueryDto]),
    __metadata("design:returntype", Promise)
], CostController.prototype, "getTrend", null);
__decorate([
    (0, common_1.Get)('by-project'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CostController.prototype, "getByProject", null);
__decorate([
    (0, common_1.Get)('token-usage'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [cost_dto_1.TokenUsageQueryDto]),
    __metadata("design:returntype", Promise)
], CostController.prototype, "getTokenUsage", null);
exports.CostController = CostController = __decorate([
    (0, common_1.Controller)('costs'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [cost_service_1.CostService,
        token_tracker_service_1.TokenTrackerService,
        cost_allocator_service_1.CostAllocatorService])
], CostController);
//# sourceMappingURL=cost.controller.js.map