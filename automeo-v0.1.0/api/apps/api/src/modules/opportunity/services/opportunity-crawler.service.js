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
exports.OpportunityCrawlerService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const opportunity_service_1 = require("./opportunity.service");
const opportunity_scorer_service_1 = require("./opportunity-scorer.service");
const v2ex_crawler_1 = require("../crawlers/v2ex.crawler");
const eleduck_crawler_1 = require("../crawlers/eleduck.crawler");
const generic_crawler_1 = require("../crawlers/generic.crawler");
const shared_1 = require("../../../../../../packages/shared/src");
/**
 * 爬虫调度服务
 * 管理各平台爬虫的注册、调度和执行
 */
let OpportunityCrawlerService = class OpportunityCrawlerService {
    constructor(prisma, opportunityService, scorerService) {
        this.prisma = prisma;
        this.opportunityService = opportunityService;
        this.scorerService = scorerService;
        this.logger = new common_1.Logger('OpportunityCrawler');
        this.crawlers = new Map();
        // 注册内置爬虫
        this.registerCrawler(new v2ex_crawler_1.V2EXCrawler());
        this.registerCrawler(new eleduck_crawler_1.EleduckCrawler());
        this.registerCrawler(new generic_crawler_1.GenericCrawler());
    }
    registerCrawler(crawler) {
        this.crawlers.set(crawler.platform, crawler);
        this.logger.log(`注册爬虫: ${crawler.name} [${crawler.platform}]`);
    }
    /**
     * 获取所有活跃的商机源
     */
    async getActiveSources() {
        return this.prisma.opportunitySource.findMany({
            where: { status: shared_1.SourceStatus.ACTIVE },
            orderBy: { created_at: 'asc' },
        });
    }
    /**
     * 触发指定商机源的抓取
     */
    async triggerCrawl(sourceId) {
        const source = await this.prisma.opportunitySource.findUnique({
            where: { id: sourceId },
        });
        if (!source) {
            throw new Error('商机源不存在');
        }
        const crawler = this.crawlers.get(source.platform);
        if (!crawler) {
            throw new Error(`未找到平台爬虫: ${source.platform}`);
        }
        this.logger.log(`触发抓取: ${source.name} [${source.platform}]`);
        let crawledItems = [];
        try {
            const config = source.config_json;
            crawledItems = await crawler.crawl(config);
        }
        catch (error) {
            this.logger.error(`抓取失败 source=${source.name}: ${error.message}`);
            await this.prisma.opportunitySource.update({
                where: { id: sourceId },
                data: { status: shared_1.SourceStatus.ERROR },
            });
            throw error;
        }
        // 去重入库
        let newCount = 0;
        for (const item of crawledItems) {
            try {
                const result = await this.opportunityService.upsertIfNew({
                    source_id: source.id,
                    title: item.title,
                    description: item.description,
                    source_platform: source.platform,
                    source_url: item.source_url,
                    author: item.author,
                    estimated_amount: item.estimated_amount,
                    raw_data: item.raw_data,
                    found_at: item.found_at,
                });
                if (result.created)
                    newCount++;
            }
            catch (error) {
                this.logger.warn(`商机入库失败 url=${item.source_url}: ${error.message}`);
            }
        }
        // 更新商机源状态
        await this.prisma.opportunitySource.update({
            where: { id: sourceId },
            data: {
                last_crawl_at: new Date(),
                total_crawled: { increment: crawledItems.length },
                status: shared_1.SourceStatus.ACTIVE,
            },
        });
        // 对新商机触发评分（异步，不阻塞返回）
        let scored = 0;
        if (newCount > 0) {
            try {
                scored = await this.scorerService.scoreNewOpportunities(Math.min(newCount, 10));
            }
            catch (error) {
                this.logger.warn(`新商机评分失败: ${error.message}`);
            }
        }
        this.logger.log(`抓取完成 source=${source.name} crawled=${crawledItems.length} new=${newCount} scored=${scored}`);
        return {
            source_id: sourceId,
            crawled: crawledItems.length,
            new_count: newCount,
            scored,
        };
    }
    /**
     * 调度所有活跃商机源（定时任务入口）
     */
    async crawlAllActive() {
        const sources = await this.getActiveSources();
        let totalCrawled = 0;
        let totalNew = 0;
        for (const source of sources) {
            try {
                const result = await this.triggerCrawl(source.id);
                totalCrawled += result.crawled;
                totalNew += result.new_count;
            }
            catch (error) {
                this.logger.error(`调度抓取失败 source=${source.name}: ${error.message}`);
            }
        }
        return { total_crawled: totalCrawled, total_new: totalNew };
    }
    /**
     * 获取已注册的爬虫平台列表
     */
    getRegisteredPlatforms() {
        return Array.from(this.crawlers.keys());
    }
};
exports.OpportunityCrawlerService = OpportunityCrawlerService;
exports.OpportunityCrawlerService = OpportunityCrawlerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        opportunity_service_1.OpportunityService,
        opportunity_scorer_service_1.OpportunityScorerService])
], OpportunityCrawlerService);
//# sourceMappingURL=opportunity-crawler.service.js.map