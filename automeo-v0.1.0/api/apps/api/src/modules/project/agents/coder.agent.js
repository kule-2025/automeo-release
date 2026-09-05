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
exports.CoderAgent = void 0;
const common_1 = require("@nestjs/common");
const ai_gateway_service_1 = require("../../ai-gateway/services/ai-gateway.service");
const base_agent_1 = require("./base.agent");
/**
 * 编码Agent - 负责生成代码
 */
let CoderAgent = class CoderAgent extends base_agent_1.BaseAgent {
    constructor(aiGateway) {
        super('CoderAgent');
        this.aiGateway = aiGateway;
    }
    async run(input) {
        this.log(`开始编码任务: ${input.taskDescription.substring(0, 50)}...`);
        const rawOutput = await this.aiGateway.generateCode(input.taskDescription, input.techStack, input.context, input.projectId, input.taskId);
        // 解析AI输出为文件列表
        const files = this.parseCodeFiles(rawOutput, input.techStack);
        const code = files.map((f) => `// ${f.path}\n${f.content}`).join('\n\n');
        this.log(`编码完成，生成${files.length}个文件`);
        return { code, files };
    }
    /**
     * 解析AI输出的代码文件
     */
    parseCodeFiles(rawOutput, techStack) {
        const files = [];
        // 尝试解析 ```filename\ncode\n``` 格式
        const fileRegex = /```(?:[\w+-]+)?\s*([\w./-]+\.[\w]+)\s*\n([\s\S]*?)```/g;
        let match;
        while ((match = fileRegex.exec(rawOutput)) !== null) {
            files.push({ path: match[1], content: match[2].trim() });
        }
        // 如果没有解析到文件，将整个输出作为单个文件
        if (files.length === 0) {
            const ext = this.getDefaultExt(techStack);
            files.push({ path: `src/main.${ext}`, content: rawOutput.trim() });
        }
        return files;
    }
    getDefaultExt(techStack) {
        if (techStack.includes('TypeScript') || techStack.includes('Node'))
            return 'ts';
        if (techStack.includes('Python'))
            return 'py';
        if (techStack.includes('Java'))
            return 'java';
        if (techStack.includes('Go'))
            return 'go';
        return 'ts';
    }
};
exports.CoderAgent = CoderAgent;
exports.CoderAgent = CoderAgent = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [ai_gateway_service_1.AIGatewayService])
], CoderAgent);
//# sourceMappingURL=coder.agent.js.map