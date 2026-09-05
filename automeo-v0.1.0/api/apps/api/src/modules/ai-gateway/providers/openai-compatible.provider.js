"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAICompatibleProvider = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const base_provider_1 = require("./base.provider");
/**
 * OpenAI兼容接口提供商
 */
let OpenAICompatibleProvider = class OpenAICompatibleProvider extends base_provider_1.BaseProvider {
    constructor() {
        super(...arguments);
        this.baseUrl = process.env.AI_BASE_URL || 'https://api.openai.com/v1';
        this.apiKey = process.env.AI_API_KEY || '';
    }
    async chatCompletion(messages, model, options) {
        if (!this.apiKey || this.apiKey === 'your-api-key') {
            throw new Error('OpenAI兼容API Key未配置');
        }
        const response = await axios_1.default.post(`${this.baseUrl}/chat/completions`, {
            model,
            messages,
            temperature: options?.temperature ?? 0.7,
            max_tokens: options?.max_tokens ?? 4096,
        }, {
            headers: {
                Authorization: `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
            },
            timeout: 60000,
        });
        const data = response.data;
        return {
            content: data.choices?.[0]?.message?.content || '',
            model: data.model || model,
            usage: {
                prompt_tokens: data.usage?.prompt_tokens || 0,
                completion_tokens: data.usage?.completion_tokens || 0,
                total_tokens: data.usage?.total_tokens || 0,
            },
        };
    }
};
exports.OpenAICompatibleProvider = OpenAICompatibleProvider;
exports.OpenAICompatibleProvider = OpenAICompatibleProvider = __decorate([
    (0, common_1.Injectable)()
], OpenAICompatibleProvider);
//# sourceMappingURL=openai-compatible.provider.js.map