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
exports.JsonParseTool = void 0;
const common_1 = require("@nestjs/common");
const base_tool_1 = require("./base.tool");
/**
 * JSON解析工具（扩展工具）- 解析、验证、格式化JSON数据
 * 支持：JSON解析、Schema校验、格式化、压缩、路径查询(JSONPath简化版)
 */
let JsonParseTool = class JsonParseTool extends base_tool_1.BaseTool {
    constructor() {
        super({
            name: 'json_parse',
            display_name: 'JSON解析',
            description: '解析、验证、格式化JSON数据，支持JSONPath路径查询和数据提取。',
            category: 'system',
            return_type: 'object',
            timeout_ms: 3000,
            parameters: {
                type: 'object',
                required: ['action', 'json_input'],
                properties: {
                    action: {
                        type: 'string',
                        description: '操作类型',
                        enum: ['parse', 'format', 'minify', 'validate', 'query'],
                        default: 'parse',
                    },
                    json_input: {
                        type: 'string',
                        description: 'JSON字符串或可序列化的对象',
                        minLength: 1,
                        maxLength: 100000,
                    },
                    path: {
                        type: 'string',
                        description: 'JSONPath路径，如 $.data.items[0].name（query操作时使用）',
                    },
                    indent: {
                        type: 'integer',
                        description: '格式化缩进空格数，默认2',
                        minimum: 0,
                        maximum: 8,
                        default: 2,
                    },
                },
            },
        });
    }
    async execute(params) {
        const action = String(params.action ?? 'parse');
        const jsonInput = String(params.json_input);
        // 解析JSON
        let parsed;
        try {
            parsed = JSON.parse(jsonInput);
        }
        catch (err) {
            const error = err;
            throw new Error(`JSON解析失败: ${error.message}`);
        }
        switch (action) {
            case 'parse':
                return {
                    action: 'parse',
                    valid: true,
                    type: this.getJsonType(parsed),
                    size_bytes: Buffer.byteLength(jsonInput, 'utf-8'),
                    keys: this.extractKeys(parsed),
                    parsed,
                };
            case 'format': {
                const indent = Number(params.indent ?? 2);
                const formatted = JSON.stringify(parsed, null, indent);
                return {
                    action: 'format',
                    valid: true,
                    original_size: jsonInput.length,
                    formatted_size: formatted.length,
                    formatted,
                };
            }
            case 'minify': {
                const minified = JSON.stringify(parsed);
                return {
                    action: 'minify',
                    valid: true,
                    original_size: jsonInput.length,
                    minified_size: minified.length,
                    compression_ratio: Number(((1 - minified.length / jsonInput.length) * 100).toFixed(1)),
                    minified,
                };
            }
            case 'validate':
                return {
                    action: 'validate',
                    valid: true,
                    type: this.getJsonType(parsed),
                    size_bytes: Buffer.byteLength(jsonInput, 'utf-8'),
                    structure: this.analyzeStructure(parsed),
                };
            case 'query': {
                const path = String(params.path ?? '');
                if (!path) {
                    throw new Error('query操作需要提供path参数');
                }
                const result = this.jsonPathQuery(parsed, path);
                return {
                    action: 'query',
                    path,
                    found: result !== undefined,
                    result,
                    result_type: this.getJsonType(result),
                };
            }
            default:
                throw new Error(`不支持的操作: ${action}`);
        }
    }
    getJsonType(value) {
        if (value === null)
            return 'null';
        if (Array.isArray(value))
            return 'array';
        return typeof value;
    }
    extractKeys(value, prefix = '') {
        if (value === null || typeof value !== 'object')
            return [];
        if (Array.isArray(value)) {
            if (value.length > 0) {
                return this.extractKeys(value[0], `${prefix}[0]`);
            }
            return [];
        }
        const keys = [];
        for (const [k, v] of Object.entries(value)) {
            const fullKey = prefix ? `${prefix}.${k}` : k;
            keys.push(fullKey);
            if (v !== null && typeof v === 'object') {
                keys.push(...this.extractKeys(v, fullKey));
            }
        }
        return keys.slice(0, 50); // 限制返回数量
    }
    analyzeStructure(value, depth = 0) {
        if (depth > 5)
            return { type: this.getJsonType(value), note: '深度超限' };
        if (value === null || typeof value !== 'object') {
            return { type: this.getJsonType(value), value: typeof value === 'string' ? String(value).substring(0, 100) : value };
        }
        if (Array.isArray(value)) {
            return {
                type: 'array',
                length: value.length,
                element_type: value.length > 0 ? this.getJsonType(value[0]) : 'empty',
                sample: value.length > 0 ? this.analyzeStructure(value[0], depth + 1) : null,
            };
        }
        const obj = value;
        return {
            type: 'object',
            key_count: Object.keys(obj).length,
            keys: Object.keys(obj).slice(0, 20),
            properties: Object.fromEntries(Object.entries(obj).slice(0, 10).map(([k, v]) => [k, this.analyzeStructure(v, depth + 1)])),
        };
    }
    jsonPathQuery(obj, path) {
        // 简化版JSONPath：支持 $.key、$.key.subkey、$.array[index]
        let current = obj;
        const cleanPath = path.replace(/^\$\.?/, '');
        if (!cleanPath)
            return current;
        const segments = cleanPath.split(/\.|\[|\]/).filter(Boolean);
        for (const segment of segments) {
            if (current === null || current === undefined)
                return undefined;
            if (Array.isArray(current)) {
                const index = parseInt(segment, 10);
                if (isNaN(index))
                    return undefined;
                current = current[index];
            }
            else if (typeof current === 'object') {
                current = current[segment];
            }
            else {
                return undefined;
            }
        }
        return current;
    }
};
exports.JsonParseTool = JsonParseTool;
exports.JsonParseTool = JsonParseTool = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], JsonParseTool);
//# sourceMappingURL=json-parse.tool.js.map