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
var FileWriteTool_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileWriteTool = void 0;
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const base_tool_1 = require("./base.tool");
/**
 * 文件写入工具 - 写入文件内容到指定路径
 * 安全约束：限制在workspace目录内，防止路径穿越；自动创建目录
 */
let FileWriteTool = FileWriteTool_1 = class FileWriteTool extends base_tool_1.BaseTool {
    constructor() {
        super({
            name: 'file_write',
            display_name: '文件写入',
            description: '将内容写入项目workspace目录内的文件，自动创建目录。路径限制在工作目录内。',
            category: 'file',
            return_type: 'object',
            timeout_ms: 5000,
            parameters: {
                type: 'object',
                required: ['file_path', 'content'],
                properties: {
                    file_path: {
                        type: 'string',
                        description: '相对于workspace的文件路径',
                        minLength: 1,
                        maxLength: 500,
                    },
                    content: {
                        type: 'string',
                        description: '要写入的文件内容',
                        minLength: 0,
                        maxLength: 2000000,
                    },
                    mode: {
                        type: 'string',
                        description: '写入模式：覆盖(overwrite)或追加(append)',
                        enum: ['overwrite', 'append'],
                        default: 'overwrite',
                    },
                    encoding: {
                        type: 'string',
                        description: '文件编码',
                        enum: ['utf-8', 'utf8', 'ascii'],
                        default: 'utf-8',
                    },
                },
            },
        });
        this.workspaceRoot = path.resolve(process.cwd(), 'workspace');
    }
    async execute(params) {
        const relativePath = String(params.file_path);
        const content = String(params.content ?? '');
        const mode = params.mode || 'overwrite';
        const encoding = params.encoding || 'utf-8';
        // 1. 内容大小校验
        const contentBytes = Buffer.byteLength(content, encoding);
        if (contentBytes > FileWriteTool_1.MAX_CONTENT_SIZE) {
            throw new Error(`内容过大: ${(contentBytes / 1024 / 1024).toFixed(2)}MB，最大允许2MB`);
        }
        // 2. 路径安全校验
        const resolvedPath = this.resolveSafePath(relativePath);
        // 3. 扩展名校验
        const ext = path.extname(resolvedPath).toLowerCase();
        if (ext && !FileWriteTool_1.ALLOWED_EXTENSIONS.includes(ext)) {
            throw new Error(`不支持的文件类型: ${ext}`);
        }
        // 4. 确保目录存在
        const dir = path.dirname(resolvedPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        // 5. 检查是否覆盖已有文件
        const existed = fs.existsSync(resolvedPath);
        const originalSize = existed ? fs.statSync(resolvedPath).size : 0;
        // 6. 写入文件
        if (mode === 'append') {
            fs.appendFileSync(resolvedPath, content, encoding);
        }
        else {
            fs.writeFileSync(resolvedPath, content, encoding);
        }
        const newSize = fs.statSync(resolvedPath).size;
        return {
            file_path: relativePath,
            absolute_path: resolvedPath,
            mode,
            encoding,
            existed_before_write: existed,
            original_size_bytes: originalSize,
            new_size_bytes: newSize,
            bytes_written: contentBytes,
            success: true,
        };
    }
    resolveSafePath(relativePath) {
        const resolved = path.resolve(this.workspaceRoot, relativePath);
        const relative = path.relative(this.workspaceRoot, resolved);
        if (relative.startsWith('..') || path.isAbsolute(relative)) {
            throw new Error(`路径越界，不允许写入workspace之外的文件: ${relativePath}`);
        }
        return resolved;
    }
};
exports.FileWriteTool = FileWriteTool;
FileWriteTool.MAX_CONTENT_SIZE = 2 * 1024 * 1024; // 2MB
FileWriteTool.ALLOWED_EXTENSIONS = [
    '.txt', '.md', '.json', '.csv', '.xml', '.yaml', '.yml',
    '.js', '.ts', '.py', '.java', '.go', '.rs', '.html', '.css',
    '.sql', '.log', '.conf', '.ini',
];
exports.FileWriteTool = FileWriteTool = FileWriteTool_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], FileWriteTool);
//# sourceMappingURL=file-write.tool.js.map