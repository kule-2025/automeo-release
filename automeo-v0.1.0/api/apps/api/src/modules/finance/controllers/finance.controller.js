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
exports.FinanceController = void 0;
const common_1 = require("@nestjs/common");
const finance_service_1 = require("../services/finance.service");
const settlement_service_1 = require("../services/settlement.service");
const finance_dto_1 = require("../dto/finance.dto");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../../common/decorators/current-user.decorator");
let FinanceController = class FinanceController {
    constructor(financeService, settlementService) {
        this.financeService = financeService;
        this.settlementService = settlementService;
    }
    async getOverview(userId) {
        return this.financeService.getOverview(userId);
    }
    async getTransactions(userId, query) {
        return this.financeService.getTransactions(userId, query);
    }
    async getSettlements(query) {
        return this.settlementService.getSettlements(query);
    }
    async createReceivable(userId, dto) {
        return this.financeService.createReceivable(userId, dto);
    }
    async settleProject(projectId) {
        return this.settlementService.settle(projectId);
    }
};
exports.FinanceController = FinanceController;
__decorate([
    (0, common_1.Get)('overview'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "getOverview", null);
__decorate([
    (0, common_1.Get)('transactions'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, finance_dto_1.TransactionQueryDto]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "getTransactions", null);
__decorate([
    (0, common_1.Get)('settlements'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [finance_dto_1.SettlementQueryDto]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "getSettlements", null);
__decorate([
    (0, common_1.Post)('receivable'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, finance_dto_1.CreateReceivableDto]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "createReceivable", null);
__decorate([
    (0, common_1.Post)('settle/:projectId'),
    __param(0, (0, common_1.Param)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "settleProject", null);
exports.FinanceController = FinanceController = __decorate([
    (0, common_1.Controller)('finance'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [finance_service_1.FinanceService,
        settlement_service_1.SettlementService])
], FinanceController);
//# sourceMappingURL=finance.controller.js.map