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
exports.ProgressDetailDto = exports.QualityReportDto = exports.SubmissionDto = exports.TaskCardDto = exports.TaskBoardDto = exports.TaskListQueryDto = void 0;
const class_validator_1 = require("class-validator");
const shared_1 = require("../../../../../../packages/shared/src");
class TaskListQueryDto {
}
exports.TaskListQueryDto = TaskListQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(Object.values(shared_1.TaskStatus)),
    __metadata("design:type", String)
], TaskListQueryDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(4),
    __metadata("design:type", Number)
], TaskListQueryDto.prototype, "priority", void 0);
class TaskBoardDto {
}
exports.TaskBoardDto = TaskBoardDto;
class TaskCardDto {
}
exports.TaskCardDto = TaskCardDto;
class SubmissionDto {
}
exports.SubmissionDto = SubmissionDto;
class QualityReportDto {
}
exports.QualityReportDto = QualityReportDto;
class ProgressDetailDto {
}
exports.ProgressDetailDto = ProgressDetailDto;
//# sourceMappingURL=task.dto.js.map