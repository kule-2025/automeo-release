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
exports.RequirementParserService = void 0;
const common_1 = require("@nestjs/common");
const ai_gateway_service_1 = require("../../ai-gateway/services/ai-gateway.service");
const shared_1 = require("../../../../../../packages/shared/src");
/**
 * 需求解析服务
 * 从客户沟通记录中提取需求，调用 AI 网关进行结构化解析
 */
let RequirementParserService = class RequirementParserService {
    constructor(aiGateway) {
        this.aiGateway = aiGateway;
        this.logger = new common_1.Logger('RequirementParser');
    }
    /**
     * 从沟通记录解析需求
     */
    async parse(communications, customerName) {
        const conversationText = communications
            .map((c) => `${c.direction === 'inbound' ? '客户' : '我方'}: ${c.content}`)
            .join('\n');
        try {
            const result = await this.aiGateway.call({
                taskType: shared_1.AITaskType.REQUIREMENT_EXTRACTION,
                input: `客户名称: ${customerName}\n\n沟通记录:\n${conversationText}`,
                systemPrompt: '你是专业的需求分析师。请从沟通记录中提取客户的需求，输出JSON格式：{title, features:[{name,description,complexity,estimated_hours}], deliverables:[], timeline, constraints:[]}。complexity只能是low/medium/high。',
            });
            const parsed = this.aiGateway.parseJSON(result.content);
            if (parsed && parsed.title && parsed.features) {
                this.logger.log(`需求解析成功: ${parsed.title}, ${parsed.features.length}个功能点`);
                return parsed;
            }
            this.logger.warn('AI返回格式不正确，使用规则兜底解析');
            return this.ruleBasedParse(conversationText, customerName);
        }
        catch (error) {
            this.logger.warn(`需求解析AI调用失败: ${error.message}`);
            return this.ruleBasedParse(conversationText, customerName);
        }
    }
    /**
     * 基于规则的兜底需求解析
     */
    ruleBasedParse(conversation, customerName) {
        const features = [];
        // 提取功能关键词
        const featurePatterns = [
            { name: '用户登录注册', pattern: /登录|注册|账号|auth|login/i, hours: 8 },
            { name: '数据列表展示', pattern: /列表|展示|查询|浏览|list/i, hours: 6 },
            { name: '数据详情页', pattern: /详情|detail|查看/i, hours: 4 },
            { name: '表单提交', pattern: /表单|提交|录入|填写|form/i, hours: 6 },
            { name: '后台管理', pattern: /后台|管理|admin|cms/i, hours: 16 },
            { name: '支付功能', pattern: /支付|付款|微信支付|支付宝|pay/i, hours: 12 },
            { name: '消息通知', pattern: /消息|通知|推送|notification/i, hours: 8 },
            { name: '文件上传', pattern: /上传|文件|图片|附件|upload/i, hours: 6 },
            { name: '搜索功能', pattern: /搜索|查找|筛选|search/i, hours: 6 },
            { name: '数据导出', pattern: /导出|下载|excel|报表/i, hours: 4 },
        ];
        for (const fp of featurePatterns) {
            if (fp.pattern.test(conversation)) {
                features.push({
                    name: fp.name,
                    description: `根据沟通记录提取的${fp.name}功能`,
                    complexity: fp.hours > 10 ? 'high' : fp.hours > 6 ? 'medium' : 'low',
                    estimated_hours: fp.hours,
                });
            }
        }
        // 如果没有匹配到任何功能，添加默认功能
        if (features.length === 0) {
            features.push({
                name: '核心功能开发',
                description: '根据客户需求定制开发的核心功能',
                complexity: 'medium',
                estimated_hours: 24,
            });
        }
        // 提取标题
        const titleMatch = conversation.match(/(?:做|开发|需要|想要)[一一个]*(.+?)(?:[，。！？\n]|$)/);
        const title = titleMatch
            ? `${customerName} - ${titleMatch[1].slice(0, 30)}`
            : `${customerName} - 定制开发需求`;
        // 提取约束
        const constraints = [];
        if (/尽快|紧急|马上/.test(conversation))
            constraints.push('工期紧急');
        if (/预算|价格|费用/.test(conversation))
            constraints.push('有预算限制');
        if (/长期|维护|迭代/.test(conversation))
            constraints.push('需要长期维护');
        return {
            title,
            features,
            deliverables: ['源代码', '部署文档', '使用说明'],
            constraints,
        };
    }
};
exports.RequirementParserService = RequirementParserService;
exports.RequirementParserService = RequirementParserService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [ai_gateway_service_1.AIGatewayService])
], RequirementParserService);
//# sourceMappingURL=requirement-parser.service.js.map