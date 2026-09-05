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
var CodeExecuteTool_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeExecuteTool = void 0;
const common_1 = require("@nestjs/common");
const vm = __importStar(require("vm"));
const base_tool_1 = require("./base.tool");
/**
 * 代码执行工具 - 执行JavaScript/Python代码片段
 * 安全约束：沙箱隔离(vm模块)、超时保护(默认5秒)、禁止危险操作
 */
let CodeExecuteTool = CodeExecuteTool_1 = class CodeExecuteTool extends base_tool_1.BaseTool {
    constructor() {
        super({
            name: 'code_execute',
            display_name: '代码执行',
            description: '在沙箱中执行JavaScript代码片段，返回stdout和stderr。支持超时保护，禁止访问文件系统和网络。',
            category: 'code',
            return_type: 'object',
            timeout_ms: 10000,
            parameters: {
                type: 'object',
                required: ['code'],
                properties: {
                    code: {
                        type: 'string',
                        description: '要执行的JavaScript代码',
                        minLength: 1,
                        maxLength: 50000,
                    },
                    language: {
                        type: 'string',
                        description: '编程语言，目前支持javascript',
                        enum: ['javascript', 'js'],
                        default: 'javascript',
                    },
                    timeout_ms: {
                        type: 'integer',
                        description: '超时时间毫秒，默认5000，最大15000',
                        minimum: 1000,
                        maximum: 15000,
                        default: 5000,
                    },
                },
            },
        });
    }
    async execute(params) {
        const code = String(params.code);
        const timeout = Math.min(Number(params.timeout_ms ?? CodeExecuteTool_1.DEFAULT_TIMEOUT), 15000);
        // 1. 危险代码检测
        this.detectDangerousCode(code);
        // 2. 收集console输出
        const stdoutLines = [];
        const stderrLines = [];
        const sandboxConsole = {
            log: (...args) => {
                stdoutLines.push(args.map(this.safeStringify).join(' '));
            },
            error: (...args) => {
                stderrLines.push(args.map(this.safeStringify).join(' '));
            },
            warn: (...args) => {
                stdoutLines.push('[WARN] ' + args.map(this.safeStringify).join(' '));
            },
            info: (...args) => {
                stdoutLines.push('[INFO] ' + args.map(this.safeStringify).join(' '));
            },
        };
        // 3. 构建沙箱上下文 - 只暴露安全的全局对象
        const sandbox = {
            console: sandboxConsole,
            Math,
            JSON,
            Date,
            String,
            Number,
            Boolean,
            Array,
            Object,
            RegExp,
            Error,
            TypeError,
            RangeError,
            parseInt,
            parseFloat,
            isNaN,
            isFinite,
            setTimeout: (fn, ms) => {
                // 沙箱内setTimeout不真实异步执行，仅记录
                stdoutLines.push(`[setTimeout] ${ms}ms (沙箱内不执行异步)`);
            },
            clearTimeout: () => undefined,
            Promise,
        };
        // 4. 使用vm模块在沙箱中执行
        let result;
        let executionError = null;
        const startTime = Date.now();
        try {
            const context = vm.createContext(sandbox);
            // 包装代码，捕获最后一个表达式的值作为返回值
            const wrappedCode = `
        (function() {
          ${code}
        })()
      `;
            result = vm.runInContext(wrappedCode, context, {
                timeout,
                displayErrors: true,
            });
        }
        catch (err) {
            const error = err;
            if (error.message.includes('timed out')) {
                executionError = `代码执行超时（超过${timeout}ms），已强制终止`;
            }
            else {
                executionError = `${error.name}: ${error.message}`;
            }
        }
        const durationMs = Date.now() - startTime;
        // 5. 截断过长输出
        const stdout = this.truncateOutput(stdoutLines.join('\n'));
        const stderr = this.truncateOutput(stderrLines.join('\n'));
        return {
            language: 'javascript',
            stdout,
            stderr,
            return_value: this.safeStringify(result),
            success: executionError === null,
            error: executionError,
            duration_ms: durationMs,
            timeout_ms: timeout,
        };
    }
    detectDangerousCode(code) {
        const dangerousPatterns = [
            { pattern: /require\s*\(/, msg: '禁止使用require()导入模块' },
            { pattern: /import\s+/, msg: '禁止使用import导入模块' },
            { pattern: /process\./, msg: '禁止访问process对象' },
            { pattern: /global\./, msg: '禁止访问global对象' },
            { pattern: /__dirname|__filename/, msg: '禁止访问文件路径变量' },
            { pattern: /eval\s*\(/, msg: '禁止使用eval()' },
            { pattern: /Function\s*\(/, msg: '禁止使用Function构造器' },
            { pattern: /child_process/, msg: '禁止访问子进程模块' },
            { pattern: /fs\./, msg: '禁止访问文件系统模块' },
            { pattern: /http\.|https\./, msg: '禁止访问网络模块' },
            { pattern: /while\s*\(\s*true\s*\)/, msg: '检测到无限循环模式' },
            { pattern: /for\s*\(\s*;;\s*\)/, msg: '检测到无限循环模式' },
        ];
        for (const { pattern, msg } of dangerousPatterns) {
            if (pattern.test(code)) {
                throw new Error(`安全检查失败: ${msg}`);
            }
        }
    }
    safeStringify(value) {
        if (value === undefined)
            return 'undefined';
        if (value === null)
            return 'null';
        if (typeof value === 'function')
            return '[Function]';
        try {
            return JSON.stringify(value, null, 2);
        }
        catch {
            return String(value);
        }
    }
    truncateOutput(output) {
        if (output.length > CodeExecuteTool_1.MAX_OUTPUT_LENGTH) {
            return output.substring(0, CodeExecuteTool_1.MAX_OUTPUT_LENGTH) +
                `\n... [输出已截断，共${output.length}字符]`;
        }
        return output;
    }
};
exports.CodeExecuteTool = CodeExecuteTool;
CodeExecuteTool.DEFAULT_TIMEOUT = 5000;
CodeExecuteTool.MAX_OUTPUT_LENGTH = 10000;
exports.CodeExecuteTool = CodeExecuteTool = CodeExecuteTool_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], CodeExecuteTool);
//# sourceMappingURL=code-execute.tool.js.map