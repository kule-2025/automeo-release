"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationModule = void 0;
const common_1 = require("@nestjs/common");
const chat_controller_1 = require("./controllers/chat.controller");
const chat_service_1 = require("./services/chat.service");
const intent_router_service_1 = require("./services/intent-router.service");
const workflow_executor_service_1 = require("./services/workflow-executor.service");
const prisma_service_1 = require("../../prisma/prisma.service");
/**
 * 对话式工作流模块 (ConversationModule)
 *
 * 功能：
 * - 对话式交互界面后端支持
 * - 意图识别 → 工作流映射的调度引擎
 * - 多轮对话上下文管理
 * - 对话中调用系统功能（查询数据、触发操作、生成报表）
 *
 * 依赖：
 * - AIGatewayModule（全局模块，提供 AIGatewayService 用于 AI 意图识别）
 * - PrismaService（用于真实业务数据查询）
 *
 * 注册方式（在 app.module.ts 中添加）：
 * ```
 * import { ConversationModule } from './modules/conversation/conversation.module';
 * // ...
 * imports: [ ..., ConversationModule ]
 * ```
 */
let ConversationModule = class ConversationModule {
};
exports.ConversationModule = ConversationModule;
exports.ConversationModule = ConversationModule = __decorate([
    (0, common_1.Module)({
        controllers: [chat_controller_1.ChatController],
        providers: [
            chat_service_1.ChatService,
            intent_router_service_1.IntentRouterService,
            workflow_executor_service_1.WorkflowExecutorService,
            prisma_service_1.PrismaService,
        ],
        exports: [chat_service_1.ChatService, intent_router_service_1.IntentRouterService, workflow_executor_service_1.WorkflowExecutorService],
    })
], ConversationModule);
//# sourceMappingURL=conversation.module.js.map