"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvolutionModule = void 0;
const common_1 = require("@nestjs/common");
const evolution_controller_1 = require("./controllers/evolution.controller");
const metric_service_1 = require("./services/metric.service");
const prompt_version_service_1 = require("./services/prompt-version.service");
const ab_test_service_1 = require("./services/ab-test.service");
const optimization_service_1 = require("./services/optimization.service");
const experience_service_1 = require("./services/experience.service");
const prisma_service_1 = require("../../prisma/prisma.service");
let EvolutionModule = class EvolutionModule {
};
exports.EvolutionModule = EvolutionModule;
exports.EvolutionModule = EvolutionModule = __decorate([
    (0, common_1.Module)({
        controllers: [evolution_controller_1.EvolutionController],
        providers: [
            metric_service_1.MetricService,
            prompt_version_service_1.PromptVersionService,
            ab_test_service_1.ABTestService,
            optimization_service_1.OptimizationService,
            experience_service_1.ExperienceService,
            prisma_service_1.PrismaService,
        ],
        exports: [
            metric_service_1.MetricService,
            prompt_version_service_1.PromptVersionService,
            ab_test_service_1.ABTestService,
            optimization_service_1.OptimizationService,
            experience_service_1.ExperienceService,
        ],
    })
], EvolutionModule);
//# sourceMappingURL=evolution.module.js.map