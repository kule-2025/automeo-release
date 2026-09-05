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
var HttpRequestTool_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpRequestTool = void 0;
const common_1 = require("@nestjs/common");
const https = __importStar(require("https"));
const http = __importStar(require("http"));
const base_tool_1 = require("./base.tool");
/**
 * HTTP请求工具 - 发送GET/POST请求
 * 安全约束：白名单域名校验，禁止访问内网/本地地址，超时保护
 */
let HttpRequestTool = HttpRequestTool_1 = class HttpRequestTool extends base_tool_1.BaseTool {
    constructor() {
        super({
            name: 'http_request',
            display_name: 'HTTP请求',
            description: '发送HTTP GET/POST请求到白名单域名，返回响应状态码和响应体。',
            category: 'http',
            return_type: 'object',
            timeout_ms: 15000,
            parameters: {
                type: 'object',
                required: ['url', 'method'],
                properties: {
                    url: {
                        type: 'string',
                        description: '请求URL，必须是白名单域名',
                        minLength: 1,
                        maxLength: 2000,
                    },
                    method: {
                        type: 'string',
                        description: 'HTTP方法',
                        enum: ['GET', 'POST', 'PUT', 'DELETE'],
                        default: 'GET',
                    },
                    headers: {
                        type: 'object',
                        description: '请求头',
                    },
                    body: {
                        type: 'string',
                        description: '请求体（POST/PUT时使用）',
                        maxLength: 10000,
                    },
                    timeout_ms: {
                        type: 'integer',
                        description: '超时时间毫秒，默认10000，最大30000',
                        minimum: 1000,
                        maximum: 30000,
                        default: 10000,
                    },
                },
            },
        });
    }
    async execute(params) {
        const url = String(params.url);
        const method = String(params.method ?? 'GET').toUpperCase();
        const headers = params.headers || {};
        const body = params.body !== undefined ? String(params.body) : undefined;
        const timeout = Math.min(Number(params.timeout_ms ?? 10000), 30000);
        // 1. URL格式校验
        let parsedUrl;
        try {
            parsedUrl = new URL(url);
        }
        catch {
            throw new Error(`无效的URL: ${url}`);
        }
        // 2. 协议校验
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
            throw new Error(`不支持的协议: ${parsedUrl.protocol}，仅支持HTTP/HTTPS`);
        }
        // 3. 域名白名单校验
        const hostname = parsedUrl.hostname.toLowerCase();
        const isAllowed = HttpRequestTool_1.ALLOWED_DOMAINS.some((domain) => hostname === domain || hostname.endsWith('.' + domain));
        if (!isAllowed) {
            throw new Error(`域名不在白名单中: ${hostname}。允许的域名: ${HttpRequestTool_1.ALLOWED_DOMAINS.join(', ')}`);
        }
        // 4. 内网/本地地址阻断
        for (const blocked of HttpRequestTool_1.BLOCKED_HOSTS) {
            if (hostname === blocked || hostname.startsWith(blocked)) {
                throw new Error(`禁止访问内网/本地地址: ${hostname}`);
            }
        }
        // 5. 发送请求（使用Node原生http/https模块）
        try {
            const result = await this.sendRequest(parsedUrl, method, headers, body, timeout);
            return {
                url,
                method,
                status_code: result.statusCode,
                status_text: result.statusMessage,
                headers: result.responseHeaders,
                body: result.body,
                body_length: result.body.length,
                duration_ms: result.durationMs,
            };
        }
        catch (err) {
            const error = err;
            throw new Error(`HTTP请求失败: ${error.message}`);
        }
    }
    sendRequest(url, method, headers, body, timeout) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            const client = url.protocol === 'https:' ? https : http;
            const req = client.request({
                hostname: url.hostname,
                port: url.port || (url.protocol === 'https:' ? 443 : 80),
                path: url.pathname + url.search,
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'ABS-Tool-HTTP/1.0',
                    ...headers,
                },
                timeout,
            }, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk.toString();
                    // 限制响应体大小
                    if (data.length > 100000) {
                        req.destroy();
                        reject(new Error('响应体超过100KB限制'));
                    }
                });
                res.on('end', () => {
                    resolve({
                        statusCode: res.statusCode || 0,
                        statusMessage: res.statusMessage || '',
                        responseHeaders: res.headers,
                        body: data,
                        durationMs: Date.now() - startTime,
                    });
                });
            });
            req.on('error', (err) => reject(err));
            req.on('timeout', () => {
                req.destroy();
                reject(new Error(`请求超时（${timeout}ms）`));
            });
            if (body && (method === 'POST' || method === 'PUT')) {
                req.write(body);
            }
            req.end();
        });
    }
};
exports.HttpRequestTool = HttpRequestTool;
HttpRequestTool.ALLOWED_DOMAINS = [
    'api.github.com',
    'jsonplaceholder.typicode.com',
    'api.open-meteo.com',
    'httpbin.org',
    'api.coindesk.com',
    'restcountries.com',
    'api.exchangerate-api.com',
];
HttpRequestTool.BLOCKED_HOSTS = [
    'localhost', '127.0.0.1', '0.0.0.0', '::1',
    '10.', '172.16.', '172.17.', '172.18.', '172.19.',
    '172.20.', '172.21.', '172.22.', '172.23.', '172.24.',
    '172.25.', '172.26.', '172.27.', '172.28.', '172.29.',
    '172.30.', '172.31.', '192.168.', '169.254.',
];
exports.HttpRequestTool = HttpRequestTool = HttpRequestTool_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], HttpRequestTool);
//# sourceMappingURL=http-request.tool.js.map