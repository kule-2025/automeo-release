"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EleduckCrawler = void 0;
const common_1 = require("@nestjs/common");
const base_crawler_1 = require("./base.crawler");
/**
 * 电鸭社区 RSS 爬虫
 * 抓取远程工作/外包机会
 */
class EleduckCrawler extends base_crawler_1.BaseCrawler {
    constructor() {
        super(...arguments);
        this.platform = 'eleduck';
        this.name = '电鸭社区';
        this.logger = new common_1.Logger('EleduckCrawler');
        this.feedUrl = 'https://eleduck.com/feed';
        this.minIntervalMs = 3000;
        this.lastCrawlAt = 0;
    }
    async crawl(config) {
        const elapsed = Date.now() - this.lastCrawlAt;
        if (elapsed < this.minIntervalMs) {
            await this.sleep(this.minIntervalMs - elapsed);
        }
        const url = config?.feed_url || this.feedUrl;
        this.logger.log(`开始抓取电鸭 RSS: ${url}`);
        const response = await this.fetchWithRetry(url, {
            headers: { Accept: 'application/rss+xml, application/xml, text/xml' },
        }, 3, this.minIntervalMs);
        const xmlText = await response.text();
        this.lastCrawlAt = Date.now();
        const items = this.parseRSS(xmlText);
        const opportunities = [];
        for (const item of items) {
            if (!item.title || !item.link)
                continue;
            opportunities.push({
                title: this.cleanText(item.title),
                description: this.cleanText(item.description || ''),
                source_url: item.link,
                author: item.author,
                raw_data: {
                    guid: item.guid,
                    pub_date: item.pubDate,
                    feed_source: url,
                },
                found_at: item.pubDate ? new Date(item.pubDate) : new Date(),
            });
        }
        this.logger.log(`电鸭抓取完成，共 ${opportunities.length} 条`);
        return opportunities;
    }
    /**
     * 简易 RSS 2.0 解析（不依赖外部 XML 库）
     */
    parseRSS(xml) {
        const items = [];
        const itemRegex = /<item[\s\S]*?<\/item>/gi;
        const itemMatches = xml.match(itemRegex);
        if (!itemMatches)
            return items;
        for (const itemXml of itemMatches) {
            const title = this.extractTag(itemXml, 'title');
            const link = this.extractTag(itemXml, 'link');
            const description = this.extractTag(itemXml, 'description');
            const pubDate = this.extractTag(itemXml, 'pubDate');
            const author = this.extractTag(itemXml, 'author') || this.extractTag(itemXml, 'dc:creator');
            const guid = this.extractTag(itemXml, 'guid');
            items.push({ title, link, description, pubDate, author, guid });
        }
        return items;
    }
    extractTag(xml, tag) {
        const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
        const match = xml.match(regex);
        return match ? match[1].trim() : undefined;
    }
    cleanText(text) {
        return text
            .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
            .replace(/<[^>]+>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/\s+/g, ' ')
            .trim();
    }
}
exports.EleduckCrawler = EleduckCrawler;
//# sourceMappingURL=eleduck.crawler.js.map