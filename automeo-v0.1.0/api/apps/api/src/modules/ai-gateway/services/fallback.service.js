"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FallbackService = void 0;
const common_1 = require("@nestjs/common");
/**
 * 降级与重试服务
 */
let FallbackService = class FallbackService {
    constructor() {
        this.logger = new common_1.Logger('Fallback');
        this.maxRetries = 2;
        this.baseDelay = 1000; // 1秒
    }
    /**
     * 带重试和降级的执行包装
     */
    async executeWithFallback(fn, primaryModel, getFallback) {
        let currentModel = primaryModel;
        let lastError = null;
        for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
            try {
                if (attempt > 0) {
                    const delay = this.baseDelay * Math.pow(2, attempt - 1);
                    this.logger.warn(`第${attempt}次重试，模型=${currentModel}，延迟${delay}ms`);
                    await this.sleep(delay);
                }
                const result = await fn(currentModel);
                if (attempt > 0) {
                    this.logger.log(`重试成功，模型=${currentModel}，尝试次数=${attempt + 1}`);
                }
                return { result, model: currentModel, retries: attempt };
            }
            catch (e) {
                lastError = e;
                this.logger.warn(`调用失败(尝试${attempt + 1}/${this.maxRetries + 1}): ${e.message}`);
                if (attempt < this.maxRetries) {
                    // 偶数次重试换模型（降级）
                    if (attempt % 2 === 1) {
                        const oldModel = currentModel;
                        currentModel = getFallback(currentModel);
                        this.logger.warn(`模型降级: ${oldModel} -> ${currentModel}`);
                    }
                }
            }
        }
        throw lastError || new Error('AI调用失败，已耗尽重试次数');
    }
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
};
exports.FallbackService = FallbackService;
exports.FallbackService = FallbackService = __decorate([
    (0, common_1.Injectable)()
], FallbackService);
//# sourceMappingURL=fallback.service.js.map