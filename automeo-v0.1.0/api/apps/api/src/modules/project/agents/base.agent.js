"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseAgent = void 0;
const common_1 = require("@nestjs/common");
/**
 * Agent基类 - 所有AI Agent的抽象基类
 */
class BaseAgent {
    constructor(agentName) {
        this.agentName = agentName;
        this.logger = new common_1.Logger(agentName);
    }
    /**
     * 获取Agent名称
     */
    getName() {
        return this.agentName;
    }
    /**
     * 记录Agent执行日志
     */
    log(message) {
        this.logger.log(`[${this.agentName}] ${message}`);
    }
}
exports.BaseAgent = BaseAgent;
//# sourceMappingURL=base.agent.js.map