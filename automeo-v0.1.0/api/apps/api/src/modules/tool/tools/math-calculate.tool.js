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
var MathCalculateTool_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MathCalculateTool = void 0;
const common_1 = require("@nestjs/common");
const base_tool_1 = require("./base.tool");
/**
 * 数学计算工具 - 解析并计算数学表达式
 * 支持：加减乘除、括号、幂运算、常用函数(sin/cos/sqrt/log等)
 * 安全约束：自定义解析器，不使用eval，禁止变量赋值和函数定义
 */
let MathCalculateTool = MathCalculateTool_1 = class MathCalculateTool extends base_tool_1.BaseTool {
    constructor() {
        super({
            name: 'math_calculate',
            display_name: '数学计算',
            description: '解析并计算数学表达式，支持加减乘除、括号、幂运算和常用函数(sin/cos/sqrt/log等)。',
            category: 'math',
            return_type: 'object',
            timeout_ms: 3000,
            parameters: {
                type: 'object',
                required: ['expression'],
                properties: {
                    expression: {
                        type: 'string',
                        description: '数学表达式，如 (2+3)*4、sin(pi/2)、sqrt(16)+2^3',
                        minLength: 1,
                        maxLength: 1000,
                    },
                    precision: {
                        type: 'integer',
                        description: '结果小数位数，默认6',
                        minimum: 0,
                        maximum: 15,
                        default: 6,
                    },
                },
            },
        });
    }
    async execute(params) {
        const expression = String(params.expression);
        const precision = Math.min(Math.max(Number(params.precision ?? 6), 0), 15);
        // 安全检查：禁止赋值和函数定义
        if (/[=;]/.test(expression)) {
            throw new Error('表达式中不允许包含赋值(=)或分号(;)');
        }
        try {
            const result = this.evaluate(expression);
            if (!isFinite(result)) {
                throw new Error('计算结果非有限数（可能除零或溢出）');
            }
            return {
                expression,
                result: Number(result.toFixed(precision)),
                result_full: result,
                precision,
                success: true,
            };
        }
        catch (err) {
            const error = err;
            throw new Error(`数学表达式计算失败: ${error.message}`);
        }
    }
    /**
     * 递归下降解析器 - 安全计算数学表达式
     */
    evaluate(expr) {
        const tokens = this.tokenize(expr);
        let pos = 0;
        const parseExpression = () => {
            let value = parseTerm();
            while (pos < tokens.length && (tokens[pos] === '+' || tokens[pos] === '-')) {
                const op = tokens[pos++];
                const right = parseTerm();
                value = op === '+' ? value + right : value - right;
            }
            return value;
        };
        const parseTerm = () => {
            let value = parsePower();
            while (pos < tokens.length && (tokens[pos] === '*' || tokens[pos] === '/')) {
                const op = tokens[pos++];
                const right = parsePower();
                if (op === '*') {
                    value *= right;
                }
                else {
                    if (right === 0)
                        throw new Error('除零错误');
                    value /= right;
                }
            }
            return value;
        };
        const parsePower = () => {
            const base = parseUnary();
            if (pos < tokens.length && tokens[pos] === '^') {
                pos++;
                const exponent = parsePower(); // 右结合
                return Math.pow(base, exponent);
            }
            return base;
        };
        const parseUnary = () => {
            if (pos < tokens.length && tokens[pos] === '-') {
                pos++;
                return -parseUnary();
            }
            if (pos < tokens.length && tokens[pos] === '+') {
                pos++;
                return parseUnary();
            }
            return parsePrimary();
        };
        const parsePrimary = () => {
            const token = tokens[pos];
            if (token === '(') {
                pos++;
                const value = parseExpression();
                if (tokens[pos] !== ')')
                    throw new Error('缺少右括号');
                pos++;
                return value;
            }
            // 函数调用
            if (typeof token === 'string' && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(token)) {
                const funcName = token.toLowerCase();
                pos++;
                // 常量
                if (funcName in MathCalculateTool_1.CONSTANTS && tokens[pos] !== '(') {
                    return MathCalculateTool_1.CONSTANTS[funcName];
                }
                // 函数
                if (funcName in MathCalculateTool_1.FUNCTIONS) {
                    if (tokens[pos] !== '(')
                        throw new Error(`函数${funcName}需要括号`);
                    pos++;
                    const args = [];
                    if (tokens[pos] !== ')') {
                        args.push(parseExpression());
                        while (pos < tokens.length && tokens[pos] === ',') {
                            pos++;
                            args.push(parseExpression());
                        }
                    }
                    if (tokens[pos] !== ')')
                        throw new Error(`函数${funcName}缺少右括号`);
                    pos++;
                    return MathCalculateTool_1.FUNCTIONS[funcName](args);
                }
                throw new Error(`未知函数或常量: ${funcName}`);
            }
            // 数字
            if (typeof token === 'number') {
                pos++;
                return token;
            }
            throw new Error(`意外的token: ${token}`);
        };
        const result = parseExpression();
        if (pos < tokens.length) {
            throw new Error(`表达式末尾有多余内容: ${tokens.slice(pos).join(' ')}`);
        }
        return result;
    }
    tokenize(expr) {
        const tokens = [];
        let i = 0;
        while (i < expr.length) {
            const char = expr[i];
            // 跳过空白
            if (/\s/.test(char)) {
                i++;
                continue;
            }
            // 数字（含小数和科学计数法）
            if (/[0-9.]/.test(char)) {
                let numStr = '';
                while (i < expr.length && /[0-9.eE+\-]/.test(expr[i])) {
                    // 科学计数法的+/-需要特殊处理
                    if ((expr[i] === '+' || expr[i] === '-') && !/[eE]/.test(expr[i - 1] || '')) {
                        break;
                    }
                    numStr += expr[i];
                    i++;
                }
                const num = parseFloat(numStr);
                if (isNaN(num))
                    throw new Error(`无效数字: ${numStr}`);
                tokens.push(num);
                continue;
            }
            // 标识符（函数名/常量）
            if (/[a-zA-Z_]/.test(char)) {
                let ident = '';
                while (i < expr.length && /[a-zA-Z0-9_]/.test(expr[i])) {
                    ident += expr[i];
                    i++;
                }
                tokens.push(ident);
                continue;
            }
            // 操作符
            if ('+-*/^(),'.includes(char)) {
                tokens.push(char);
                i++;
                continue;
            }
            throw new Error(`无效字符: ${char}`);
        }
        return tokens;
    }
};
exports.MathCalculateTool = MathCalculateTool;
MathCalculateTool.FUNCTIONS = {
    sin: (a) => Math.sin(a[0]),
    cos: (a) => Math.cos(a[0]),
    tan: (a) => Math.tan(a[0]),
    asin: (a) => Math.asin(a[0]),
    acos: (a) => Math.acos(a[0]),
    atan: (a) => Math.atan(a[0]),
    sqrt: (a) => Math.sqrt(a[0]),
    abs: (a) => Math.abs(a[0]),
    log: (a) => Math.log(a[0]),
    log2: (a) => Math.log2(a[0]),
    log10: (a) => Math.log10(a[0]),
    exp: (a) => Math.exp(a[0]),
    floor: (a) => Math.floor(a[0]),
    ceil: (a) => Math.ceil(a[0]),
    round: (a) => Math.round(a[0]),
    min: (a) => Math.min(...a),
    max: (a) => Math.max(...a),
    pow: (a) => Math.pow(a[0], a[1]),
    pi: () => Math.PI,
    e: () => Math.E,
};
MathCalculateTool.CONSTANTS = {
    pi: Math.PI,
    e: Math.E,
};
exports.MathCalculateTool = MathCalculateTool = MathCalculateTool_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], MathCalculateTool);
//# sourceMappingURL=math-calculate.tool.js.map