"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequirementModule = void 0;
const common_1 = require("@nestjs/common");
const requirement_controller_1 = require("./controllers/requirement.controller");
const requirement_service_1 = require("./services/requirement.service");
const requirement_parser_service_1 = require("./services/requirement-parser.service");
const wbs_service_1 = require("./services/wbs.service");
const quote_service_1 = require("./services/quote.service");
const agreement_service_1 = require("./services/agreement.service");
const prisma_service_1 = require("../../prisma/prisma.service");
let RequirementModule = class RequirementModule {
};
exports.RequirementModule = RequirementModule;
exports.RequirementModule = RequirementModule = __decorate([
    (0, common_1.Module)({
        controllers: [requirement_controller_1.RequirementController],
        providers: [
            requirement_service_1.RequirementService,
            requirement_parser_service_1.RequirementParserService,
            wbs_service_1.WbsService,
            quote_service_1.QuoteService,
            agreement_service_1.AgreementService,
            prisma_service_1.PrismaService,
        ],
        exports: [requirement_service_1.RequirementService, quote_service_1.QuoteService],
    })
], RequirementModule);
//# sourceMappingURL=requirement.module.js.map