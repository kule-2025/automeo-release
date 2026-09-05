"use strict";
/**
 * 全局状态枚举 - 前后端共享
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PipelineStage = exports.HealthLevel = exports.IssueSeverity = exports.QualityDimension = exports.AIProvider = exports.ModelCapability = exports.AITaskType = exports.FallbackAction = exports.AlertModule = exports.AlertStatus = exports.AlertLevel = exports.ComputeResourceStatus = exports.CostCategoryType = exports.WithdrawStatus = exports.FinanceTransactionStatus = exports.FinanceTransactionType = exports.DeliveryStatus = exports.TaskPriority = exports.TaskStatus = exports.ProjectStatus = exports.ComplexityLevel = exports.RequirementStatus = exports.IntentTag = exports.CommunicationDirection = exports.CustomerStatus = exports.CustomerLevel = exports.SourceStatus = exports.OpportunityPlatform = exports.OpportunityStatus = exports.UserStatus = void 0;
// 用户状态
var UserStatus;
(function (UserStatus) {
    UserStatus["ACTIVE"] = "active";
    UserStatus["DISABLED"] = "disabled";
    UserStatus["PENDING_VERIFY"] = "pending_verify";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
// 商机状态
var OpportunityStatus;
(function (OpportunityStatus) {
    OpportunityStatus["NEW"] = "new";
    OpportunityStatus["SCORING"] = "scoring";
    OpportunityStatus["EVALUATING"] = "evaluating";
    OpportunityStatus["CLAIMED"] = "claimed";
    OpportunityStatus["FOLLOWING"] = "following";
    OpportunityStatus["CONVERTED"] = "converted";
    OpportunityStatus["ABANDONED"] = "abandoned";
})(OpportunityStatus || (exports.OpportunityStatus = OpportunityStatus = {}));
// 商机源平台
var OpportunityPlatform;
(function (OpportunityPlatform) {
    OpportunityPlatform["V2EX"] = "v2ex";
    OpportunityPlatform["ELEDUCK"] = "eleduck";
    OpportunityPlatform["GENERIC"] = "generic";
})(OpportunityPlatform || (exports.OpportunityPlatform = OpportunityPlatform = {}));
// 商机源状态
var SourceStatus;
(function (SourceStatus) {
    SourceStatus["ACTIVE"] = "active";
    SourceStatus["PAUSED"] = "paused";
    SourceStatus["ERROR"] = "error";
})(SourceStatus || (exports.SourceStatus = SourceStatus = {}));
// 客户等级
var CustomerLevel;
(function (CustomerLevel) {
    CustomerLevel["A"] = "A";
    CustomerLevel["B"] = "B";
    CustomerLevel["C"] = "C";
})(CustomerLevel || (exports.CustomerLevel = CustomerLevel = {}));
// 客户状态
var CustomerStatus;
(function (CustomerStatus) {
    CustomerStatus["NEW"] = "new";
    CustomerStatus["CONTACTED"] = "contacted";
    CustomerStatus["COMMUNICATING"] = "communicating";
    CustomerStatus["INTENT_CLEAR"] = "intent_clear";
    CustomerStatus["CONVERTED"] = "converted";
    CustomerStatus["LOST"] = "lost";
    CustomerStatus["FOLLOW_UP"] = "follow_up";
})(CustomerStatus || (exports.CustomerStatus = CustomerStatus = {}));
// 沟通方向
var CommunicationDirection;
(function (CommunicationDirection) {
    CommunicationDirection["OUTBOUND"] = "outbound";
    CommunicationDirection["INBOUND"] = "inbound";
    CommunicationDirection["SYSTEM"] = "system";
})(CommunicationDirection || (exports.CommunicationDirection = CommunicationDirection = {}));
// 意图标签
var IntentTag;
(function (IntentTag) {
    IntentTag["CLEAR_REQUIREMENT"] = "clear_requirement";
    IntentTag["NEGOTIATION"] = "negotiation";
    IntentTag["QUESTION"] = "question";
    IntentTag["NO_INTEREST"] = "no_interest";
    IntentTag["GENERAL_CHAT"] = "general_chat";
    IntentTag["UNKNOWN"] = "unknown";
})(IntentTag || (exports.IntentTag = IntentTag = {}));
// 需求状态
var RequirementStatus;
(function (RequirementStatus) {
    RequirementStatus["DRAFT"] = "draft";
    RequirementStatus["PARSING"] = "parsing";
    RequirementStatus["QUOTING"] = "quoting";
    RequirementStatus["PENDING_CONFIRM"] = "pending_confirm";
    RequirementStatus["CONFIRMED"] = "confirmed";
    RequirementStatus["REJECTED"] = "rejected";
    RequirementStatus["NEGOTIATING"] = "negotiating";
})(RequirementStatus || (exports.RequirementStatus = RequirementStatus = {}));
// 需求项复杂度
var ComplexityLevel;
(function (ComplexityLevel) {
    ComplexityLevel["LOW"] = "low";
    ComplexityLevel["MEDIUM"] = "medium";
    ComplexityLevel["HIGH"] = "high";
})(ComplexityLevel || (exports.ComplexityLevel = ComplexityLevel = {}));
// 项目状态
var ProjectStatus;
(function (ProjectStatus) {
    ProjectStatus["PENDING"] = "pending";
    ProjectStatus["IN_DEVELOPMENT"] = "in_development";
    ProjectStatus["IN_REVIEW"] = "in_review";
    ProjectStatus["READY_FOR_DELIVERY"] = "ready_for_delivery";
    ProjectStatus["DELIVERED"] = "delivered";
    ProjectStatus["ACCEPTED"] = "accepted";
    ProjectStatus["REVISION"] = "revision";
    ProjectStatus["COMPLETED"] = "completed";
    ProjectStatus["CANCELLED"] = "cancelled";
})(ProjectStatus || (exports.ProjectStatus = ProjectStatus = {}));
// 任务状态
var TaskStatus;
(function (TaskStatus) {
    TaskStatus["PENDING"] = "pending";
    TaskStatus["IN_PROGRESS"] = "in_progress";
    TaskStatus["SELF_TESTING"] = "self_testing";
    TaskStatus["READY_FOR_DELIVERY"] = "ready_for_delivery";
    TaskStatus["COMPLETED"] = "completed";
    TaskStatus["FAILED"] = "failed";
})(TaskStatus || (exports.TaskStatus = TaskStatus = {}));
// 任务优先级
var TaskPriority;
(function (TaskPriority) {
    TaskPriority[TaskPriority["LOW"] = 1] = "LOW";
    TaskPriority[TaskPriority["MEDIUM"] = 2] = "MEDIUM";
    TaskPriority[TaskPriority["HIGH"] = 3] = "HIGH";
    TaskPriority[TaskPriority["CRITICAL"] = 4] = "CRITICAL";
})(TaskPriority || (exports.TaskPriority = TaskPriority = {}));
// 交付状态
var DeliveryStatus;
(function (DeliveryStatus) {
    DeliveryStatus["PENDING"] = "pending";
    DeliveryStatus["PACKAGING"] = "packaging";
    DeliveryStatus["DELIVERED"] = "delivered";
    DeliveryStatus["VIEWED"] = "viewed";
    DeliveryStatus["IN_ACCEPTANCE"] = "in_acceptance";
    DeliveryStatus["ACCEPTED"] = "accepted";
    DeliveryStatus["NEEDS_REVISION"] = "needs_revision";
})(DeliveryStatus || (exports.DeliveryStatus = DeliveryStatus = {}));
// 财务交易类型
var FinanceTransactionType;
(function (FinanceTransactionType) {
    FinanceTransactionType["PROJECT_INCOME"] = "project_income";
    FinanceTransactionType["TOKEN_COST"] = "token_cost";
    FinanceTransactionType["COMPUTE_COST"] = "compute_cost";
    FinanceTransactionType["THIRD_PARTY_COST"] = "third_party_cost";
    FinanceTransactionType["WITHDRAW"] = "withdraw";
    FinanceTransactionType["REFUND"] = "refund";
})(FinanceTransactionType || (exports.FinanceTransactionType = FinanceTransactionType = {}));
// 财务交易状态
var FinanceTransactionStatus;
(function (FinanceTransactionStatus) {
    FinanceTransactionStatus["PENDING"] = "pending";
    FinanceTransactionStatus["PAID"] = "paid";
    FinanceTransactionStatus["SETTLED"] = "settled";
    FinanceTransactionStatus["FAILED"] = "failed";
    FinanceTransactionStatus["CANCELLED"] = "cancelled";
})(FinanceTransactionStatus || (exports.FinanceTransactionStatus = FinanceTransactionStatus = {}));
// 提现状态
var WithdrawStatus;
(function (WithdrawStatus) {
    WithdrawStatus["PROCESSING"] = "processing";
    WithdrawStatus["COMPLETED"] = "completed";
    WithdrawStatus["FAILED"] = "failed";
    WithdrawStatus["CANCELLED"] = "cancelled";
})(WithdrawStatus || (exports.WithdrawStatus = WithdrawStatus = {}));
// 成本分类类型
var CostCategoryType;
(function (CostCategoryType) {
    CostCategoryType["TOKEN"] = "token";
    CostCategoryType["COMPUTE"] = "compute";
    CostCategoryType["THIRD_PARTY"] = "third_party";
    CostCategoryType["OTHER"] = "other";
})(CostCategoryType || (exports.CostCategoryType = CostCategoryType = {}));
// 算力资源状态
var ComputeResourceStatus;
(function (ComputeResourceStatus) {
    ComputeResourceStatus["RUNNING"] = "running";
    ComputeResourceStatus["STOPPED"] = "stopped";
    ComputeResourceStatus["ERROR"] = "error";
    ComputeResourceStatus["MAINTENANCE"] = "maintenance";
})(ComputeResourceStatus || (exports.ComputeResourceStatus = ComputeResourceStatus = {}));
// 告警级别
var AlertLevel;
(function (AlertLevel) {
    AlertLevel["CRITICAL"] = "critical";
    AlertLevel["WARNING"] = "warning";
    AlertLevel["INFO"] = "info";
})(AlertLevel || (exports.AlertLevel = AlertLevel = {}));
// 告警状态
var AlertStatus;
(function (AlertStatus) {
    AlertStatus["PENDING"] = "pending";
    AlertStatus["PROCESSING"] = "processing";
    AlertStatus["RESOLVED"] = "resolved";
    AlertStatus["ESCALATED"] = "escalated";
})(AlertStatus || (exports.AlertStatus = AlertStatus = {}));
// 告警模块
var AlertModule;
(function (AlertModule) {
    AlertModule["OPPORTUNITY"] = "opportunity";
    AlertModule["CUSTOMER"] = "customer";
    AlertModule["REQUIREMENT"] = "requirement";
    AlertModule["PROJECT"] = "project";
    AlertModule["DELIVERY"] = "delivery";
    AlertModule["FINANCE"] = "finance";
    AlertModule["COST"] = "cost";
    AlertModule["AI_GATEWAY"] = "ai_gateway";
    AlertModule["SYSTEM"] = "system";
})(AlertModule || (exports.AlertModule = AlertModule = {}));
// 兜底动作
var FallbackAction;
(function (FallbackAction) {
    FallbackAction["RETRY"] = "retry";
    FallbackAction["DEGRADE"] = "degrade";
    FallbackAction["PAUSE"] = "pause";
    FallbackAction["MANUAL"] = "manual";
})(FallbackAction || (exports.FallbackAction = FallbackAction = {}));
// AI 任务类型
var AITaskType;
(function (AITaskType) {
    AITaskType["OPPORTUNITY_ANALYSIS"] = "opportunity_analysis";
    AITaskType["CHAT_REPLY"] = "chat_reply";
    AITaskType["FIRST_MESSAGE"] = "first_message";
    AITaskType["INTENT_ANALYSIS"] = "intent_analysis";
    AITaskType["REQUIREMENT_EXTRACTION"] = "requirement_extraction";
    AITaskType["TASK_DECOMPOSITION"] = "task_decomposition";
    AITaskType["CODE_GENERATION"] = "code_generation";
    AITaskType["CODE_REVIEW"] = "code_review";
    AITaskType["TEST_GENERATION"] = "test_generation";
    AITaskType["IMPLEMENTATION_VERIFY"] = "implementation_verify";
    AITaskType["NEGOTIATION_REPLY"] = "negotiation_reply";
})(AITaskType || (exports.AITaskType = AITaskType = {}));
// AI 模型能力等级
var ModelCapability;
(function (ModelCapability) {
    ModelCapability["HIGH"] = "high";
    ModelCapability["MEDIUM"] = "medium";
    ModelCapability["LIGHT"] = "light";
})(ModelCapability || (exports.ModelCapability = ModelCapability = {}));
// AI 提供商
var AIProvider;
(function (AIProvider) {
    AIProvider["DOUBAO"] = "doubao";
    AIProvider["OPENAI_COMPATIBLE"] = "openai_compatible";
})(AIProvider || (exports.AIProvider = AIProvider = {}));
// 代码质量维度
var QualityDimension;
(function (QualityDimension) {
    QualityDimension["READABILITY"] = "readability";
    QualityDimension["MAINTAINABILITY"] = "maintainability";
    QualityDimension["SECURITY"] = "security";
    QualityDimension["PERFORMANCE"] = "performance";
})(QualityDimension || (exports.QualityDimension = QualityDimension = {}));
// 代码问题严重程度
var IssueSeverity;
(function (IssueSeverity) {
    IssueSeverity["CRITICAL"] = "critical";
    IssueSeverity["WARNING"] = "warning";
    IssueSeverity["SUGGESTION"] = "suggestion";
})(IssueSeverity || (exports.IssueSeverity = IssueSeverity = {}));
// 系统健康度等级
var HealthLevel;
(function (HealthLevel) {
    HealthLevel["EXCELLENT"] = "excellent";
    HealthLevel["GOOD"] = "good";
    HealthLevel["WARNING"] = "warning";
    HealthLevel["CRITICAL"] = "critical";
})(HealthLevel || (exports.HealthLevel = HealthLevel = {}));
// 经营环节
var PipelineStage;
(function (PipelineStage) {
    PipelineStage["OPPORTUNITY"] = "opportunity";
    PipelineStage["CUSTOMER"] = "customer";
    PipelineStage["REQUIREMENT"] = "requirement";
    PipelineStage["PROJECT"] = "project";
    PipelineStage["DELIVERY"] = "delivery";
    PipelineStage["FINANCE"] = "finance";
})(PipelineStage || (exports.PipelineStage = PipelineStage = {}));
//# sourceMappingURL=enums.js.map