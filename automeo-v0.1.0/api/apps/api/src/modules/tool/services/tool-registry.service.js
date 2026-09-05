"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolRegistryService = void 0;
const common_1 = require("@nestjs/common");
const db_query_tool_1 = require("../tools/db-query.tool");
const file_read_tool_1 = require("../tools/file-read.tool");
const file_write_tool_1 = require("../tools/file-write.tool");
const code_execute_tool_1 = require("../tools/code-execute.tool");
const web_search_tool_1 = require("../tools/web-search.tool");
const math_calculate_tool_1 = require("../tools/math-calculate.tool");
const http_request_tool_1 = require("../tools/http-request.tool");
const time_date_tool_1 = require("../tools/time-date.tool");
const system_status_tool_1 = require("../tools/system-status.tool");
const json_parse_tool_1 = require("../tools/json-parse.tool");
/**
 * 工具注册中心 - 管理所有工具的注册、查找、执行
 * 负责：参数校验(JSON Schema)、执行调度、日志记录、统计更新、错误处理
 */
let ToolRegistryService = class ToolRegistryService {
    constructor(dbQueryTool, fileReadTool, fileWriteTool, codeExecuteTool, webSearchTool, mathCalculateTool, httpRequestTool, timeDateTool, systemStatusTool, jsonParseTool) {
        this.dbQueryTool = dbQueryTool;
        this.fileReadTool = fileReadTool;
        this.fileWriteTool = fileWriteTool;
        this.codeExecuteTool = codeExecuteTool;
        this.webSearchTool = webSearchTool;
        this.mathCalculateTool = mathCalculateTool;
        this.httpRequestTool = httpRequestTool;
        this.timeDateTool = timeDateTool;
        this.systemStatusTool = systemStatusTool;
        this.jsonParseTool = jsonParseTool;
        this.logger = new common_1.Logger('ToolRegistry');
        this.tools = new Map();
        this.states = new Map();
        this.callLogs = [];
        this.maxLogs = 1000;
    }
    /**
     * 模块初始化时自动注册所有内置工具
     */
    onModuleInit() {
        const toolInstances = [
            this.dbQueryTool,
            this.fileReadTool,
            this.fileWriteTool,
            this.codeExecuteTool,
            this.webSearchTool,
            this.mathCalculateTool,
            this.httpRequestTool,
            this.timeDateTool,
            this.systemStatusTool,
            this.jsonParseTool,
        ];
        for (const tool of toolInstances) {
            this.register(tool);
        }
        this.logger.log(`工具注册中心初始化完成，共注册 ${this.tools.size} 个工具`);
    }
    /**
     * 注册工具
     */
    register(tool) {
        if (this.tools.has(tool.name)) {
            this.logger.warn(`工具 ${tool.name} 已存在，将被覆盖`);
        }
        this.tools.set(tool.name, tool);
        this.states.set(tool.name, {
            definition: tool.getDefinition(),
            is_enabled: true,
            call_count: 0,
            success_count: 0,
            total_duration_ms: 0,
            avg_duration_ms: 0,
            last_called_at: null,
            last_error: null,
        });
        this.logger.log(`注册工具: ${tool.name} (${tool.display_name})`);
    }
    /**
     * 按名称获取工具
     */
    getTool(name) {
        return this.tools.get(name);
    }
    /**
     * 获取工具运行时状态
     */
    getToolState(name) {
        return this.states.get(name);
    }
    /**
     * 列出所有工具（支持分类筛选和关键词搜索）
     */
    listTools(category, keyword) {
        let states = Array.from(this.states.values());
        if (category) {
            states = states.filter((s) => s.definition.category === category);
        }
        if (keyword) {
            const lower = keyword.toLowerCase();
            states = states.filter((s) => s.definition.name.toLowerCase().includes(lower) ||
                s.definition.display_name.toLowerCase().includes(lower) ||
                s.definition.description.toLowerCase().includes(lower));
        }
        return states;
    }
    /**
     * 获取工具统计概览
     */
    getStats() {
        const allStates = Array.from(this.states.values());
        const today = new Date().toISOString().split('T')[0];
        const todayCalls = this.callLogs.filter((log) => log.created_at.startsWith(today)).length;
        const totalCalls = allStates.reduce((sum, s) => sum + s.call_count, 0);
        const totalSuccess = allStates.reduce((sum, s) => sum + s.success_count, 0);
        return {
            total: allStates.length,
            enabled: allStates.filter((s) => s.is_enabled).length,
            disabled: allStates.filter((s) => !s.is_enabled).length,
            today_calls: todayCalls,
            total_calls: totalCalls,
            success_rate: totalCalls > 0 ? Number(((totalSuccess / totalCalls) * 100).toFixed(1)) : 100,
        };
    }
    /**
     * 启用/禁用工具
     */
    setToolEnabled(name, enabled) {
        const state = this.states.get(name);
        if (!state) {
            throw new Error(`工具不存在: ${name}`);
        }
        state.is_enabled = enabled;
        this.logger.log(`工具 ${name} 已${enabled ? '启用' : '禁用'}`);
        return state;
    }
    /**
     * 执行工具（带参数校验 + 日志记录 + 错误处理 + 超时保护）
     */
    async execute(name, parameters, caller = {}) {
        const startTime = Date.now();
        const tool = this.tools.get(name);
        const state = this.states.get(name);
        // 1. 工具存在性检查
        if (!tool || !state) {
            const result = {
                success: false,
                error: `工具不存在: ${name}`,
                duration_ms: Date.now() - startTime,
            };
            this.logCall(name, parameters, result, caller);
            return result;
        }
        // 2. 工具启用状态检查
        if (!state.is_enabled) {
            const result = {
                success: false,
                error: `工具已被禁用: ${name}`,
                duration_ms: Date.now() - startTime,
            };
            this.logCall(name, parameters, result, caller);
            this.updateStats(name, result);
            return result;
        }
        // 3. 参数校验
        const validationErrors = this.validateParameters(tool.parameters, parameters);
        if (validationErrors.length > 0) {
            const result = {
                success: false,
                error: `参数校验失败: ${validationErrors.map((e) => `${e.field}: ${e.message}`).join('; ')}`,
                duration_ms: Date.now() - startTime,
            };
            this.logCall(name, parameters, result, caller);
            this.updateStats(name, result);
            return result;
        }
        // 4. 带超时执行工具
        try {
            const data = await this.executeWithTimeout(tool, parameters, tool.timeout_ms);
            const result = {
                success: true,
                data,
                duration_ms: Date.now() - startTime,
            };
            this.logCall(name, parameters, result, caller);
            this.updateStats(name, result);
            return result;
        }
        catch (err) {
            const error = err;
            const result = {
                success: false,
                error: error.message || '工具执行失败',
                duration_ms: Date.now() - startTime,
            };
            this.logCall(name, parameters, result, caller);
            this.updateStats(name, result);
            this.logger.warn(`工具执行失败 ${name}: ${error.message}`);
            return result;
        }
    }
    /**
     * 获取调用日志（支持筛选）
     */
    getLogs(filters) {
        let logs = [...this.callLogs].reverse(); // 最新的在前
        if (filters.tool_name) {
            logs = logs.filter((l) => l.tool_name === filters.tool_name);
        }
        if (filters.success !== undefined) {
            logs = logs.filter((l) => l.success === filters.success);
        }
        if (filters.caller_type) {
            logs = logs.filter((l) => l.caller_type === filters.caller_type);
        }
        const page = filters.page ?? 1;
        const pageSize = filters.page_size ?? 20;
        const start = (page - 1) * pageSize;
        return {
            list: logs.slice(start, start + pageSize),
            total: logs.length,
            page,
            page_size: pageSize,
        };
    }
    /**
     * 获取可用于AI Function Calling的工具定义列表
     */
    getToolDefinitionsForAI(enabledOnly = true) {
        const states = enabledOnly
            ? Array.from(this.states.values()).filter((s) => s.is_enabled)
            : Array.from(this.states.values());
        return states.map((s) => s.definition);
    }
    // ===== 私有方法 =====
    /**
     * JSON Schema 参数校验
     */
    validateParameters(schema, parameters) {
        const errors = [];
        // 必填字段检查
        for (const requiredField of schema.required) {
            if (!(requiredField in parameters) || parameters[requiredField] === undefined || parameters[requiredField] === null) {
                errors.push({ field: requiredField, message: '必填字段缺失' });
            }
        }
        // 类型和约束检查
        for (const [field, propSchema] of Object.entries(schema.properties)) {
            const value = parameters[field];
            if (value === undefined || value === null)
                continue;
            // 类型检查
            switch (propSchema.type) {
                case 'string':
                    if (typeof value !== 'string') {
                        errors.push({ field, message: `期望字符串类型，实际为 ${typeof value}` });
                        continue;
                    }
                    if (propSchema.minLength !== undefined && value.length < propSchema.minLength) {
                        errors.push({ field, message: `长度不能小于 ${propSchema.minLength}` });
                    }
                    if (propSchema.maxLength !== undefined && value.length > propSchema.maxLength) {
                        errors.push({ field, message: `长度不能大于 ${propSchema.maxLength}` });
                    }
                    if (propSchema.enum && !propSchema.enum.includes(value)) {
                        errors.push({ field, message: `值必须是 ${propSchema.enum.join(' / ')} 之一` });
                    }
                    if (propSchema.pattern && !new RegExp(propSchema.pattern).test(value)) {
                        errors.push({ field, message: '格式不匹配' });
                    }
                    break;
                case 'number':
                case 'integer':
                    if (typeof value !== 'number') {
                        errors.push({ field, message: `期望数字类型，实际为 ${typeof value}` });
                        continue;
                    }
                    if (propSchema.type === 'integer' && !Number.isInteger(value)) {
                        errors.push({ field, message: '期望整数' });
                    }
                    if (propSchema.minimum !== undefined && value < propSchema.minimum) {
                        errors.push({ field, message: `值不能小于 ${propSchema.minimum}` });
                    }
                    if (propSchema.maximum !== undefined && value > propSchema.maximum) {
                        errors.push({ field, message: `值不能大于 ${propSchema.maximum}` });
                    }
                    break;
                case 'boolean':
                    if (typeof value !== 'boolean') {
                        errors.push({ field, message: `期望布尔类型，实际为 ${typeof value}` });
                    }
                    break;
                case 'object':
                    if (typeof value !== 'object' || Array.isArray(value)) {
                        errors.push({ field, message: '期望对象类型' });
                    }
                    break;
                case 'array':
                    if (!Array.isArray(value)) {
                        errors.push({ field, message: '期望数组类型' });
                    }
                    break;
            }
        }
        // 检查未知参数（不在schema中的字段）
        for (const field of Object.keys(parameters)) {
            if (!(field in schema.properties)) {
                errors.push({ field, message: '未知参数' });
            }
        }
        return errors;
    }
    /**
     * 带超时执行
     */
    async executeWithTimeout(tool, parameters, timeoutMs) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error(`工具执行超时（超过 ${timeoutMs}ms）`));
            }, timeoutMs);
            tool
                .execute(parameters)
                .then((result) => {
                clearTimeout(timer);
                resolve(result);
            })
                .catch((err) => {
                clearTimeout(timer);
                reject(err);
            });
        });
    }
    /**
     * 记录调用日志
     */
    logCall(toolName, parameters, result, caller) {
        const log = {
            id: `tcl-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
            tool_name: toolName,
            parameters_json: parameters,
            result_json: result.success ? result.data : { error: result.error },
            success: result.success,
            error_message: result.error || null,
            duration_ms: result.duration_ms,
            caller_type: caller.caller_type || 'system',
            caller_id: caller.caller_id || null,
            project_id: caller.project_id || null,
            created_at: new Date().toISOString(),
        };
        this.callLogs.push(log);
        // 限制日志数量
        if (this.callLogs.length > this.maxLogs) {
            this.callLogs.shift();
        }
    }
    /**
     * 更新工具统计
     */
    updateStats(name, result) {
        const state = this.states.get(name);
        if (!state)
            return;
        state.call_count++;
        if (result.success) {
            state.success_count++;
        }
        state.total_duration_ms += result.duration_ms;
        state.avg_duration_ms = Math.round(state.total_duration_ms / state.call_count);
        state.last_called_at = new Date().toISOString();
        state.last_error = result.success ? null : (result.error || null);
    }
};
exports.ToolRegistryService = ToolRegistryService;
exports.ToolRegistryService = ToolRegistryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [db_query_tool_1.DbQueryTool,
        file_read_tool_1.FileReadTool,
        file_write_tool_1.FileWriteTool,
        code_execute_tool_1.CodeExecuteTool,
        web_search_tool_1.WebSearchTool,
        math_calculate_tool_1.MathCalculateTool,
        http_request_tool_1.HttpRequestTool,
        time_date_tool_1.TimeDateTool,
        system_status_tool_1.SystemStatusTool,
        json_parse_tool_1.JsonParseTool])
], ToolRegistryService);
//# sourceMappingURL=tool-registry.service.js.map