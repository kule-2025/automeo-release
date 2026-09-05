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
var FileReadTool_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileReadTool = void 0;
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const base_tool_1 = require("./base.tool");
/**
 * 文件读取工具 - 读取指定路径文件内容
 * 安全约束：限制在项目workspace目录内，防止路径穿越攻击
 */
let FileReadTool = FileReadTool_1 = class FileReadTool extends base_tool_1.BaseTool {
    constructor() {
        super({
            name: 'file_read',
            display_name: '文件读取',
            description: '读取项目workspace目录内的文件内容，支持文本文件。路径限制在工作目录内。',
            category: 'file',
            return_type: 'object',
            timeout_ms: 5000,
            parameters: {
                type: 'object',
                required: ['file_path'],
                properties: {
                    file_path: {
                        type: 'string',
                        description: '相对于workspace的文件路径，如 src/config.json',
                        minLength: 1,
                        maxLength: 500,
                    },
                    encoding: {
                        type: 'string',
                        description: '文件编码，默认utf-8',
                        enum: ['utf-8', 'utf8', 'ascii', 'base64'],
                        default: 'utf-8',
                    },
                },
            },
        });
        // workspace根目录：项目根目录下的workspace
        this.workspaceRoot = path.resolve(process.cwd(), 'workspace');
    }
    async execute(params) {
        const relativePath = String(params.file_path);
        const encoding = params.encoding || 'utf-8';
        // 1. 路径安全校验：防止路径穿越
        const resolvedPath = this.resolveSafePath(relativePath);
        // 2. 文件存在性校验
        if (!fs.existsSync(resolvedPath)) {
            throw new Error(`文件不存在: ${relativePath}`);
        }
        // 3. 必须是文件而非目录
        const stat = fs.statSync(resolvedPath);
        if (!stat.isFile()) {
            throw new Error(`路径不是文件: ${relativePath}`);
        }
        // 4. 文件大小校验
        if (stat.size > FileReadTool_1.MAX_FILE_SIZE) {
            throw new Error(`文件过大: ${(stat.size / 1024 / 1024).toFixed(2)}MB，最大允许5MB`);
        }
        // 5. 扩展名校验
        const ext = path.extname(resolvedPath).toLowerCase();
        if (ext && !FileReadTool_1.ALLOWED_EXTENSIONS.includes(ext)) {
            throw new Error(`不支持的文件类型: ${ext}`);
        }
        // 6. 读取文件
        const content = fs.readFileSync(resolvedPath, encoding);
        return {
            file_path: relativePath,
            absolute_path: resolvedPath,
            size_bytes: stat.size,
            encoding,
            content,
            line_count: content.split('\n').length,
        };
    }
    /**
     * 解析安全路径，确保在workspace根目录内
     */
    resolveSafePath(relativePath) {
        // 规范化路径，解析 .. 和 .
        const resolved = path.resolve(this.workspaceRoot, relativePath);
        // 确保解析后的路径在workspace根目录内
        const relative = path.relative(this.workspaceRoot, resolved);
        if (relative.startsWith('..') || path.isAbsolute(relative)) {
            throw new Error(`路径越界，不允许访问workspace之外的文件: ${relativePath}`);
        }
        return resolved;
    }
};
exports.FileReadTool = FileReadTool;
FileReadTool.MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
FileReadTool.ALLOWED_EXTENSIONS = [
    '.txt', '.md', '.json', '.csv', '.xml', '.yaml', '.yml',
    '.js', '.ts', '.py', '.java', '.go', '.rs', '.html', '.css',
    '.sql', '.log', '.env', '.conf', '.ini',
];
exports.FileReadTool = FileReadTool = FileReadTool_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], FileReadTool);
//# sourceMappingURL=file-read.tool.js.map