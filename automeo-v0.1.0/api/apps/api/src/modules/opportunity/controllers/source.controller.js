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
exports.SourceController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const source_service_1 = require("../services/source.service");
const opportunity_crawler_service_1 = require("../services/opportunity-crawler.service");
const source_dto_1 = require("../dto/source.dto");
let SourceController = class SourceController {
    constructor(sourceService, crawlerService) {
        this.sourceService = sourceService;
        this.crawlerService = crawlerService;
    }
    /**
     * GET /opportunities/sources - 商机源列表
     */
    async findAll(query) {
        return this.sourceService.findAll(query.status);
    }
    /**
     * GET /opportunities/sources/platforms - 已注册爬虫平台
     */
    async getPlatforms() {
        return this.crawlerService.getRegisteredPlatforms();
    }
    /**
     * PUT /opportunities/sources/:id - 更新商机源配置
     */
    async update(id, dto) {
        return this.sourceService.update(id, dto);
    }
    /**
     * POST /opportunities/sources/:id/toggle - 切换商机源状态
     */
    async toggle(id, dto) {
        return this.sourceService.toggle(id, dto.status);
    }
    /**
     * POST /opportunities/sources/:id/crawl - 手动触发抓取
     */
    async crawl(id) {
        return this.crawlerService.triggerCrawl(id);
    }
};
exports.SourceController = SourceController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [source_dto_1.SourceQueryDto]),
    __metadata("design:returntype", Promise)
], SourceController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('platforms'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SourceController.prototype, "getPlatforms", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, source_dto_1.UpdateSourceDto]),
    __metadata("design:returntype", Promise)
], SourceController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/toggle'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, source_dto_1.ToggleSourceDto]),
    __metadata("design:returntype", Promise)
], SourceController.prototype, "toggle", null);
__decorate([
    (0, common_1.Post)(':id/crawl'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SourceController.prototype, "crawl", null);
exports.SourceController = SourceController = __decorate([
    (0, common_1.Controller)('opportunities/sources'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [source_service_1.SourceService,
        opportunity_crawler_service_1.OpportunityCrawlerService])
], SourceController);
//# sourceMappingURL=source.controller.js.map