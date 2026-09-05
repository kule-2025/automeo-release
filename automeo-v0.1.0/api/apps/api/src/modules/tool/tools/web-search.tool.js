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
exports.WebSearchTool = void 0;
const common_1 = require("@nestjs/common");
const base_tool_1 = require("./base.tool");
/**
 * Web搜索工具 - 调用真实搜索引擎API
 * 支持 SerpAPI / Bing Search / Google Custom Search
 * 需通过环境变量配置 SEARCH_API_PROVIDER 和 SEARCH_API_KEY
 */
let WebSearchTool = class WebSearchTool extends base_tool_1.BaseTool {
    constructor() {
        super({
            name: 'web_search',
            display_name: 'Web搜索',
            description: '搜索互联网信息，返回相关网页结果列表。需配置SEARCH_API_KEY后使用。',
            category: 'search',
            return_type: 'object',
            timeout_ms: 15000,
            parameters: {
                type: 'object',
                required: ['query'],
                properties: {
                    query: {
                        type: 'string',
                        description: '搜索关键词',
                        minLength: 1,
                        maxLength: 500,
                    },
                    num_results: {
                        type: 'integer',
                        description: '返回结果数量，默认5，最大20',
                        minimum: 1,
                        maximum: 20,
                        default: 5,
                    },
                    language: {
                        type: 'string',
                        description: '搜索语言',
                        enum: ['zh-CN', 'en-US', 'auto'],
                        default: 'zh-CN',
                    },
                },
            },
        });
        this.logger = new common_1.Logger('WebSearchTool');
        this.apiProvider = process.env.SEARCH_API_PROVIDER || 'serpapi';
        this.apiKey = process.env.SEARCH_API_KEY || '';
        this.apiEndpoint = process.env.SEARCH_API_ENDPOINT || '';
    }
    async execute(params) {
        const query = String(params.query);
        const numResults = Math.min(Number(params.num_results ?? 5), 20);
        const language = String(params.language ?? 'zh-CN');
        if (!this.apiKey) {
            throw new Error('Web搜索工具未配置API密钥。请设置环境变量 SEARCH_API_PROVIDER (serpapi/bing/google) 和 SEARCH_API_KEY 后使用。');
        }
        const startTime = Date.now();
        let results = [];
        try {
            if (this.apiProvider === 'serpapi') {
                results = await this.searchSerpAPI(query, numResults, language);
            }
            else if (this.apiProvider === 'bing') {
                results = await this.searchBing(query, numResults, language);
            }
            else if (this.apiProvider === 'google') {
                results = await this.searchGoogle(query, numResults, language);
            }
            else {
                throw new Error(`不支持的搜索提供商: ${this.apiProvider}`);
            }
        }
        catch (error) {
            this.logger.error(`搜索失败: ${error.message}`);
            throw new Error(`搜索请求失败: ${error.message}`);
        }
        const searchTimeMs = Date.now() - startTime;
        return {
            query,
            language,
            provider: this.apiProvider,
            result_count: results.length,
            search_time_ms: searchTimeMs,
            results,
        };
    }
    async searchSerpAPI(query, num, language) {
        const endpoint = this.apiEndpoint || 'https://serpapi.com/search.json';
        const url = `${endpoint}?q=${encodeURIComponent(query)}&api_key=${this.apiKey}&num=${num}&hl=${language}`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`SerpAPI返回 ${response.status}`);
        }
        const data = (await response.json());
        return (data.organic_results || []).slice(0, num).map((r) => ({
            title: r.title || '',
            url: r.link || '',
            snippet: r.snippet || '',
            source: r.source || new URL(r.link || 'https://example.com').hostname,
        }));
    }
    async searchBing(query, num, language) {
        const endpoint = this.apiEndpoint || 'https://api.bing.microsoft.com/v7.0/search';
        const response = await fetch(`${endpoint}?q=${encodeURIComponent(query)}&count=${num}&mkt=${language}`, {
            headers: { 'Ocp-Apim-Subscription-Key': this.apiKey },
        });
        if (!response.ok) {
            throw new Error(`Bing搜索返回 ${response.status}`);
        }
        const data = (await response.json());
        return (data.webPages?.value || []).slice(0, num).map((r) => ({
            title: r.name || '',
            url: r.url || '',
            snippet: r.snippet || '',
            source: r.displayUrl || new URL(r.url || 'https://example.com').hostname,
        }));
    }
    async searchGoogle(query, num, language) {
        const cx = process.env.SEARCH_API_CX || '';
        if (!cx) {
            throw new Error('Google Custom Search 需要配置 SEARCH_API_CX (搜索引擎ID)');
        }
        const endpoint = this.apiEndpoint || 'https://www.googleapis.com/customsearch/v1';
        const response = await fetch(`${endpoint}?q=${encodeURIComponent(query)}&key=${this.apiKey}&cx=${cx}&num=${num}&lr=lang_${language}`);
        if (!response.ok) {
            throw new Error(`Google搜索返回 ${response.status}`);
        }
        const data = (await response.json());
        return (data.items || []).slice(0, num).map((r) => ({
            title: r.title || '',
            url: r.link || '',
            snippet: r.snippet || '',
            source: r.displayLink || new URL(r.link || 'https://example.com').hostname,
        }));
    }
};
exports.WebSearchTool = WebSearchTool;
exports.WebSearchTool = WebSearchTool = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], WebSearchTool);
//# sourceMappingURL=web-search.tool.js.map