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
exports.CreateRevisionDto = exports.InitiateDeliveryDto = exports.AcceptanceReportDto = exports.AcceptanceItemDto = exports.DeliveryFileDto = exports.DeliveryListQueryDto = void 0;
const class_validator_1 = require("class-validator");
const shared_1 = require("../../../../../../packages/shared/src");
class DeliveryListQueryDto {
    constructor() {
        this.page = 1;
        this.pageSize = 20;
    }
}
exports.DeliveryListQueryDto = DeliveryListQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(Object.values(shared_1.DeliveryStatus)),
    __metadata("design:type", String)
], DeliveryListQueryDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DeliveryListQueryDto.prototype, "project_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], DeliveryListQueryDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], DeliveryListQueryDto.prototype, "pageSize", void 0);
class DeliveryFileDto {
}
exports.DeliveryFileDto = DeliveryFileDto;
class AcceptanceItemDto {
}
exports.AcceptanceItemDto = AcceptanceItemDto;
class AcceptanceReportDto {
}
exports.AcceptanceReportDto = AcceptanceReportDto;
class InitiateDeliveryDto {
}
exports.InitiateDeliveryDto = InitiateDeliveryDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InitiateDeliveryDto.prototype, "project_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InitiateDeliveryDto.prototype, "version", void 0);
class CreateRevisionDto {
}
exports.CreateRevisionDto = CreateRevisionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRevisionDto.prototype, "delivery_id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRevisionDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRevisionDto.prototype, "requirement_item_id", void 0);
//# sourceMappingURL=delivery.dto.js.map