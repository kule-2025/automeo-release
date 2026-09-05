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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemStatusTool = void 0;
const common_1 = require("@nestjs/common");
const os = __importStar(require("os"));
const process = __importStar(require("process"));
const base_tool_1 = require("./base.tool");
/**
 * 系统状态工具 - 查询系统健康度、资源使用、运行状态
 */
let SystemStatusTool = class SystemStatusTool extends base_tool_1.BaseTool {
    constructor() {
        super({
            name: 'system_status',
            display_name: '系统状态',
            description: '查询系统运行状态：CPU/内存/磁盘使用率、Node进程状态、运行时长、环境信息。',
            category: 'system',
            return_type: 'object',
            timeout_ms: 3000,
            parameters: {
                type: 'object',
                required: [],
                properties: {
                    detail: {
                        type: 'string',
                        description: '详情级别：basic(基础)、full(完整)',
                        enum: ['basic', 'full'],
                        default: 'basic',
                    },
                },
            },
        });
    }
    async execute(params) {
        const detail = String(params.detail ?? 'basic');
        const cpus = os.cpus();
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const loadAvg = os.loadavg();
        const uptime = process.uptime();
        const memUsage = process.memoryUsage();
        // CPU使用率计算
        const cpuUsage = this.calculateCpuUsage(cpus);
        const basicInfo = {
            action: 'system_status',
            timestamp: new Date().toISOString(),
            hostname: os.hostname(),
            platform: `${os.platform()} ${os.arch()}`,
            os_release: os.release(),
            node_version: process.version,
            uptime_seconds: Math.floor(uptime),
            uptime_human: this.humanizeUptime(uptime),
            cpu: {
                model: cpus[0]?.model || 'unknown',
                cores: cpus.length,
                usage_percent: cpuUsage,
                load_avg_1m: Number(loadAvg[0].toFixed(2)),
                load_avg_5m: Number(loadAvg[1].toFixed(2)),
                load_avg_15m: Number(loadAvg[2].toFixed(2)),
            },
            memory: {
                total_mb: Math.round(totalMem / 1024 / 1024),
                used_mb: Math.round(usedMem / 1024 / 1024),
                free_mb: Math.round(freeMem / 1024 / 1024),
                usage_percent: Number(((usedMem / totalMem) * 100).toFixed(1)),
            },
            process: {
                pid: process.pid,
                memory_rss_mb: Math.round(memUsage.rss / 1024 / 1024),
                memory_heap_used_mb: Math.round(memUsage.heapUsed / 1024 / 1024),
                memory_heap_total_mb: Math.round(memUsage.heapTotal / 1024 / 1024),
            },
            health: this.evaluateHealth(cpuUsage, (usedMem / totalMem) * 100),
        };
        if (detail === 'full') {
            return {
                ...basicInfo,
                detail: 'full',
                network: {
                    interfaces: this.getNetworkInterfaces(),
                },
                disk: {
                    // Node原生os模块不直接提供磁盘信息，返回占位
                    note: '磁盘信息需通过系统命令获取，此处返回系统内存信息',
                },
                environment: {
                    env: process.env.NODE_ENV || 'development',
                    cwd: process.cwd(),
                    exec_path: process.execPath,
                    cpu_count: cpus.length,
                    endianness: os.endianness(),
                    tmp_dir: os.tmpdir(),
                },
            };
        }
        return basicInfo;
    }
    calculateCpuUsage(cpus) {
        if (cpus.length === 0)
            return 0;
        let totalIdle = 0;
        let totalTick = 0;
        for (const cpu of cpus) {
            for (const type of Object.keys(cpu.times)) {
                totalTick += cpu.times[type];
            }
            totalIdle += cpu.times.idle;
        }
        return Number((((totalTick - totalIdle) / totalTick) * 100).toFixed(1));
    }
    evaluateHealth(cpuPercent, memPercent) {
        const issues = [];
        let score = 100;
        if (cpuPercent > 90) {
            issues.push(`CPU使用率过高: ${cpuPercent}%`);
            score -= 30;
        }
        else if (cpuPercent > 70) {
            issues.push(`CPU使用率偏高: ${cpuPercent}%`);
            score -= 10;
        }
        if (memPercent > 90) {
            issues.push(`内存使用率过高: ${memPercent.toFixed(1)}%`);
            score -= 30;
        }
        else if (memPercent > 75) {
            issues.push(`内存使用率偏高: ${memPercent.toFixed(1)}%`);
            score -= 10;
        }
        const status = score > 80 ? 'healthy' : score > 50 ? 'warning' : 'critical';
        return { status, score: Math.max(0, score), issues };
    }
    humanizeUptime(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        const parts = [];
        if (days > 0)
            parts.push(`${days}天`);
        if (hours > 0)
            parts.push(`${hours}小时`);
        if (minutes > 0)
            parts.push(`${minutes}分`);
        parts.push(`${secs}秒`);
        return parts.join('');
    }
    getNetworkInterfaces() {
        const interfaces = os.networkInterfaces();
        const result = {};
        for (const [name, addrs] of Object.entries(interfaces)) {
            if (addrs) {
                result[name] = addrs.map((a) => ({
                    address: a.address,
                    family: a.family,
                    internal: a.internal,
                }));
            }
        }
        return result;
    }
};
exports.SystemStatusTool = SystemStatusTool;
exports.SystemStatusTool = SystemStatusTool = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], SystemStatusTool);
//# sourceMappingURL=system-status.tool.js.map