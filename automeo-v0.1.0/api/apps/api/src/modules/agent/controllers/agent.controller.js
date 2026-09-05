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
exports.AgentController = void 0;
const common_1 = require("@nestjs/common");
const agent_service_1 = require("../services/agent.service");
const recruitment_service_1 = require("../services/recruitment.service");
const performance_service_1 = require("../services/performance.service");
const agent_dto_1 = require("../dto/agent.dto");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
let AgentController = class AgentController {
    constructor(agentService, recruitmentService, performanceService) {
        this.agentService = agentService;
        this.recruitmentService = recruitmentService;
        this.performanceService = performanceService;
        this.logger = new common_1.Logger('AgentController');
    }
    // ==================== 统计 ====================
    /**
     * GET /agents/stats - 全局统计（顶部卡片）
     */
    async getStats() {
        return this.agentService.getStats();
    }
    // ==================== 角色管理 ====================
    /**
     * GET /agents/roles - 角色列表
     */
    async getRoles() {
        return this.agentService.findAllRoles();
    }
    /**
     * POST /agents/roles - 创建新角色
     */
    async createRole(body) {
        return this.agentService.createRole(body);
    }
    // ==================== 员工管理 ====================
    /**
     * GET /agents - 员工列表（支持状态/角色/关键词筛选 + 分页）
     */
    async findAll(query) {
        return this.agentService.findAll(query);
    }
    /**
     * GET /agents/:id - 员工详情
     */
    async findOne(id) {
        return this.agentService.findOne(id);
    }
    /**
     * PUT /agents/:id/status - 更新员工状态
     */
    async updateStatus(id, dto) {
        return this.agentService.updateStatus(id, dto);
    }
    /**
     * POST /agents/:id/assign - 分配员工到项目
     */
    async assign(id, dto) {
        return this.agentService.assignToProject(id, dto.project_id);
    }
    // ==================== 自动招聘 ====================
    /**
     * POST /agents/recruit/analyze - 分析招聘需求，返回匹配结果（预览，不创建）
     */
    async analyzeRecruitment(dto) {
        return this.recruitmentService.analyzeAndMatch(dto);
    }
    /**
     * POST /agents/recruit - 执行自动招聘（分析→匹配→创建员工→分配项目）
     */
    async recruit(dto) {
        this.logger.log(`收到招聘请求: task_type=${dto.task_type}, tech_stack=${dto.tech_stack.join(',')}`);
        return this.recruitmentService.executeRecruitment(dto);
    }
    // ==================== 绩效 ====================
    /**
     * GET /agents/:id/performance - 员工绩效列表
     */
    async getPerformance(id, page, pageSize) {
        return this.performanceService.getEmployeePerformance(id, page ? parseInt(page, 10) : 1, pageSize ? parseInt(pageSize, 10) : 20);
    }
    /**
     * POST /agents/performance - 记录绩效
     */
    async recordPerformance(dto) {
        return this.performanceService.recordPerformance(dto);
    }
    /**
     * GET /agents/performance/ranking - 员工绩效排名
     */
    async getRanking(limit) {
        return this.performanceService.getRanking(limit ? parseInt(limit, 10) : 20);
    }
    /**
     * GET /agents/performance/trend - 绩效趋势
     */
    async getTrend(days) {
        return this.performanceService.getPerformanceTrend(days ? parseInt(days, 10) : 14);
    }
};
exports.AgentController = AgentController;
__decorate([
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('roles'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "getRoles", null);
__decorate([
    (0, common_1.Post)('roles'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "createRole", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [agent_dto_1.AgentQueryDto]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, agent_dto_1.UpdateStatusDto]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Post)(':id/assign'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, agent_dto_1.AssignDto]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "assign", null);
__decorate([
    (0, common_1.Post)('recruit/analyze'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [agent_dto_1.RecruitDto]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "analyzeRecruitment", null);
__decorate([
    (0, common_1.Post)('recruit'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [agent_dto_1.RecruitDto]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "recruit", null);
__decorate([
    (0, common_1.Get)(':id/performance'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "getPerformance", null);
__decorate([
    (0, common_1.Post)('performance'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [agent_dto_1.PerformanceDto]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "recordPerformance", null);
__decorate([
    (0, common_1.Get)('performance/ranking'),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "getRanking", null);
__decorate([
    (0, common_1.Get)('performance/trend'),
    __param(0, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AgentController.prototype, "getTrend", null);
exports.AgentController = AgentController = __decorate([
    (0, common_1.Controller)('agents'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [agent_service_1.AgentService,
        recruitment_service_1.RecruitmentService,
        performance_service_1.PerformanceService])
], AgentController);
//# sourceMappingURL=agent.controller.js.map