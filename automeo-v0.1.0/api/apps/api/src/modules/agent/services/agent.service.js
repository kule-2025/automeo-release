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
exports.AgentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
let AgentService = class AgentService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger('AgentService');
    }
    // ==================== 角色管理 ====================
    /**
     * 获取所有角色（含员工数统计）
     */
    async findAllRoles() {
        const roles = await this.prisma.agentRole.findMany({
            orderBy: { created_at: 'asc' },
            include: {
                _count: { select: { employees: true } },
            },
        });
        return roles.map((r) => ({
            id: r.id,
            name: r.name,
            description: r.description ?? '',
            capabilities_json: r.capabilities_json ?? [],
            skills_json: r.skills_json ?? [],
            default_model: r.default_model,
            created_at: r.created_at,
            employee_count: r._count.employees,
        }));
    }
    /**
     * 创建新角色
     */
    async createRole(data) {
        const existing = await this.prisma.agentRole.findFirst({
            where: { name: data.name },
        });
        if (existing) {
            throw new common_1.BadRequestException(`角色「${data.name}」已存在`);
        }
        const role = await this.prisma.agentRole.create({
            data: {
                name: data.name,
                description: data.description,
                capabilities_json: data.capabilities,
                skills_json: data.skills,
                default_model: data.default_model,
            },
        });
        this.logger.log(`创建新角色: ${role.name}`);
        return {
            id: role.id,
            name: role.name,
            description: role.description ?? '',
            capabilities_json: role.capabilities_json ?? [],
            skills_json: role.skills_json ?? [],
            default_model: role.default_model,
            created_at: role.created_at,
        };
    }
    // ==================== 员工 CRUD ====================
    /**
     * 员工列表（支持状态/角色/关键词筛选 + 分页）
     */
    async findAll(query) {
        const where = {};
        if (query.status) {
            where.status = query.status;
        }
        if (query.role_id) {
            where.role_id = query.role_id;
        }
        if (query.keyword) {
            where.OR = [
                { name: { contains: query.keyword } },
                { profile_json: { path: ['specialties'], array_contains: query.keyword } },
            ];
        }
        const [list, total] = await Promise.all([
            this.prisma.digitalEmployee.findMany({
                where,
                orderBy: { created_at: 'desc' },
                skip: ((query.page ?? 1) - 1) * (query.pageSize ?? 20),
                take: query.pageSize ?? 20,
                include: { role: true },
            }),
            this.prisma.digitalEmployee.count({ where }),
        ]);
        return {
            list: list.map((e) => this.serializeEmployee(e)),
            total,
        };
    }
    /**
     * 员工详情
     */
    async findOne(id) {
        const employee = await this.prisma.digitalEmployee.findUnique({
            where: { id },
            include: { role: true },
        });
        if (!employee) {
            throw new common_1.NotFoundException('数字化员工不存在');
        }
        return this.serializeEmployee(employee);
    }
    /**
     * 更新员工状态
     */
    async updateStatus(id, dto) {
        const employee = await this.prisma.digitalEmployee.findUnique({ where: { id } });
        if (!employee) {
            throw new common_1.NotFoundException('数字化员工不存在');
        }
        const updateData = { status: dto.status };
        if (dto.status === 'retired' && !employee.retired_at) {
            updateData.retired_at = new Date();
        }
        if (dto.status === 'active' && employee.retired_at) {
            updateData.retired_at = null;
        }
        const updated = await this.prisma.digitalEmployee.update({
            where: { id },
            data: updateData,
            include: { role: true },
        });
        this.logger.log(`员工 ${updated.name} 状态变更为 ${dto.status}`);
        return this.serializeEmployee(updated);
    }
    /**
     * 分配员工到项目
     */
    async assignToProject(id, projectId) {
        const employee = await this.prisma.digitalEmployee.findUnique({ where: { id } });
        if (!employee) {
            throw new common_1.NotFoundException('数字化员工不存在');
        }
        if (employee.status === 'retired') {
            throw new common_1.BadRequestException('已淘汰的员工无法分配项目');
        }
        const updated = await this.prisma.digitalEmployee.update({
            where: { id },
            data: {
                assigned_project_count: { increment: 1 },
                status: 'working',
            },
            include: { role: true },
        });
        this.logger.log(`员工 ${updated.name} 分配到项目 ${projectId}`);
        return this.serializeEmployee(updated);
    }
    // ==================== 统计 ====================
    /**
     * 全局统计（顶部卡片用）
     */
    async getStats() {
        const [total, working, resting, active, retired, employees] = await Promise.all([
            this.prisma.digitalEmployee.count(),
            this.prisma.digitalEmployee.count({ where: { status: 'working' } }),
            this.prisma.digitalEmployee.count({ where: { status: 'resting' } }),
            this.prisma.digitalEmployee.count({ where: { status: 'active' } }),
            this.prisma.digitalEmployee.count({ where: { status: 'retired' } }),
            this.prisma.digitalEmployee.findMany({
                where: { status: { not: 'retired' } },
                select: { success_rate: true, avg_quality_score: true, total_tasks: true },
            }),
        ]);
        const validEmployees = employees.filter((e) => e.total_tasks > 0);
        const avgSuccessRate = validEmployees.length > 0
            ? Math.round((validEmployees.reduce((sum, e) => sum + Number(e.success_rate), 0) /
                validEmployees.length) *
                100) / 100
            : 0;
        const avgQuality = validEmployees.length > 0
            ? Math.round((validEmployees.reduce((sum, e) => sum + Number(e.avg_quality_score), 0) /
                validEmployees.length) *
                10) / 10
            : 0;
        return { total, working, resting, active, retired, avg_success_rate: avgSuccessRate, avg_quality_score: avgQuality };
    }
    /**
     * 员工绩效排名
     */
    async getRanking(limit = 20) {
        const employees = await this.prisma.digitalEmployee.findMany({
            where: { status: { not: 'retired' } },
            include: { role: true },
            orderBy: [{ avg_quality_score: 'desc' }, { success_rate: 'desc' }],
            take: limit,
        });
        return employees.map((e) => ({
            employee_id: e.id,
            employee_name: e.name,
            role_name: e.role?.name ?? '未知',
            total_tasks: e.total_tasks,
            success_rate: Number(e.success_rate),
            avg_quality_score: Number(e.avg_quality_score),
            avg_duration_ms: 0, // 由 performance service 补充
        }));
    }
    // ==================== 内部方法 ====================
    serializeEmployee(employee) {
        return {
            id: employee.id,
            name: employee.name,
            role_id: employee.role_id,
            role_name: employee.role?.name,
            status: employee.status,
            profile_json: employee.profile_json ?? {
                tech_stack: [],
                experience_level: 'mid',
                specialties: [],
                languages: [],
            },
            assigned_project_count: employee.assigned_project_count,
            success_rate: Number(employee.success_rate),
            total_tasks: employee.total_tasks,
            avg_quality_score: Number(employee.avg_quality_score),
            hired_at: employee.hired_at,
            retired_at: employee.retired_at,
            created_at: employee.created_at,
        };
    }
};
exports.AgentService = AgentService;
exports.AgentService = AgentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AgentService);
//# sourceMappingURL=agent.service.js.map