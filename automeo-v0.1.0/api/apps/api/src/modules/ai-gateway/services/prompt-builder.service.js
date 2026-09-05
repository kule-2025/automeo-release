"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptBuilderService = void 0;
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * 提示词模板管理服务
 */
let PromptBuilderService = class PromptBuilderService {
    constructor() {
        this.logger = new common_1.Logger('PromptBuilder');
        this.templateCache = new Map();
        this.templateDir = path.join(__dirname, '..', 'templates');
    }
    /**
     * 构建提示词
     */
    build(taskType, variables) {
        const template = this.loadTemplate(taskType);
        return this.fillTemplate(template, variables);
    }
    loadTemplate(taskType) {
        if (this.templateCache.has(taskType)) {
            return this.templateCache.get(taskType);
        }
        const templateFile = path.join(this.templateDir, `${taskType}.md`);
        try {
            if (fs.existsSync(templateFile)) {
                const content = fs.readFileSync(templateFile, 'utf-8');
                this.templateCache.set(taskType, content);
                return content;
            }
        }
        catch (e) {
            this.logger.warn(`模板文件读取失败: ${templateFile}`);
        }
        // 默认提示词
        const defaultPrompt = `你是一个专业的AI助手。任务类型: ${taskType}\n\n请根据以下输入完成任务：\n{{input}}`;
        this.templateCache.set(taskType, defaultPrompt);
        return defaultPrompt;
    }
    fillTemplate(template, variables) {
        let result = template;
        for (const [key, value] of Object.entries(variables)) {
            const pattern = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
            result = result.replace(pattern, String(value ?? ''));
        }
        return result;
    }
};
exports.PromptBuilderService = PromptBuilderService;
exports.PromptBuilderService = PromptBuilderService = __decorate([
    (0, common_1.Injectable)()
], PromptBuilderService);
//# sourceMappingURL=prompt-builder.service.js.map