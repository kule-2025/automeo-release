"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FunctionCallingModule = void 0;
const common_1 = require("@nestjs/common");
const function_calling_service_1 = require("./services/function-calling.service");
const doubao_provider_1 = require("./providers/doubao.provider");
/**
 * Function Calling 模块 - AI网关工具调用扩展
 *
 * 依赖：
 * - ToolModule（@Global，提供ToolRegistryService）
 * - DoubaoProvider（真实AI模型提供商）
 */
let FunctionCallingModule = class FunctionCallingModule {
};
exports.FunctionCallingModule = FunctionCallingModule;
exports.FunctionCallingModule = FunctionCallingModule = __decorate([
    (0, common_1.Module)({
        providers: [function_calling_service_1.FunctionCallingService, doubao_provider_1.DoubaoProvider],
        exports: [function_calling_service_1.FunctionCallingService],
    })
], FunctionCallingModule);
//# sourceMappingURL=function-calling.module.js.map