"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinanceModule = void 0;
const common_1 = require("@nestjs/common");
const finance_controller_1 = require("./controllers/finance.controller");
const withdraw_controller_1 = require("./controllers/withdraw.controller");
const finance_service_1 = require("./services/finance.service");
const payment_service_1 = require("./services/payment.service");
const reconciliation_service_1 = require("./services/reconciliation.service");
const invoice_service_1 = require("./services/invoice.service");
const settlement_service_1 = require("./services/settlement.service");
const withdraw_service_1 = require("./services/withdraw.service");
const prisma_service_1 = require("../../prisma/prisma.service");
let FinanceModule = class FinanceModule {
};
exports.FinanceModule = FinanceModule;
exports.FinanceModule = FinanceModule = __decorate([
    (0, common_1.Module)({
        controllers: [finance_controller_1.FinanceController, withdraw_controller_1.WithdrawController, withdraw_controller_1.InvoiceController],
        providers: [
            finance_service_1.FinanceService,
            payment_service_1.PaymentService,
            reconciliation_service_1.ReconciliationService,
            invoice_service_1.InvoiceService,
            settlement_service_1.SettlementService,
            withdraw_service_1.WithdrawService,
            prisma_service_1.PrismaService,
        ],
        exports: [finance_service_1.FinanceService, settlement_service_1.SettlementService, withdraw_service_1.WithdrawService, payment_service_1.PaymentService],
    })
], FinanceModule);
//# sourceMappingURL=finance.module.js.map