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
exports.ProjectController = void 0;
const common_1 = require("@nestjs/common");
const project_service_1 = require("../services/project.service");
const progress_service_1 = require("../services/progress.service");
const project_dto_1 = require("../dto/project.dto");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
let ProjectController = class ProjectController {
    constructor(projectService, progressService) {
        this.projectService = projectService;
        this.progressService = progressService;
    }
    /**
     * GET /projects - 项目列表（支持状态筛选）
     */
    async findAll(query) {
        return this.projectService.findAll(query);
    }
    /**
     * GET /projects/stats - 项目统计
     */
    async getStats() {
        return this.projectService.getStats();
    }
    /**
     * GET /projects/:id - 项目详情
     */
    async findOne(id) {
        return this.projectService.findOne(id);
    }
    /**
     * GET /projects/:id/tasks - 看板任务列表（按状态分组）
     */
    async getTasks(id) {
        return this.projectService.getTasks(id);
    }
    /**
     * GET /projects/:id/quality - 质量报告
     */
    async getQuality(id) {
        return this.projectService.getQualityReport(id);
    }
    /**
     * GET /projects/:id/progress - 进度详情
     */
    async getProgress(id) {
        return this.projectService.getProgress(id);
    }
};
exports.ProjectController = ProjectController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [project_dto_1.ProjectListQueryDto]),
    __metadata("design:returntype", Promise)
], ProjectController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ProjectController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProjectController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/tasks'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProjectController.prototype, "getTasks", null);
__decorate([
    (0, common_1.Get)(':id/quality'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProjectController.prototype, "getQuality", null);
__decorate([
    (0, common_1.Get)(':id/progress'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProjectController.prototype, "getProgress", null);
exports.ProjectController = ProjectController = __decorate([
    (0, common_1.Controller)('projects'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [project_service_1.ProjectService,
        progress_service_1.ProgressService])
], ProjectController);
//# sourceMappingURL=project.controller.js.map