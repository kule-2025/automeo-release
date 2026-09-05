"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CostModule = void 0;
const common_1 = require("@nestjs/common");
const cost_controller_1 = require("./controllers/cost.controller");
const resource_controller_1 = require("./controllers/resource.controller");
const cost_service_1 = require("./services/cost.service");
const token_tracker_service_1 = require("./services/token-tracker.service");
const compute_manager_service_1 = require("./services/compute-manager.service");
const cost_allocator_service_1 = require("./services/cost-allocator.service");
const budget_service_1 = require("./services/budget.service");
const profit_calculator_service_1 = require("./services/profit-calculator.service");
const prisma_service_1 = require("../../prisma/prisma.service");
let CostModule = class CostModule {
};
exports.CostModule = CostModule;
exports.CostModule = CostModule = __decorate([
    (0, common_1.Module)({
        controllers: [cost_controller_1.CostController, resource_controller_1.ResourceController],
        providers: [
            cost_service_1.CostService,
            token_tracker_service_1.TokenTrackerService,
            compute_manager_service_1.ComputeManagerService,
            cost_allocator_service_1.CostAllocatorService,
            budget_service_1.BudgetService,
            profit_calculator_service_1.ProfitCalculatorService,
            prisma_service_1.PrismaService,
        ],
        exports: [cost_service_1.CostService, budget_service_1.BudgetService, profit_calculator_service_1.ProfitCalculatorService, token_tracker_service_1.TokenTrackerService],
    })
], CostModule);
//# sourceMappingURL=cost.module.js.map