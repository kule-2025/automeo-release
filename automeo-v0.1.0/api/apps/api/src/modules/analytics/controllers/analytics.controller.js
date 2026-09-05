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
exports.AnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const dashboard_service_1 = require("../services/dashboard.service");
const conversion_service_1 = require("../services/conversion.service");
const project_analysis_service_1 = require("../services/project-analysis.service");
const cost_analysis_service_1 = require("../services/cost-analysis.service");
const efficiency_service_1 = require("../services/efficiency.service");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
let AnalyticsController = class AnalyticsController {
    constructor(dashboardService, conversionService, projectAnalysis, costAnalysis, efficiencyService) {
        this.dashboardService = dashboardService;
        this.conversionService = conversionService;
        this.projectAnalysis = projectAnalysis;
        this.costAnalysis = costAnalysis;
        this.efficiencyService = efficiencyService;
    }
    async getDashboard() {
        return this.dashboardService.getDashboard();
    }
    async getConversion() {
        return this.conversionService.getConversion();
    }
    async getProjectAnalysis() {
        return this.projectAnalysis.getProjectAnalysis();
    }
    async getCostAnalysis() {
        return this.costAnalysis.getCostAnalysis();
    }
    async getEfficiency() {
        return this.efficiencyService.getEfficiency();
    }
};
exports.AnalyticsController = AnalyticsController;
__decorate([
    (0, common_1.Get)('dashboard'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('conversion'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getConversion", null);
__decorate([
    (0, common_1.Get)('projects'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getProjectAnalysis", null);
__decorate([
    (0, common_1.Get)('costs'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getCostAnalysis", null);
__decorate([
    (0, common_1.Get)('efficiency'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getEfficiency", null);
exports.AnalyticsController = AnalyticsController = __decorate([
    (0, common_1.Controller)('analytics'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [dashboard_service_1.DashboardService,
        conversion_service_1.ConversionService,
        project_analysis_service_1.ProjectAnalysisService,
        cost_analysis_service_1.CostAnalysisService,
        efficiency_service_1.EfficiencyService])
], AnalyticsController);
//# sourceMappingURL=analytics.controller.js.map