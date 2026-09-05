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
exports.DeliveryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const package_service_1 = require("./package.service");
const upload_service_1 = require("./upload.service");
const acceptance_service_1 = require("./acceptance.service");
const shared_1 = require("../../../../../../packages/shared/src");
/**
 * 交付服务 - 交付列表/详情/发起交付（验收核对→打包→上传→通知客户）
 */
let DeliveryService = class DeliveryService {
    constructor(prisma, packageService, uploadService, acceptanceService) {
        this.prisma = prisma;
        this.packageService = packageService;
        this.uploadService = uploadService;
        this.acceptanceService = acceptanceService;
        this.logger = new common_1.Logger('DeliveryService');
    }
    /**
     * 交付列表
     */
    async findAll(query) {
        const where = {};
        if (query.status) {
            where.status = query.status;
        }
        if (query.project_id) {
            where.project_id = query.project_id;
        }
        const [list, total] = await Promise.all([
            this.prisma.delivery.findMany({
                where,
                orderBy: { created_at: 'desc' },
                skip: ((query.page ?? 1) - 1) * (query.pageSize ?? 20),
                take: query.pageSize ?? 20,
                include: {
                    project: { select: { id: true, name: true, status: true } },
                    _count: { select: { files: true } },
                },
            }),
            this.prisma.delivery.count({ where }),
        ]);
        const serialized = list.map((d) => ({
            ...d,
            project_name: d.project?.name ?? '未知项目',
            file_count: d._count.files,
        }));
        return { list: serialized, total };
    }
    /**
     * 交付详情
     */
    async findOne(id) {
        const delivery = await this.prisma.delivery.findUnique({
            where: { id },
            include: {
                project: { select: { id: true, name: true, status: true, revenue: true, cost: true, profit: true } },
                files: { orderBy: { created_at: 'desc' } },
            },
        });
        if (!delivery) {
            throw new common_1.NotFoundException('交付记录不存在');
        }
        return {
            ...delivery,
            project_name: delivery.project?.name ?? '未知项目',
            project: delivery.project
                ? {
                    ...delivery.project,
                    revenue: Number(delivery.project.revenue),
                    cost: Number(delivery.project.cost),
                    profit: Number(delivery.project.profit),
                }
                : null,
        };
    }
    /**
     * 获取交付文件列表
     */
    async getFiles(id) {
        return this.uploadService.getFiles(id);
    }
    /**
     * 发起交付 - 所有任务待交付时触发：验收核对→打包→上传→通知客户
     */
    async initiate(dto) {
        this.logger.log(`发起交付: project=${dto.project_id}`);
        const project = await this.prisma.project.findUnique({
            where: { id: dto.project_id },
            include: { tasks: true },
        });
        if (!project) {
            throw new common_1.NotFoundException('项目不存在');
        }
        // 检查所有任务是否都已待交付
        const pendingTasks = project.tasks.filter((t) => !['ready_for_delivery', 'completed'].includes(t.status));
        if (pendingTasks.length > 0) {
            throw new common_1.BadRequestException(`还有${pendingTasks.length}个任务未完成，无法交付`);
        }
        const version = dto.version ?? 'v1.0.0';
        // 1. 创建交付记录
        const delivery = await this.prisma.delivery.create({
            data: {
                project_id: dto.project_id,
                version,
                status: shared_1.DeliveryStatus.PACKAGING,
            },
        });
        try {
            // 2. 验收核对
            const acceptanceReport = await this.acceptanceService.verify(delivery.id);
            // 3. 打包
            const packResult = await this.packageService.pack(dto.project_id, version, project.name);
            // 4. 上传代码包
            const codeUpload = await this.uploadService.upload(delivery.id, dto.project_id, packResult.zip_path, `${project.name}-v${version}.zip`, 'application/zip');
            // 5. 上传README
            await this.uploadService.upload(delivery.id, dto.project_id, packResult.readme_path, 'README.md', 'text/markdown');
            // 6. 更新交付记录
            const updated = await this.prisma.delivery.update({
                where: { id: delivery.id },
                data: {
                    status: acceptanceReport.failed_items === 0 ? shared_1.DeliveryStatus.DELIVERED : shared_1.DeliveryStatus.NEEDS_REVISION,
                    delivered_at: new Date(),
                    download_url: codeUpload.download_url,
                    file_hash: packResult.file_hash,
                },
            });
            // 7. 更新项目状态
            await this.prisma.project.update({
                where: { id: dto.project_id },
                data: { status: 'delivered' },
            });
            // 8. 通知客户（开发环境记录日志）
            this.logger.log(`交付完成通知: 项目=${project.name}, 版本=${version}, 下载链接=${codeUpload.download_url}`);
            return {
                ...updated,
                project_name: project.name,
                acceptance: acceptanceReport,
                download_url: codeUpload.download_url,
                file_hash: packResult.file_hash,
            };
        }
        catch (error) {
            // 失败时更新状态
            await this.prisma.delivery.update({
                where: { id: delivery.id },
                data: { status: shared_1.DeliveryStatus.PENDING },
            });
            throw error;
        }
    }
};
exports.DeliveryService = DeliveryService;
exports.DeliveryService = DeliveryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        package_service_1.PackageService,
        upload_service_1.UploadService,
        acceptance_service_1.AcceptanceService])
], DeliveryService);
//# sourceMappingURL=delivery.service.js.map