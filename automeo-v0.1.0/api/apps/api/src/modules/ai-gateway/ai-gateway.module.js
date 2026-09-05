"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIGatewayModule = void 0;
const common_1 = require("@nestjs/common");
const ai_gateway_service_1 = require("./services/ai-gateway.service");
const model_router_service_1 = require("./services/model-router.service");
const token_meter_service_1 = require("./services/token-meter.service");
const fallback_service_1 = require("./services/fallback.service");
const prompt_builder_service_1 = require("./services/prompt-builder.service");
const doubao_provider_1 = require("./providers/doubao.provider");
const openai_compatible_provider_1 = require("./providers/openai-compatible.provider");
const prisma_service_1 = require("../../prisma/prisma.service");
let AIGatewayModule = class AIGatewayModule {
};
exports.AIGatewayModule = AIGatewayModule;
exports.AIGatewayModule = AIGatewayModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [
            ai_gateway_service_1.AIGatewayService,
            model_router_service_1.ModelRouterService,
            token_meter_service_1.TokenMeterService,
            fallback_service_1.FallbackService,
            prompt_builder_service_1.PromptBuilderService,
            doubao_provider_1.DoubaoProvider,
            openai_compatible_provider_1.OpenAICompatibleProvider,
            prisma_service_1.PrismaService,
        ],
        exports: [ai_gateway_service_1.AIGatewayService, token_meter_service_1.TokenMeterService, doubao_provider_1.DoubaoProvider],
    })
], AIGatewayModule);
//# sourceMappingURL=ai-gateway.module.js.map