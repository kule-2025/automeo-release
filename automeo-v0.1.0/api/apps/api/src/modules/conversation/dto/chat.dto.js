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
exports.ChatResponseDto = exports.UpdateSessionDto = exports.CreateSessionDto = exports.SendMessageDto = exports.WorkflowActionName = exports.ChatSessionStatus = exports.ChatRole = void 0;
const class_validator_1 = require("class-validator");
/**
 * 对话消息角色
 */
var ChatRole;
(function (ChatRole) {
    ChatRole["USER"] = "user";
    ChatRole["ASSISTANT"] = "assistant";
    ChatRole["SYSTEM"] = "system";
    ChatRole["TOOL"] = "tool";
})(ChatRole || (exports.ChatRole = ChatRole = {}));
/**
 * 会话状态
 */
var ChatSessionStatus;
(function (ChatSessionStatus) {
    ChatSessionStatus["ACTIVE"] = "active";
    ChatSessionStatus["ARCHIVED"] = "archived";
})(ChatSessionStatus || (exports.ChatSessionStatus = ChatSessionStatus = {}));
/**
 * 工作流动作名称
 */
var WorkflowActionName;
(function (WorkflowActionName) {
    WorkflowActionName["QUERY_OPPORTUNITIES"] = "query_opportunities";
    WorkflowActionName["QUERY_CUSTOMERS"] = "query_customers";
    WorkflowActionName["TRIGGER_COMMUNICATION"] = "trigger_communication";
    WorkflowActionName["QUERY_PROJECTS"] = "query_projects";
    WorkflowActionName["QUERY_FINANCE"] = "query_finance";
    WorkflowActionName["GENERATE_QUOTE"] = "generate_quote";
    WorkflowActionName["QUERY_QUALITY"] = "query_quality";
    WorkflowActionName["QUERY_ALERTS"] = "query_alerts";
    WorkflowActionName["GENERATE_REPORT"] = "generate_report";
    WorkflowActionName["SYSTEM_HELP"] = "system_help";
})(WorkflowActionName || (exports.WorkflowActionName = WorkflowActionName = {}));
/**
 * 发送消息 DTO
 */
class SendMessageDto {
}
exports.SendMessageDto = SendMessageDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], SendMessageDto.prototype, "content", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], SendMessageDto.prototype, "context", void 0);
/**
 * 创建会话 DTO
 */
class CreateSessionDto {
}
exports.CreateSessionDto = CreateSessionDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateSessionDto.prototype, "title", void 0);
/**
 * 更新会话 DTO（重命名/归档）
 */
class UpdateSessionDto {
}
exports.UpdateSessionDto = UpdateSessionDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], UpdateSessionDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(ChatSessionStatus),
    __metadata("design:type", String)
], UpdateSessionDto.prototype, "status", void 0);
/**
 * 聊天响应 DTO
 */
class ChatResponseDto {
}
exports.ChatResponseDto = ChatResponseDto;
//# sourceMappingURL=chat.dto.js.map