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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolController = void 0;
const common_1 = require("@nestjs/common");
const tool_registry_service_1 = require("../services/tool-registry.service");
const tool_dto_1 = require("../dto/tool.dto");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
/**
 * 工具中心控制器 - 工具列表、详情、启用/禁用、调用日志、手动执行
 */
let ToolController = class ToolController {
    constructor(registry) {
        this.registry = registry;
    }
    /**
     * GET /tools - 获取工具列表（支持分类筛选和关键词搜索）
     */
    async getTools(query) {
        const tools = this.registry.listTools(query.category, query.keyword);
        const stats = this.registry.getStats();
        // 按分类分组
        const grouped = {};
        for (const tool of tools) {
            const category = tool.definition.category;
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(tool);
        }
        return {
            list: tools,
            grouped,
            stats,
            total: tools.length,
            page: query.page,
            page_size: query.page_size,
        };
    }
    /**
     * GET /tools/stats - 获取工具统计概览
     */
    async getStats() {
        return this.registry.getStats();
    }
    /**
     * GET /tools/logs - 获取工具调用日志
     */
    async getLogs(query) {
        return this.registry.getLogs({
            tool_name: query.tool_name,
            success: query.success,
            caller_type: query.caller_type,
            page: query.page,
            page_size: query.page_size,
        });
    }
    /**
     * GET /tools/:name - 获取工具详情
     */
    async getTool(name) {
        const state = this.registry.getToolState(name);
        if (!state) {
            throw new common_1.NotFoundException(`工具不存在: ${name}`);
        }
        return state;
    }
    /**
     * PUT /tools/:name - 更新工具状态（启用/禁用）
     */
    async updateTool(name, dto) {
        const state = this.registry.getToolState(name);
        if (!state) {
            throw new common_1.NotFoundException(`工具不存在: ${name}`);
        }
        if (dto.is_enabled !== undefined) {
            return this.registry.setToolEnabled(name, dto.is_enabled);
        }
        return state;
    }
    /**
     * POST /tools/:name/execute - 手动执行工具（用于测试）
     */
    async executeTool(name, dto) {
        if (!dto.parameters || typeof dto.parameters !== 'object') {
            throw new common_1.BadRequestException('parameters 必须是对象');
        }
        const result = await this.registry.execute(name, dto.parameters, {
            caller_type: dto.caller_type || 'manual',
            caller_id: dto.caller_id,
            project_id: dto.project_id,
        });
        if (!result.success) {
            // 不抛异常，返回错误信息让前端展示
            return {
                success: false,
                error: result.error,
                duration_ms: result.duration_ms,
            };
        }
        return {
            success: true,
            data: result.data,
            duration_ms: result.duration_ms,
        };
    }
};
exports.ToolController = ToolController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [tool_dto_1.ToolQueryDto]),
    __metadata("design:returntype", Promise)
], ToolController.prototype, "getTools", null);
__decorate([
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ToolController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('logs'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [tool_dto_1.ToolLogDto]),
    __metadata("design:returntype", Promise)
], ToolController.prototype, "getLogs", null);
__decorate([
    (0, common_1.Get)(':name'),
    __param(0, (0, common_1.Param)('name')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ToolController.prototype, "getTool", null);
__decorate([
    (0, common_1.Put)(':name'),
    __param(0, (0, common_1.Param)('name')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, tool_dto_1.UpdateToolDto]),
    __metadata("design:returntype", Promise)
], ToolController.prototype, "updateTool", null);
__decorate([
    (0, common_1.Post)(':name/execute'),
    __param(0, (0, common_1.Param)('name')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, tool_dto_1.ExecuteToolDto]),
    __metadata("design:returntype", Promise)
], ToolController.prototype, "executeTool", null);
exports.ToolController = ToolController = __decorate([
    (0, common_1.Controller)('tools'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [tool_registry_service_1.ToolRegistryService])
], ToolController);
//# sourceMappingURL=tool.controller.js.map