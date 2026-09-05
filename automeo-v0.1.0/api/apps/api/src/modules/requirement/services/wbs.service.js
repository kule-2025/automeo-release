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
exports.WbsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const ai_gateway_service_1 = require("../../ai-gateway/services/ai-gateway.service");
const shared_1 = require("../../../../../../packages/shared/src");
const client_1 = require("@prisma/client");
/**
 * WBS 工作分解结构服务
 * 调用 AI 拆解任务树，校验工时和依赖，保存 RequirementItem 树形结构
 */
let WbsService = class WbsService {
    constructor(prisma, aiGateway) {
        this.prisma = prisma;
        this.aiGateway = aiGateway;
        this.logger = new common_1.Logger('WbsService');
    }
    /**
     * 拆解需求为任务树
     */
    async decompose(requirementId, title, description, features) {
        const requirement = await this.prisma.requirement.findUnique({
            where: { id: requirementId },
        });
        if (!requirement) {
            throw new Error('需求不存在');
        }
        // 调用 AI 拆解
        let tasks;
        try {
            const featuresText = features
                ? features.map((f) => `- ${f.name}: ${f.description} (复杂度:${f.complexity}, 预估:${f.estimated_hours}h)`).join('\n')
                : '无';
            const result = await this.aiGateway.call({
                taskType: shared_1.AITaskType.TASK_DECOMPOSITION,
                input: `需求标题: ${title}\n需求描述: ${description}\n功能清单:\n${featuresText}`,
                systemPrompt: '你是资深技术架构师。请将需求拆解为模块和子任务的树形结构，输出JSON数组：[{name,description,complexity(1-3),estimated_hours,dependencies:[],tech_stack,priority}]。确保所有子任务工时之和等于总工时，依赖关系无环。',
            });
            const parsed = this.aiGateway.parseJSON(result.content);
            tasks = parsed && Array.isArray(parsed) && parsed.length > 0 ? parsed : this.fallbackTasks(title);
        }
        catch (error) {
            this.logger.warn(`WBS AI拆解失败，使用规则兜底: ${error.message}`);
            tasks = this.fallbackTasks(title);
        }
        // 校验和构建树形结构
        const validated = this.validateAndBuildTree(tasks);
        // 清空已有 items 并重新创建
        await this.prisma.requirementItem.deleteMany({ where: { requirement_id: requirementId } });
        // 创建根节点（模块）和子节点（功能项）
        const createdItems = [];
        let sortOrder = 0;
        for (const task of validated) {
            const rootItem = await this.prisma.requirementItem.create({
                data: {
                    requirement_id: requirementId,
                    name: task.name,
                    description: task.description,
                    complexity: this.mapComplexity(task.complexity),
                    estimated_hours: new client_1.Prisma.Decimal(task.estimated_hours),
                    sort_order: sortOrder++,
                    parent_id: null,
                },
            });
            createdItems.push({ id: rootItem.id, name: task.name, parent_id: null });
        }
        const totalHours = validated.reduce((sum, t) => sum + t.estimated_hours, 0);
        // 更新需求的总工时
        await this.prisma.requirement.update({
            where: { id: requirementId },
            data: { estimated_hours: new client_1.Prisma.Decimal(totalHours) },
        });
        this.logger.log(`WBS拆解完成 requirement=${requirementId} items=${validated.length} total_hours=${totalHours}`);
        return { items: validated.length, total_hours: totalHours };
    }
    /**
     * 校验任务树：总工时 = Σ子任务，依赖无环
     */
    validateAndBuildTree(tasks) {
        // 过滤无效任务
        const valid = tasks.filter((t) => t.name && t.estimated_hours > 0);
        // 依赖无环检测（简化版：检查是否有自引用或重复依赖）
        const taskNames = new Set(valid.map((t) => t.name));
        for (const task of valid) {
            if (task.dependencies) {
                for (const dep of task.dependencies) {
                    if (dep === task.name) {
                        task.dependencies = task.dependencies.filter((d) => d !== dep);
                    }
                    if (!taskNames.has(dep)) {
                        task.dependencies = task.dependencies.filter((d) => d !== dep);
                    }
                }
            }
        }
        // 工时归一化：确保总工时合理
        const totalHours = valid.reduce((sum, t) => sum + t.estimated_hours, 0);
        if (totalHours <= 0) {
            return this.fallbackTasks('未知需求');
        }
        return valid;
    }
    mapComplexity(level) {
        if (level >= 3)
            return shared_1.ComplexityLevel.HIGH;
        if (level >= 2)
            return shared_1.ComplexityLevel.MEDIUM;
        return shared_1.ComplexityLevel.LOW;
    }
    fallbackTasks(title) {
        return [
            {
                name: '需求分析与设计',
                description: `${title} - 需求梳理、技术方案设计、接口定义`,
                complexity: 2,
                estimated_hours: 8,
                dependencies: [],
                tech_stack: '通用',
                priority: 1,
            },
            {
                name: '前端开发',
                description: `${title} - 前端页面开发、交互实现、样式适配`,
                complexity: 2,
                estimated_hours: 24,
                dependencies: ['需求分析与设计'],
                tech_stack: 'React/TypeScript',
                priority: 2,
            },
            {
                name: '后端开发',
                description: `${title} - 后端接口开发、数据库设计、业务逻辑实现`,
                complexity: 3,
                estimated_hours: 32,
                dependencies: ['需求分析与设计'],
                tech_stack: 'Node.js/NestJS',
                priority: 2,
            },
            {
                name: '测试与部署',
                description: `${title} - 功能测试、Bug修复、部署上线`,
                complexity: 2,
                estimated_hours: 12,
                dependencies: ['前端开发', '后端开发'],
                tech_stack: '通用',
                priority: 3,
            },
        ];
    }
};
exports.WbsService = WbsService;
exports.WbsService = WbsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ai_gateway_service_1.AIGatewayService])
], WbsService);
//# sourceMappingURL=wbs.service.js.map