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
exports.DeliveryController = void 0;
const common_1 = require("@nestjs/common");
const delivery_service_1 = require("../services/delivery.service");
const acceptance_service_1 = require("../services/acceptance.service");
const revision_service_1 = require("../services/revision.service");
const delivery_dto_1 = require("../dto/delivery.dto");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
let DeliveryController = class DeliveryController {
    constructor(deliveryService, acceptanceService, revisionService) {
        this.deliveryService = deliveryService;
        this.acceptanceService = acceptanceService;
        this.revisionService = revisionService;
    }
    /**
     * GET /deliveries - 交付列表
     */
    async findAll(query) {
        return this.deliveryService.findAll(query);
    }
    /**
     * POST /deliveries/initiate - 发起交付
     */
    async initiate(dto) {
        return this.deliveryService.initiate(dto);
    }
    /**
     * GET /deliveries/:id - 交付详情
     */
    async findOne(id) {
        return this.deliveryService.findOne(id);
    }
    /**
     * GET /deliveries/:id/files - 交付文件列表
     */
    async getFiles(id) {
        return this.deliveryService.getFiles(id);
    }
    /**
     * GET /deliveries/:id/acceptance - 验收报告
     */
    async getAcceptance(id) {
        return this.acceptanceService.getAcceptance(id);
    }
    /**
     * POST /deliveries/:id/acceptance/verify - 执行验收核对
     */
    async verifyAcceptance(id) {
        return this.acceptanceService.verify(id);
    }
    /**
     * POST /deliveries/revision - 创建修改任务
     */
    async createRevision(dto) {
        return this.revisionService.createRevision(dto);
    }
};
exports.DeliveryController = DeliveryController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [delivery_dto_1.DeliveryListQueryDto]),
    __metadata("design:returntype", Promise)
], DeliveryController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)('initiate'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [delivery_dto_1.InitiateDeliveryDto]),
    __metadata("design:returntype", Promise)
], DeliveryController.prototype, "initiate", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DeliveryController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/files'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DeliveryController.prototype, "getFiles", null);
__decorate([
    (0, common_1.Get)(':id/acceptance'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DeliveryController.prototype, "getAcceptance", null);
__decorate([
    (0, common_1.Post)(':id/acceptance/verify'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DeliveryController.prototype, "verifyAcceptance", null);
__decorate([
    (0, common_1.Post)('revision'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [delivery_dto_1.CreateRevisionDto]),
    __metadata("design:returntype", Promise)
], DeliveryController.prototype, "createRevision", null);
exports.DeliveryController = DeliveryController = __decorate([
    (0, common_1.Controller)('deliveries'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [delivery_service_1.DeliveryService,
        acceptance_service_1.AcceptanceService,
        revision_service_1.RevisionService])
], DeliveryController);
//# sourceMappingURL=delivery.controller.js.map