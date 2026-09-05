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
exports.TimeDateTool = void 0;
const common_1 = require("@nestjs/common");
const base_tool_1 = require("./base.tool");
/**
 * 时间日期工具 - 获取当前时间、日期格式化、时间差计算
 */
let TimeDateTool = class TimeDateTool extends base_tool_1.BaseTool {
    constructor() {
        super({
            name: 'time_date',
            display_name: '时间日期',
            description: '获取当前时间、日期格式化、时间差计算、时区转换。',
            category: 'time',
            return_type: 'object',
            timeout_ms: 2000,
            parameters: {
                type: 'object',
                required: ['action'],
                properties: {
                    action: {
                        type: 'string',
                        description: '操作类型',
                        enum: ['now', 'format', 'diff', 'add', 'timezone'],
                        default: 'now',
                    },
                    format: {
                        type: 'string',
                        description: '日期格式，如 YYYY-MM-DD HH:mm:ss',
                        default: 'YYYY-MM-DD HH:mm:ss',
                    },
                    timestamp: {
                        type: 'string',
                        description: '要格式化/计算的日期时间字符串',
                    },
                    timestamp2: {
                        type: 'string',
                        description: '时间差计算的第二个时间',
                    },
                    unit: {
                        type: 'string',
                        description: '时间差单位',
                        enum: ['ms', 'seconds', 'minutes', 'hours', 'days'],
                        default: 'days',
                    },
                    amount: {
                        type: 'integer',
                        description: '要添加的时间数量',
                        minimum: -100000,
                        maximum: 100000,
                    },
                    add_unit: {
                        type: 'string',
                        description: '添加的时间单位',
                        enum: ['ms', 'seconds', 'minutes', 'hours', 'days', 'months', 'years'],
                        default: 'days',
                    },
                    timezone: {
                        type: 'string',
                        description: '目标时区，如 Asia/Shanghai, America/New_York',
                        default: 'Asia/Shanghai',
                    },
                },
            },
        });
    }
    async execute(params) {
        const action = String(params.action ?? 'now');
        switch (action) {
            case 'now':
                return this.getNow(params);
            case 'format':
                return this.formatDate(params);
            case 'diff':
                return this.calculateDiff(params);
            case 'add':
                return this.addTime(params);
            case 'timezone':
                return this.convertTimezone(params);
            default:
                throw new Error(`不支持的操作: ${action}`);
        }
    }
    getNow(params) {
        const format = String(params.format ?? 'YYYY-MM-DD HH:mm:ss');
        const now = new Date();
        return {
            action: 'now',
            timestamp: now.getTime(),
            iso: now.toISOString(),
            formatted: this.formatDateTime(now, format),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            utc_offset: now.getTimezoneOffset(),
            day_of_week: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][now.getDay()],
            date: {
                year: now.getFullYear(),
                month: now.getMonth() + 1,
                day: now.getDate(),
                hour: now.getHours(),
                minute: now.getMinutes(),
                second: now.getSeconds(),
            },
        };
    }
    formatDate(params) {
        const timestamp = String(params.timestamp ?? '');
        const format = String(params.format ?? 'YYYY-MM-DD HH:mm:ss');
        if (!timestamp) {
            throw new Error('format操作需要提供timestamp参数');
        }
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) {
            throw new Error(`无效的日期时间: ${timestamp}`);
        }
        return {
            action: 'format',
            input: timestamp,
            timestamp: date.getTime(),
            formatted: this.formatDateTime(date, format),
            iso: date.toISOString(),
        };
    }
    calculateDiff(params) {
        const ts1 = String(params.timestamp ?? '');
        const ts2 = String(params.timestamp2 ?? '');
        const unit = String(params.unit ?? 'days');
        if (!ts1 || !ts2) {
            throw new Error('diff操作需要提供timestamp和timestamp2参数');
        }
        const d1 = new Date(ts1);
        const d2 = new Date(ts2);
        if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
            throw new Error('无效的日期时间格式');
        }
        const diffMs = Math.abs(d2.getTime() - d1.getTime());
        const unitMultipliers = {
            ms: 1,
            seconds: 1000,
            minutes: 60000,
            hours: 3600000,
            days: 86400000,
        };
        return {
            action: 'diff',
            timestamp1: ts1,
            timestamp2: ts2,
            diff_ms: diffMs,
            diff_unit: unit,
            diff_value: Number((diffMs / (unitMultipliers[unit] || 1)).toFixed(4)),
            human_readable: this.humanizeDuration(diffMs),
        };
    }
    addTime(params) {
        const timestamp = String(params.timestamp ?? new Date().toISOString());
        const amount = Number(params.amount ?? 0);
        const unit = String(params.add_unit ?? 'days');
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) {
            throw new Error(`无效的日期时间: ${timestamp}`);
        }
        switch (unit) {
            case 'ms':
                date.setTime(date.getTime() + amount);
                break;
            case 'seconds':
                date.setSeconds(date.getSeconds() + amount);
                break;
            case 'minutes':
                date.setMinutes(date.getMinutes() + amount);
                break;
            case 'hours':
                date.setHours(date.getHours() + amount);
                break;
            case 'days':
                date.setDate(date.getDate() + amount);
                break;
            case 'months':
                date.setMonth(date.getMonth() + amount);
                break;
            case 'years':
                date.setFullYear(date.getFullYear() + amount);
                break;
        }
        return {
            action: 'add',
            input: timestamp,
            amount,
            unit,
            result_iso: date.toISOString(),
            result_formatted: this.formatDateTime(date, 'YYYY-MM-DD HH:mm:ss'),
            result_timestamp: date.getTime(),
        };
    }
    convertTimezone(params) {
        const timestamp = String(params.timestamp ?? new Date().toISOString());
        const timezone = String(params.timezone ?? 'Asia/Shanghai');
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) {
            throw new Error(`无效的日期时间: ${timestamp}`);
        }
        try {
            const formatted = new Intl.DateTimeFormat('zh-CN', {
                timeZone: timezone,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
            }).format(date);
            return {
                action: 'timezone',
                input: timestamp,
                target_timezone: timezone,
                local_time: this.formatDateTime(date, 'YYYY-MM-DD HH:mm:ss'),
                target_time: formatted,
            };
        }
        catch {
            throw new Error(`无效的时区: ${timezone}`);
        }
    }
    formatDateTime(date, format) {
        const pad = (n) => String(n).padStart(2, '0');
        return format
            .replace('YYYY', String(date.getFullYear()))
            .replace('MM', pad(date.getMonth() + 1))
            .replace('DD', pad(date.getDate()))
            .replace('HH', pad(date.getHours()))
            .replace('mm', pad(date.getMinutes()))
            .replace('ss', pad(date.getSeconds()))
            .replace('SSS', pad(date.getMilliseconds()));
    }
    humanizeDuration(ms) {
        if (ms < 1000)
            return `${ms}毫秒`;
        if (ms < 60000)
            return `${Math.floor(ms / 1000)}秒`;
        if (ms < 3600000)
            return `${Math.floor(ms / 60000)}分${Math.floor((ms % 60000) / 1000)}秒`;
        if (ms < 86400000)
            return `${Math.floor(ms / 3600000)}小时${Math.floor((ms % 3600000) / 60000)}分`;
        return `${Math.floor(ms / 86400000)}天${Math.floor((ms % 86400000) / 3600000)}小时`;
    }
};
exports.TimeDateTool = TimeDateTool;
exports.TimeDateTool = TimeDateTool = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], TimeDateTool);
//# sourceMappingURL=time-date.tool.js.map