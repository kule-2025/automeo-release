"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelRouterService = void 0;
const common_1 = require("@nestjs/common");
const shared_1 = require("../../../../../../packages/shared/src");
/**
 * 模型路由服务 - 按任务类型选择合适能力的模型
 */
let ModelRouterService = class ModelRouterService {
    constructor() {
        this.logger = new common_1.Logger('ModelRouter');
        this.taskCapabilityMap = {
            [shared_1.AITaskType.CODE_GENERATION]: shared_1.ModelCapability.HIGH,
            [shared_1.AITaskType.CODE_REVIEW]: shared_1.ModelCapability.HIGH,
            [shared_1.AITaskType.TASK_DECOMPOSITION]: shared_1.ModelCapability.HIGH,
            [shared_1.AITaskType.IMPLEMENTATION_VERIFY]: shared_1.ModelCapability.HIGH,
            [shared_1.AITaskType.OPPORTUNITY_ANALYSIS]: shared_1.ModelCapability.MEDIUM,
            [shared_1.AITaskType.REQUIREMENT_EXTRACTION]: shared_1.ModelCapability.MEDIUM,
            [shared_1.AITaskType.INTENT_ANALYSIS]: shared_1.ModelCapability.MEDIUM,
            [shared_1.AITaskType.NEGOTIATION_REPLY]: shared_1.ModelCapability.MEDIUM,
            [shared_1.AITaskType.CHAT_REPLY]: shared_1.ModelCapability.MEDIUM,
            [shared_1.AITaskType.FIRST_MESSAGE]: shared_1.ModelCapability.MEDIUM,
            [shared_1.AITaskType.TEST_GENERATION]: shared_1.ModelCapability.LIGHT,
        };
    }
    route(taskType) {
        const capability = this.taskCapabilityMap[taskType] || shared_1.ModelCapability.MEDIUM;
        const model = this.getModelByCapability(capability);
        this.logger.debug(`任务[${taskType}]路由到模型[${model}]能力[${capability}]`);
        return { model, capability };
    }
    getModelByCapability(capability) {
        switch (capability) {
            case shared_1.ModelCapability.HIGH:
                return process.env.AI_MODEL_HIGH || 'doubao-pro-32k';
            case shared_1.ModelCapability.MEDIUM:
                return process.env.AI_MODEL_MEDIUM || 'doubao-lite-128k';
            case shared_1.ModelCapability.LIGHT:
                return process.env.AI_MODEL_LIGHT || 'doubao-lite-4k';
            default:
                return process.env.AI_MODEL_MEDIUM || 'doubao-lite-128k';
        }
    }
    getFallbackModel(currentModel) {
        const all = [
            process.env.AI_MODEL_HIGH || 'doubao-pro-32k',
            process.env.AI_MODEL_MEDIUM || 'doubao-lite-128k',
            process.env.AI_MODEL_LIGHT || 'doubao-lite-4k',
        ];
        return all.find((m) => m !== currentModel) || all[0];
    }
};
exports.ModelRouterService = ModelRouterService;
exports.ModelRouterService = ModelRouterService = __decorate([
    (0, common_1.Injectable)()
], ModelRouterService);
//# sourceMappingURL=model-router.service.js.map