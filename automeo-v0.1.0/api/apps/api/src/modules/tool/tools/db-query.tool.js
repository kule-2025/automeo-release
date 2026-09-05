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
var DbQueryTool_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DbQueryTool = void 0;
const common_1 = require("@nestjs/common");
const base_tool_1 = require("./base.tool");
const prisma_service_1 = require("../../../prisma/prisma.service");
/**
 * 数据库查询工具 - 执行只读SQL查询
 * 安全约束：白名单校验，禁止INSERT/UPDATE/DELETE/DROP/ALTER/CREATE等写操作
 */
let DbQueryTool = DbQueryTool_1 = class DbQueryTool extends base_tool_1.BaseTool {
    constructor(prisma) {
        super({
            name: 'db_query',
            display_name: '数据库查询',
            description: '执行只读SQL查询，返回查询结果。仅支持SELECT语句，禁止任何写操作。',
            category: 'database',
            return_type: 'object',
            timeout_ms: 15000,
            parameters: {
                type: 'object',
                required: ['sql'],
                properties: {
                    sql: {
                        type: 'string',
                        description: '要执行的SELECT查询语句',
                        minLength: 1,
                        maxLength: 2000,
                    },
                    limit: {
                        type: 'integer',
                        description: '最大返回行数，默认100，最大1000',
                        minimum: 1,
                        maximum: 1000,
                        default: 100,
                    },
                },
            },
        });
        this.prisma = prisma;
    }
    async execute(params) {
        const sql = String(params.sql);
        const limit = Number(params.limit ?? 100);
        // 1. 只读校验：必须以SELECT开头
        const trimmed = sql.trim().toLowerCase();
        if (!trimmed.startsWith('select')) {
            throw new Error('仅允许执行SELECT查询语句，禁止写操作');
        }
        // 2. 禁止关键词校验
        for (const keyword of DbQueryTool_1.FORBIDDEN_KEYWORDS) {
            const regex = new RegExp(`\\b${keyword}\\b`, 'i');
            if (regex.test(sql)) {
                throw new Error(`SQL包含禁止的写操作关键字: ${keyword}`);
            }
        }
        // 3. 表名白名单校验
        const tableMatches = sql.match(/\bfrom\s+([a-zA-Z_][a-zA-Z0-9_]*)/i);
        if (tableMatches) {
            const tableName = tableMatches[1].toLowerCase();
            if (!DbQueryTool_1.ALLOWED_TABLES.includes(tableName)) {
                throw new Error(`不允许查询表: ${tableName}，允许的表: ${DbQueryTool_1.ALLOWED_TABLES.join(', ')}`);
            }
        }
        // 4. 执行真实只读查询
        const limitedSql = `${sql.trim().replace(/;$/, '')} LIMIT ${limit}`;
        const startTime = Date.now();
        const rows = await this.prisma.$queryRawUnsafe(limitedSql);
        const durationMs = Date.now() - startTime;
        return {
            sql,
            row_count: Array.isArray(rows) ? rows.length : 0,
            columns: Array.isArray(rows) && rows.length > 0 ? Object.keys(rows[0]) : [],
            rows: Array.isArray(rows) ? rows : [],
            execution_mode: 'real',
            duration_ms: durationMs,
        };
    }
};
exports.DbQueryTool = DbQueryTool;
DbQueryTool.FORBIDDEN_KEYWORDS = [
    'insert', 'update', 'delete', 'drop', 'alter', 'create',
    'truncate', 'replace', 'grant', 'revoke', 'lock', 'unlock',
    'call', 'execute', 'prepare', 'deallocate',
];
DbQueryTool.ALLOWED_TABLES = [
    'users', 'opportunities', 'customers', 'requirements',
    'projects', 'tasks', 'deliveries', 'finance_transactions',
    'cost_records', 'system_logs', 'tool_call_logs',
];
exports.DbQueryTool = DbQueryTool = DbQueryTool_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DbQueryTool);
//# sourceMappingURL=db-query.tool.js.map