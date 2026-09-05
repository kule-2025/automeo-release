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
exports.ResourceController = void 0;
const common_1 = require("@nestjs/common");
const compute_manager_service_1 = require("../services/compute-manager.service");
const cost_dto_1 = require("../dto/cost.dto");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
let ResourceController = class ResourceController {
    constructor(computeManager) {
        this.computeManager = computeManager;
    }
    async getResources() {
        return this.computeManager.getResources();
    }
    async updateResource(id, dto) {
        return this.computeManager.updateResource(id, dto);
    }
};
exports.ResourceController = ResourceController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ResourceController.prototype, "getResources", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, cost_dto_1.UpdateResourceDto]),
    __metadata("design:returntype", Promise)
], ResourceController.prototype, "updateResource", null);
exports.ResourceController = ResourceController = __decorate([
    (0, common_1.Controller)('costs/resources'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [compute_manager_service_1.ComputeManagerService])
], ResourceController);
//# sourceMappingURL=resource.controller.js.map