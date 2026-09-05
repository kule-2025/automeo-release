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
exports.CustomerController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const customer_service_1 = require("../services/customer.service");
const auto_contact_service_1 = require("../services/auto-contact.service");
const chat_agent_service_1 = require("../services/chat-agent.service");
const customer_dto_1 = require("../dto/customer.dto");
let CustomerController = class CustomerController {
    constructor(customerService, autoContactService, chatAgentService) {
        this.customerService = customerService;
        this.autoContactService = autoContactService;
        this.chatAgentService = chatAgentService;
    }
    /**
     * GET /customers - 客户列表
     */
    async findAll(query) {
        return this.customerService.findAll(query);
    }
    /**
     * GET /customers/stats - 客户统计
     */
    async getStats() {
        return this.customerService.getStats();
    }
    /**
     * GET /customers/:id - 客户详情（含画像）
     */
    async findOne(id) {
        return this.customerService.findOne(id);
    }
    /**
     * GET /customers/:id/communications - 沟通记录
     */
    async getCommunications(id, page, pageSize) {
        return this.customerService.getCommunications(id, page ? parseInt(page, 10) : 1, pageSize ? parseInt(pageSize, 10) : 50);
    }
    /**
     * GET /customers/:id/analysis - 客户分析
     */
    async getAnalysis(id) {
        return this.customerService.getAnalysis(id);
    }
    /**
     * POST /customers - 从商机创建客户
     */
    async createFromOpportunity(dto) {
        return this.customerService.createFromOpportunity(dto.opportunity_id, dto.name, dto.contact);
    }
    /**
     * POST /customers/:id/first-message - 发送开场白
     */
    async sendFirstMessage(id) {
        return this.autoContactService.sendFirstMessage(id);
    }
    /**
     * POST /customers/:id/messages - 发送消息
     */
    async sendMessage(id, dto) {
        return this.autoContactService.sendMessage(id, dto.content);
    }
    /**
     * POST /customers/:id/reply - 处理客户回复（AI自动应答）
     */
    async handleReply(id, dto) {
        return this.chatAgentService.handleReply(id, dto.content);
    }
};
exports.CustomerController = CustomerController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [customer_dto_1.CustomerQueryDto]),
    __metadata("design:returntype", Promise)
], CustomerController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CustomerController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CustomerController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/communications'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], CustomerController.prototype, "getCommunications", null);
__decorate([
    (0, common_1.Get)(':id/analysis'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CustomerController.prototype, "getAnalysis", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [customer_dto_1.CreateCustomerFromOpportunityDto]),
    __metadata("design:returntype", Promise)
], CustomerController.prototype, "createFromOpportunity", null);
__decorate([
    (0, common_1.Post)(':id/first-message'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CustomerController.prototype, "sendFirstMessage", null);
__decorate([
    (0, common_1.Post)(':id/messages'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, customer_dto_1.SendMessageDto]),
    __metadata("design:returntype", Promise)
], CustomerController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Post)(':id/reply'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, customer_dto_1.HandleReplyDto]),
    __metadata("design:returntype", Promise)
], CustomerController.prototype, "handleReply", null);
exports.CustomerController = CustomerController = __decorate([
    (0, common_1.Controller)('customers'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [customer_service_1.CustomerService,
        auto_contact_service_1.AutoContactService,
        chat_agent_service_1.ChatAgentService])
], CustomerController);
//# sourceMappingURL=customer.controller.js.map