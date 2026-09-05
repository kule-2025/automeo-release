"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.V2EXCrawler = void 0;
const common_1 = require("@nestjs/common");
const base_crawler_1 = require("./base.crawler");
/**
 * V2EX 公开 API 爬虫
 * 抓取 jobs 节点的招聘/外包话题
 */
class V2EXCrawler extends base_crawler_1.BaseCrawler {
    constructor() {
        super(...arguments);
        this.platform = 'v2ex';
        this.name = 'V2EX 社区';
        this.logger = new common_1.Logger('V2EXCrawler');
        this.apiUrl = 'https://www.v2ex.com/api/topics/show.json?node_name=jobs';
        this.minIntervalMs = 3000;
        this.lastCrawlAt = 0;
    }
    async crawl(config) {
        // 频率控制：距上次抓取不足3秒则等待
        const elapsed = Date.now() - this.lastCrawlAt;
        if (elapsed < this.minIntervalMs) {
            await this.sleep(this.minIntervalMs - elapsed);
        }
        const nodeName = config?.node_name || 'jobs';
        const url = `https://www.v2ex.com/api/topics/show.json?node_name=${encodeURIComponent(nodeName)}`;
        this.logger.log(`开始抓取 V2EX 节点: ${nodeName}`);
        const response = await this.fetchWithRetry(url, {}, 3, this.minIntervalMs);
        const topics = (await response.json());
        this.lastCrawlAt = Date.now();
        const opportunities = [];
        for (const topic of topics) {
            if (!topic.title || !topic.url)
                continue;
            opportunities.push({
                title: this.cleanText(topic.title),
                description: this.cleanText(topic.content || topic.content_rendered || ''),
                source_url: topic.url,
                author: topic.author?.username,
                raw_data: {
                    v2ex_id: topic.id,
                    node: topic.node?.name,
                    replies: topic.replies,
                    created_timestamp: topic.created,
                },
                found_at: topic.created ? new Date(topic.created * 1000) : new Date(),
            });
        }
        this.logger.log(`V2EX 抓取完成，共 ${opportunities.length} 条`);
        return opportunities;
    }
    cleanText(text) {
        return text
            .replace(/<[^>]+>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/\s+/g, ' ')
            .trim();
    }
}
exports.V2EXCrawler = V2EXCrawler;
//# sourceMappingURL=v2ex.crawler.js.map