"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolModule = void 0;
const common_1 = require("@nestjs/common");
const tool_controller_1 = require("./controllers/tool.controller");
const tool_registry_service_1 = require("./services/tool-registry.service");
const db_query_tool_1 = require("./tools/db-query.tool");
const file_read_tool_1 = require("./tools/file-read.tool");
const file_write_tool_1 = require("./tools/file-write.tool");
const code_execute_tool_1 = require("./tools/code-execute.tool");
const web_search_tool_1 = require("./tools/web-search.tool");
const math_calculate_tool_1 = require("./tools/math-calculate.tool");
const http_request_tool_1 = require("./tools/http-request.tool");
const time_date_tool_1 = require("./tools/time-date.tool");
const system_status_tool_1 = require("./tools/system-status.tool");
const json_parse_tool_1 = require("./tools/json-parse.tool");
/**
 * 工具模块 - Tool Use / Function Calling 核心基础设施
 *
 * 提供：
 * - 工具注册中心（注册、查找、执行、统计）
 * - 10种内置工具实现
 * - 工具管理API（列表/详情/启用禁用/日志/手动执行）
 *
 * 全局模块，其他模块可直接注入ToolRegistryService使用
 */
let ToolModule = class ToolModule {
};
exports.ToolModule = ToolModule;
exports.ToolModule = ToolModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        controllers: [tool_controller_1.ToolController],
        providers: [
            // 注册中心
            tool_registry_service_1.ToolRegistryService,
            // 10种工具实现
            db_query_tool_1.DbQueryTool,
            file_read_tool_1.FileReadTool,
            file_write_tool_1.FileWriteTool,
            code_execute_tool_1.CodeExecuteTool,
            web_search_tool_1.WebSearchTool,
            math_calculate_tool_1.MathCalculateTool,
            http_request_tool_1.HttpRequestTool,
            time_date_tool_1.TimeDateTool,
            system_status_tool_1.SystemStatusTool,
            json_parse_tool_1.JsonParseTool,
        ],
        exports: [tool_registry_service_1.ToolRegistryService],
    })
], ToolModule);
//# sourceMappingURL=tool.module.js.map