"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpportunityModule = void 0;
const common_1 = require("@nestjs/common");
const opportunity_controller_1 = require("./controllers/opportunity.controller");
const source_controller_1 = require("./controllers/source.controller");
const opportunity_service_1 = require("./services/opportunity.service");
const opportunity_scorer_service_1 = require("./services/opportunity-scorer.service");
const opportunity_crawler_service_1 = require("./services/opportunity-crawler.service");
const source_service_1 = require("./services/source.service");
const prisma_service_1 = require("../../prisma/prisma.service");
let OpportunityModule = class OpportunityModule {
};
exports.OpportunityModule = OpportunityModule;
exports.OpportunityModule = OpportunityModule = __decorate([
    (0, common_1.Module)({
        controllers: [opportunity_controller_1.OpportunityController, source_controller_1.SourceController],
        providers: [
            opportunity_service_1.OpportunityService,
            opportunity_scorer_service_1.OpportunityScorerService,
            opportunity_crawler_service_1.OpportunityCrawlerService,
            source_service_1.SourceService,
            prisma_service_1.PrismaService,
        ],
        exports: [opportunity_service_1.OpportunityService, opportunity_scorer_service_1.OpportunityScorerService, opportunity_crawler_service_1.OpportunityCrawlerService],
    })
], OpportunityModule);
//# sourceMappingURL=opportunity.module.js.map