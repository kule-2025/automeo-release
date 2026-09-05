"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitorModule = void 0;
const common_1 = require("@nestjs/common");
const monitor_controller_1 = require("./controllers/monitor.controller");
const health_service_1 = require("./services/health.service");
const alert_service_1 = require("./services/alert.service");
const fallback_service_1 = require("./services/fallback.service");
const risk_service_1 = require("./services/risk.service");
const audit_service_1 = require("./services/audit.service");
const audit_guard_1 = require("./guards/audit.guard");
const prisma_service_1 = require("../../prisma/prisma.service");
let MonitorModule = class MonitorModule {
};
exports.MonitorModule = MonitorModule;
exports.MonitorModule = MonitorModule = __decorate([
    (0, common_1.Module)({
        controllers: [monitor_controller_1.MonitorController, monitor_controller_1.AlertController, monitor_controller_1.FallbackController, monitor_controller_1.LogController],
        providers: [
            health_service_1.HealthService,
            alert_service_1.AlertService,
            fallback_service_1.FallbackService,
            risk_service_1.RiskService,
            audit_service_1.AuditService,
            audit_guard_1.AuditGuard,
            prisma_service_1.PrismaService,
        ],
        exports: [health_service_1.HealthService, alert_service_1.AlertService, risk_service_1.RiskService],
    })
], MonitorModule);
//# sourceMappingURL=monitor.module.js.map