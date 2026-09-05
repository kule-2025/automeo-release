"use strict";
/**
 * 全局常量
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CRON_SCHEDULES = exports.QUEUE_NAMES = exports.DELIVERY_LINK_EXPIRES = exports.TASK_MAX_CONCURRENCY = exports.MIN_PROFIT_MARGIN = exports.BUDGET_STOP_RATIO = exports.BUDGET_WARN_RATIO = exports.TEST_PASS_RATIO = exports.QUALITY_PASS_SCORE = exports.OPPORTUNITY_AUTO_CLAIM_SCORE = exports.ACCEPTANCE_TIMEOUT_DAYS = exports.MAX_FREE_REVISIONS = exports.MAX_CODE_RETRY = exports.WITHDRAW_T_DAYS = exports.MIN_WITHDRAW_AMOUNT = exports.SMS_CODE_RESEND_INTERVAL = exports.SMS_CODE_EXPIRES = exports.JWT_DEFAULT_EXPIRES = exports.MAX_PAGE_SIZE = exports.DEFAULT_PAGE_SIZE = exports.API_PREFIX = void 0;
exports.API_PREFIX = '/api/v1';
exports.DEFAULT_PAGE_SIZE = 20;
exports.MAX_PAGE_SIZE = 100;
exports.JWT_DEFAULT_EXPIRES = '7d';
exports.SMS_CODE_EXPIRES = 300; // 5分钟
exports.SMS_CODE_RESEND_INTERVAL = 60; // 60秒
exports.MIN_WITHDRAW_AMOUNT = 10; // 最低提现额
exports.WITHDRAW_T_DAYS = 1; // T+1到账
exports.MAX_CODE_RETRY = 3; // 代码修复最大重试次数
exports.MAX_FREE_REVISIONS = 3; // 免费修改次数
exports.ACCEPTANCE_TIMEOUT_DAYS = 7; // 验收超期天数
exports.OPPORTUNITY_AUTO_CLAIM_SCORE = 70; // 自动认领匹配度阈值
exports.QUALITY_PASS_SCORE = 80; // 质量通过分数
exports.TEST_PASS_RATIO = 0.9; // 测试通过率阈值
exports.BUDGET_WARN_RATIO = 0.8;
exports.BUDGET_STOP_RATIO = 1.0;
exports.MIN_PROFIT_MARGIN = 0.1;
exports.TASK_MAX_CONCURRENCY = 3; // 默认最大并发任务数
exports.DELIVERY_LINK_EXPIRES = 604800; // 7天秒数
exports.QUEUE_NAMES = {
    OPPORTUNITY_SCORE: 'opportunity-score',
    CHAT_PROCESS: 'chat-process',
    TASK_EXECUTION: 'task-execution',
    CODE_REVIEW: 'code-review',
    DELIVERY_PROCESS: 'delivery-process',
    ALERT_PROCESS: 'alert-process',
};
exports.CRON_SCHEDULES = {
    OPPORTUNITY_CRAWL: '*/10 * * * *',
    REPLY_CHECK: '*/5 * * * *',
    ACCEPTANCE_TIMEOUT: '0 * * * *',
    COST_AGGREGATE: '0 * * * *',
    HEALTH_CHECK: '*/5 * * * *',
    BACKUP: '0 2 * * *',
};
//# sourceMappingURL=index.js.map