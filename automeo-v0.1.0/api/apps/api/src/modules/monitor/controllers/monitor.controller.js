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
exports.LogController = exports.FallbackController = exports.AlertController = exports.MonitorController = void 0;
const common_1 = require("@nestjs/common");
const health_service_1 = require("../services/health.service");
const alert_service_1 = require("../services/alert.service");
const fallback_service_1 = require("../services/fallback.service");
const audit_service_1 = require("../services/audit.service");
const monitor_dto_1 = require("../dto/monitor.dto");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
let MonitorController = class MonitorController {
    constructor(healthService, alertService, fallbackService, auditService) {
        this.healthService = healthService;
        this.alertService = alertService;
        this.fallbackService = fallbackService;
        this.auditService = auditService;
    }
    async getHealth() {
        return this.healthService.getHealth();
    }
    async getPipeline() {
        return this.healthService.getPipelineStatus();
    }
};
exports.MonitorController = MonitorController;
__decorate([
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MonitorController.prototype, "getHealth", null);
__decorate([
    (0, common_1.Get)('pipeline'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MonitorController.prototype, "getPipeline", null);
exports.MonitorController = MonitorController = __decorate([
    (0, common_1.Controller)('monitor'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [health_service_1.HealthService,
        alert_service_1.AlertService,
        fallback_service_1.FallbackService,
        audit_service_1.AuditService])
], MonitorController);
let AlertController = class AlertController {
    constructor(alertService) {
        this.alertService = alertService;
    }
    async getAlerts(query) {
        return this.alertService.getAlerts(query);
    }
    async handleAlert(id, dto) {
        return this.alertService.handleAlert(id, dto);
    }
};
exports.AlertController = AlertController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [monitor_dto_1.AlertQueryDto]),
    __metadata("design:returntype", Promise)
], AlertController.prototype, "getAlerts", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, monitor_dto_1.HandleAlertDto]),
    __metadata("design:returntype", Promise)
], AlertController.prototype, "handleAlert", null);
exports.AlertController = AlertController = __decorate([
    (0, common_1.Controller)('monitor/alerts'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [alert_service_1.AlertService])
], AlertController);
let FallbackController = class FallbackController {
    constructor(fallbackService) {
        this.fallbackService = fallbackService;
    }
    async getFallbackRules() {
        return this.fallbackService.getFallbackRules();
    }
    async updateFallbackRule(id, dto) {
        return this.fallbackService.updateFallbackRule(id, dto);
    }
};
exports.FallbackController = FallbackController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FallbackController.prototype, "getFallbackRules", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, monitor_dto_1.UpdateFallbackRuleDto]),
    __metadata("design:returntype", Promise)
], FallbackController.prototype, "updateFallbackRule", null);
exports.FallbackController = FallbackController = __decorate([
    (0, common_1.Controller)('monitor/fallback-rules'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [fallback_service_1.FallbackService])
], FallbackController);
let LogController = class LogController {
    constructor(auditService) {
        this.auditService = auditService;
    }
    async getLogs(query) {
        return this.auditService.getLogs(query);
    }
};
exports.LogController = LogController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [monitor_dto_1.LogQueryDto]),
    __metadata("design:returntype", Promise)
], LogController.prototype, "getLogs", null);
exports.LogController = LogController = __decorate([
    (0, common_1.Controller)('monitor/logs'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [audit_service_1.AuditService])
], LogController);
//# sourceMappingURL=monitor.controller.js.map