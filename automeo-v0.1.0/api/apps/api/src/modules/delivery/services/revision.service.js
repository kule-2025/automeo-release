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
exports.RevisionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const ai_gateway_service_1 = require("../../ai-gateway/services/ai-gateway.service");
const shared_1 = require("../../../../../../packages/shared/src");
/**
 * 修改服务 - 解析修改需求创建新任务，记录修改次数，最多3次免费
 */
let RevisionService = class RevisionService {
    constructor(prisma, aiGateway) {
        this.prisma = prisma;
        this.aiGateway = aiGateway;
        this.logger = new common_1.Logger('RevisionService');
    }
    /**
     * 创建修改任务 - 解析修改需求，创建新任务，记录修改次数
     */
    async createRevision(dto) {
        this.logger.log(`创建修改请求: delivery=${dto.delivery_id}`);
        const delivery = await this.prisma.delivery.findUnique({
            where: { id: dto.delivery_id },
        });
        if (!delivery) {
            throw new common_1.BadRequestException('交付记录不存在');
        }
        // 检查修改次数
        const revisionCount = delivery.revision_count + 1;
        const isFree = revisionCount <= shared_1.MAX_FREE_REVISIONS;
        if (!isFree) {
            this.logger.warn(`修改次数超限(${revisionCount}/${shared_1.MAX_FREE_REVISIONS})，需额外收费`);
        }
        // 解析修改需求，拆解为任务
        const taskDescription = await this.parseRevisionRequest(dto.description, delivery.project_id);
        // 创建新任务
        const task = await this.prisma.projectTask.create({
            data: {
                project_id: delivery.project_id,
                name: `修改-${taskDescription.name || `第${revisionCount}次修改`}`,
                description: dto.description,
                estimated_hours: taskDescription.estimated_hours ?? 4,
                status: shared_1.TaskStatus.PENDING,
                priority: 3,
                tech_stack: 'TypeScript/Node.js',
                dependencies: [],
            },
        });
        // 更新交付状态和修改次数
        await this.prisma.delivery.update({
            where: { id: dto.delivery_id },
            data: {
                status: 'needs_revision',
                revision_count: revisionCount,
            },
        });
        // 更新项目状态
        await this.prisma.project.update({
            where: { id: delivery.project_id },
            data: { status: 'revision' },
        });
        this.logger.log(`修改任务已创建: task=${task.id}, 第${revisionCount}次, 免费=${isFree}`);
        return {
            revision_id: `${dto.delivery_id}-r${revisionCount}`,
            task_id: task.id,
            revision_count: revisionCount,
            is_free: isFree,
            message: isFree
                ? `修改任务已创建（第${revisionCount}次，免费修改）`
                : `修改任务已创建（第${revisionCount}次，超出免费次数需额外收费）`,
        };
    }
    /**
     * 解析修改需求为任务描述
     */
    async parseRevisionRequest(description, projectId) {
        try {
            const result = await this.aiGateway.call({
                taskType: shared_1.AITaskType.TASK_DECOMPOSITION,
                input: `修改需求: ${description}`,
                context: { purpose: '解析修改需求，生成任务名称和预估工时' },
                projectId,
                systemPrompt: '你是项目经理，请解析修改需求。返回JSON: {name: string, estimated_hours: number}',
            });
            const parsed = this.aiGateway.parseJSON(result.content);
            if (parsed && parsed.name) {
                return parsed;
            }
        }
        catch (error) {
            this.logger.warn(`修改需求解析失败: ${error.message}`);
        }
        return { name: description.substring(0, 50), estimated_hours: 4 };
    }
};
exports.RevisionService = RevisionService;
exports.RevisionService = RevisionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ai_gateway_service_1.AIGatewayService])
], RevisionService);
//# sourceMappingURL=revision.service.js.map