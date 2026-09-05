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
exports.RecruitmentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
/**
 * 任务类型 -> 推荐角色映射表
 * 用于在没有完美匹配时做模糊推荐
 */
const TASK_TYPE_ROLE_MAP = {
    code_generation: {
        preferredRole: '编码专家',
        capabilities: ['代码编写', '架构设计', '算法实现', 'API开发'],
        skills: ['TypeScript', 'Python', 'Go', 'React', 'Node.js'],
    },
    code_review: {
        preferredRole: '审查专家',
        capabilities: ['代码审查', '质量把控', '安全审计', '性能优化'],
        skills: ['静态分析', '代码规范', '安全扫描', '架构评审'],
    },
    test_generation: {
        preferredRole: '测试专家',
        capabilities: ['单元测试', '集成测试', '自动化测试', '边界用例'],
        skills: ['Jest', 'Pytest', 'JUnit', 'CI/CD', 'Mock'],
    },
    requirement_analysis: {
        preferredRole: '需求分析师',
        capabilities: ['需求拆解', '技术评估', '方案设计', '文档编写'],
        skills: ['需求分析', 'UML', '原型设计', '技术选型'],
    },
    communication: {
        preferredRole: '沟通专家',
        capabilities: ['客户沟通', '需求澄清', '进度汇报', '冲突协调'],
        skills: ['商务沟通', '邮件撰写', '会议纪要', '谈判技巧'],
    },
    deployment: {
        preferredRole: '运维专家',
        capabilities: ['部署上线', '环境配置', '监控告警', '故障排查'],
        skills: ['Docker', 'Kubernetes', 'CI/CD', 'Linux', 'Nginx'],
    },
    documentation: {
        preferredRole: '需求分析师',
        capabilities: ['技术文档', 'API文档', '用户手册', '架构文档'],
        skills: ['Markdown', 'Swagger', '文档结构化', '图表绘制'],
    },
    debugging: {
        preferredRole: '编码专家',
        capabilities: ['问题定位', 'Bug修复', '性能调优', '日志分析'],
        skills: ['调试工具', '日志分析', '性能剖析', '根因分析'],
    },
};
/**
 * 经验等级与技术栈数量的映射
 */
const EXPERIENCE_TECH_COUNT = {
    junior: 2,
    mid: 4,
    senior: 6,
    expert: 8,
};
let RecruitmentService = class RecruitmentService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger('RecruitmentService');
    }
    /**
     * 分析任务需求并匹配最合适的角色
     * 流程：需求分析 → 角色匹配（评分算法）→ 无匹配则创建新角色
     */
    async analyzeAndMatch(dto) {
        this.logger.log(`开始分析招聘需求: task_type=${dto.task_type}, tech_stack=[${dto.tech_stack.join(', ')}]`);
        // 1. 获取所有角色
        const allRoles = await this.prisma.agentRole.findMany();
        if (allRoles.length === 0) {
            // 没有任何角色，直接创建新角色
            return this.buildNewRoleResult(dto);
        }
        // 2. 对每个角色计算匹配分数
        const scoredRoles = allRoles.map((role) => {
            const capabilities = role.capabilities_json ?? [];
            const skills = role.skills_json ?? [];
            const taskHint = TASK_TYPE_ROLE_MAP[dto.task_type];
            let score = 0;
            const reasons = [];
            // 2.1 任务类型匹配（权重40%）
            if (taskHint && role.name.includes(taskHint.preferredRole.replace('专家', ''))) {
                score += 40;
                reasons.push(`角色类型匹配任务类型「${dto.task_type}」`);
            }
            else if (taskHint) {
                // 检查能力标签重叠
                const capabilityOverlap = capabilities.filter((c) => taskHint.capabilities.some((tc) => c.includes(tc) || tc.includes(c)));
                if (capabilityOverlap.length > 0) {
                    score += Math.min(25, capabilityOverlap.length * 8);
                    reasons.push(`能力标签部分匹配: ${capabilityOverlap.join(', ')}`);
                }
            }
            // 2.2 技术栈匹配（权重35%）
            const techOverlap = dto.tech_stack.filter((tech) => skills.some((s) => s.toLowerCase().includes(tech.toLowerCase()) || tech.toLowerCase().includes(s.toLowerCase())));
            if (techOverlap.length > 0) {
                const techScore = Math.min(35, (techOverlap.length / dto.tech_stack.length) * 35);
                score += techScore;
                reasons.push(`技术栈匹配: ${techOverlap.join(', ')} (${Math.round(techScore)}分)`);
            }
            // 2.3 能力标签丰富度（权重15%）
            if (capabilities.length >= 4) {
                score += 15;
            }
            else if (capabilities.length >= 2) {
                score += 8;
            }
            // 2.4 技能丰富度（权重10%）
            if (skills.length >= 5) {
                score += 10;
            }
            else if (skills.length >= 3) {
                score += 5;
            }
            return { role, score: Math.round(score), reasons };
        });
        // 3. 按分数排序
        scoredRoles.sort((a, b) => b.score - a.score);
        const bestMatch = scoredRoles[0];
        this.logger.log(`匹配结果: 最佳角色=${bestMatch.role.name}, 分数=${bestMatch.score}, 原因=${bestMatch.reasons.join('; ')}`);
        // 4. 分数阈值判断：>=50分使用现有角色，否则创建新角色
        if (bestMatch.score >= 50) {
            const profile = this.buildProfile(dto, bestMatch.role.name);
            return {
                matched_role: {
                    id: bestMatch.role.id,
                    name: bestMatch.role.name,
                    description: bestMatch.role.description ?? '',
                    capabilities: bestMatch.role.capabilities_json ?? [],
                    default_model: bestMatch.role.default_model,
                    match_score: bestMatch.score,
                },
                is_new_role: false,
                suggested_name: this.generateEmployeeName(bestMatch.role.name),
                suggested_profile: profile,
                reason: `匹配到现有角色「${bestMatch.role.name}」，匹配度 ${bestMatch.score}%。${bestMatch.reasons.join('；')}`,
            };
        }
        // 5. 没有合适角色，构建新角色方案
        return this.buildNewRoleResult(dto);
    }
    /**
     * 执行招聘：创建数字化员工并分配到项目
     */
    async executeRecruitment(dto) {
        // 1. 先分析匹配
        const matchResult = await this.analyzeAndMatch(dto);
        let roleId;
        let roleName;
        if (matchResult.is_new_role || !matchResult.matched_role) {
            // 2. 创建新角色
            const taskHint = TASK_TYPE_ROLE_MAP[dto.task_type];
            const newRoleName = this.generateNewRoleName(dto);
            const newRole = await this.prisma.agentRole.create({
                data: {
                    name: newRoleName,
                    description: `根据任务类型「${dto.task_type}」和技术栈「${dto.tech_stack.join('/')}」自动创建的角色`,
                    capabilities_json: taskHint?.capabilities ?? ['通用任务处理'],
                    skills_json: [...dto.tech_stack, ...(taskHint?.skills ?? [])],
                    default_model: dto.preferred_model ?? 'doubao-pro',
                },
            });
            roleId = newRole.id;
            roleName = newRole.name;
            this.logger.log(`自动创建新角色: ${newRole.name}`);
        }
        else {
            roleId = matchResult.matched_role.id;
            roleName = matchResult.matched_role.name;
        }
        // 3. 创建数字化员工
        const employeeName = this.generateEmployeeName(roleName);
        const profile = matchResult.suggested_profile;
        const employee = await this.prisma.digitalEmployee.create({
            data: {
                name: employeeName,
                role_id: roleId,
                status: 'active',
                profile_json: JSON.parse(JSON.stringify(profile)),
                assigned_project_count: dto.project_id ? 1 : 0,
                success_rate: 0,
                total_tasks: 0,
                avg_quality_score: 0,
                hired_at: new Date(),
            },
            include: { role: true },
        });
        this.logger.log(`招聘成功: ${employee.name} (角色: ${roleName})`);
        // 4. 如果指定了项目，自动分配
        if (dto.project_id) {
            await this.prisma.digitalEmployee.update({
                where: { id: employee.id },
                data: { status: 'working' },
            });
            this.logger.log(`员工 ${employee.name} 已分配到项目 ${dto.project_id}`);
        }
        return {
            id: employee.id,
            name: employee.name,
            role_id: employee.role_id,
            role_name: roleName,
            status: employee.status,
            profile_json: profile,
            assigned_project_count: employee.assigned_project_count,
            success_rate: 0,
            total_tasks: 0,
            avg_quality_score: 0,
            hired_at: employee.hired_at,
            retired_at: employee.retired_at,
            created_at: employee.created_at,
        };
    }
    // ==================== 内部方法 ====================
    /**
     * 构建新角色匹配结果
     */
    buildNewRoleResult(dto) {
        const taskHint = TASK_TYPE_ROLE_MAP[dto.task_type];
        const newRoleName = this.generateNewRoleName(dto);
        const profile = this.buildProfile(dto, newRoleName);
        return {
            matched_role: null,
            is_new_role: true,
            suggested_name: this.generateEmployeeName(newRoleName),
            suggested_profile: profile,
            reason: `未找到匹配度≥50%的现有角色，建议创建新角色「${newRoleName}」。该角色将具备能力: ${(taskHint?.capabilities ?? ['通用任务处理']).join('、')}`,
        };
    }
    /**
     * 根据任务需求构建能力画像
     */
    buildProfile(dto, roleName) {
        // 根据技术栈数量决定经验等级
        const techCount = dto.tech_stack.length;
        let experienceLevel;
        if (techCount <= 1)
            experienceLevel = 'junior';
        else if (techCount <= 3)
            experienceLevel = 'mid';
        else if (techCount <= 5)
            experienceLevel = 'senior';
        else
            experienceLevel = 'expert';
        // 从任务类型推断擅长领域
        const taskHint = TASK_TYPE_ROLE_MAP[dto.task_type];
        const specialties = taskHint
            ? taskHint.capabilities.slice(0, 3)
            : ['通用任务处理'];
        // 语言推断
        const languages = dto.tech_stack.filter((t) => ['TypeScript', 'JavaScript', 'Python', 'Go', 'Java', 'Rust', 'C++', 'PHP', 'Ruby'].some((l) => t.toLowerCase().includes(l.toLowerCase())));
        return {
            tech_stack: dto.tech_stack.slice(0, EXPERIENCE_TECH_COUNT[experienceLevel]),
            experience_level: experienceLevel,
            specialties,
            languages: languages.length > 0 ? languages : ['TypeScript'],
        };
    }
    /**
     * 生成员工名称：角色简称 + 编号
     * 例如：编码专家 -> 小码-编码专家001
     */
    generateEmployeeName(roleName) {
        // 角色名简称映射
        const shortNameMap = {
            编码专家: '小码',
            审查专家: '小审',
            测试专家: '小测',
            需求分析师: '小析',
            沟通专家: '小通',
            运维专家: '小运',
        };
        const shortName = shortNameMap[roleName] ?? `小${roleName.charAt(0)}`;
        // 查询同角色已有员工数，生成编号
        // 注意：这里用同步查询可能有并发问题，但招聘频率低可接受
        // 实际生产中应使用分布式ID或数据库序列
        return `${shortName}-${roleName}${String(Date.now()).slice(-3)}`;
    }
    /**
     * 生成新角色名称
     */
    generateNewRoleName(dto) {
        const taskHint = TASK_TYPE_ROLE_MAP[dto.task_type];
        if (taskHint) {
            return taskHint.preferredRole;
        }
        // 兜底：用技术栈命名
        const primaryTech = dto.tech_stack[0] ?? '通用';
        return `${primaryTech}专家`;
    }
};
exports.RecruitmentService = RecruitmentService;
exports.RecruitmentService = RecruitmentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RecruitmentService);
//# sourceMappingURL=recruitment.service.js.map