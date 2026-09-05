"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentModule = void 0;
const common_1 = require("@nestjs/common");
const agent_controller_1 = require("./controllers/agent.controller");
const agent_service_1 = require("./services/agent.service");
const recruitment_service_1 = require("./services/recruitment.service");
const performance_service_1 = require("./services/performance.service");
const prisma_service_1 = require("../../prisma/prisma.service");
let AgentModule = class AgentModule {
};
exports.AgentModule = AgentModule;
exports.AgentModule = AgentModule = __decorate([
    (0, common_1.Module)({
        controllers: [agent_controller_1.AgentController],
        providers: [
            agent_service_1.AgentService,
            recruitment_service_1.RecruitmentService,
            performance_service_1.PerformanceService,
            prisma_service_1.PrismaService,
        ],
        exports: [agent_service_1.AgentService, recruitment_service_1.RecruitmentService, performance_service_1.PerformanceService],
    })
], AgentModule);
//# sourceMappingURL=agent.module.js.map