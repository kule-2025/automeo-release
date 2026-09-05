"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsModule = void 0;
const common_1 = require("@nestjs/common");
const analytics_controller_1 = require("./controllers/analytics.controller");
const dashboard_service_1 = require("./services/dashboard.service");
const conversion_service_1 = require("./services/conversion.service");
const project_analysis_service_1 = require("./services/project-analysis.service");
const cost_analysis_service_1 = require("./services/cost-analysis.service");
const efficiency_service_1 = require("./services/efficiency.service");
const prisma_service_1 = require("../../prisma/prisma.service");
let AnalyticsModule = class AnalyticsModule {
};
exports.AnalyticsModule = AnalyticsModule;
exports.AnalyticsModule = AnalyticsModule = __decorate([
    (0, common_1.Module)({
        controllers: [analytics_controller_1.AnalyticsController],
        providers: [
            dashboard_service_1.DashboardService,
            conversion_service_1.ConversionService,
            project_analysis_service_1.ProjectAnalysisService,
            cost_analysis_service_1.CostAnalysisService,
            efficiency_service_1.EfficiencyService,
            prisma_service_1.PrismaService,
        ],
        exports: [dashboard_service_1.DashboardService, conversion_service_1.ConversionService],
    })
], AnalyticsModule);
//# sourceMappingURL=analytics.module.js.map