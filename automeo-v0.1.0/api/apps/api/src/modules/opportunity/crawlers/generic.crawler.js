"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenericCrawler = void 0;
const common_1 = require("@nestjs/common");
const base_crawler_1 = require("./base.crawler");
/**
 * 通用可配置爬虫
 * 支持通过 config_json 配置目标 URL、选择器、字段映射等
 * 当前为预留实现，支持基础的 JSON API 抓取
 */
class GenericCrawler extends base_crawler_1.BaseCrawler {
    constructor() {
        super(...arguments);
        this.platform = 'generic';
        this.name = '通用爬虫';
        this.logger = new common_1.Logger('GenericCrawler');
    }
    async crawl(config) {
        if (!config || !config.url) {
            this.logger.warn('通用爬虫未配置 url，跳过');
            return [];
        }
        const url = config.url;
        const method = config.method || 'GET';
        const headers = config.headers || {};
        const listPath = config.list_path || '';
        const fieldMap = config.field_map || {
            title: 'title',
            description: 'description',
            url: 'url',
            author: 'author',
        };
        this.logger.log(`通用爬虫开始抓取: ${url}`);
        const response = await this.fetchWithRetry(url, { method, headers }, 3, 3000);
        const contentType = response.headers.get('content-type') || '';
        let rawData;
        if (contentType.includes('json')) {
            rawData = await response.json();
        }
        else {
            const text = await response.text();
            try {
                rawData = JSON.parse(text);
            }
            catch {
                this.logger.warn('通用爬虫响应非 JSON 格式，暂不支持 HTML 解析');
                return [];
            }
        }
        const items = this.extractList(rawData, listPath);
        const opportunities = [];
        for (const item of items) {
            const title = this.getNestedValue(item, fieldMap.title);
            const sourceUrl = this.getNestedValue(item, fieldMap.url);
            if (!title || !sourceUrl)
                continue;
            opportunities.push({
                title: String(title),
                description: String(this.getNestedValue(item, fieldMap.description) || ''),
                source_url: String(sourceUrl),
                author: this.getNestedValue(item, fieldMap.author)
                    ? String(this.getNestedValue(item, fieldMap.author))
                    : undefined,
                raw_data: item,
                found_at: new Date(),
            });
        }
        this.logger.log(`通用爬虫抓取完成，共 ${opportunities.length} 条`);
        return opportunities;
    }
    extractList(data, path) {
        if (!path) {
            return Array.isArray(data) ? data : [data];
        }
        const value = this.getNestedValue(data, path);
        return Array.isArray(value) ? value : [];
    }
    getNestedValue(obj, path) {
        if (!path)
            return obj;
        return path.split('.').reduce((acc, key) => {
            if (acc && typeof acc === 'object' && key in acc) {
                return acc[key];
            }
            return undefined;
        }, obj);
    }
}
exports.GenericCrawler = GenericCrawler;
//# sourceMappingURL=generic.crawler.js.map