"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.alertProcessQueue = exports.deliveryProcessQueue = exports.codeReviewQueue = exports.taskExecutionQueue = exports.chatProcessQueue = exports.opportunityScoreQueue = exports.QUEUE_NAMES = void 0;
exports.createQueue = createQueue;
exports.createWorker = createWorker;
const bullmq_1 = require("bullmq");
const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT || 6379),
    password: process.env.REDIS_PASSWORD || undefined,
};
exports.QUEUE_NAMES = {
    OPPORTUNITY_SCORE: 'opportunity-score',
    CHAT_PROCESS: 'chat-process',
    TASK_EXECUTION: 'task-execution',
    CODE_REVIEW: 'code-review',
    DELIVERY_PROCESS: 'delivery-process',
    ALERT_PROCESS: 'alert-process',
};
function createQueue(name) {
    return new bullmq_1.Queue(name, { connection: redisConfig });
}
function createWorker(name, processor, concurrency = 2) {
    try {
        return new bullmq_1.Worker(name, processor, { connection: redisConfig, concurrency });
    }
    catch (e) {
        console.warn(`Redis不可用，队列 ${name} 降级为直接调用模式`);
        return null;
    }
}
exports.opportunityScoreQueue = createQueue(exports.QUEUE_NAMES.OPPORTUNITY_SCORE);
exports.chatProcessQueue = createQueue(exports.QUEUE_NAMES.CHAT_PROCESS);
exports.taskExecutionQueue = createQueue(exports.QUEUE_NAMES.TASK_EXECUTION);
exports.codeReviewQueue = createQueue(exports.QUEUE_NAMES.CODE_REVIEW);
exports.deliveryProcessQueue = createQueue(exports.QUEUE_NAMES.DELIVERY_PROCESS);
exports.alertProcessQueue = createQueue(exports.QUEUE_NAMES.ALERT_PROCESS);
//# sourceMappingURL=index.js.map