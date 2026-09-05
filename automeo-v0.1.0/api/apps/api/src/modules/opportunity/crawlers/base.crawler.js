"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseCrawler = void 0;
class BaseCrawler {
    /**
     * 带重试的 HTTP 请求
     */
    async fetchWithRetry(url, options = {}, maxRetries = 3, delayMs = 3000) {
        let lastError;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await fetch(url, {
                    ...options,
                    headers: {
                        'User-Agent': 'ABS-Bot/1.0 (auto-business-system)',
                        Accept: 'application/json, text/xml, */*',
                        ...options.headers,
                    },
                });
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return response;
            }
            catch (error) {
                lastError = error;
                if (attempt < maxRetries) {
                    await this.sleep(delayMs * attempt);
                }
            }
        }
        throw lastError instanceof Error ? lastError : new Error('抓取失败');
    }
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
exports.BaseCrawler = BaseCrawler;
//# sourceMappingURL=base.crawler.js.map