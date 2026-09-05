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
exports.WorkspaceManager = void 0;
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * 工作区管理器 - 每个项目独立目录
 */
let WorkspaceManager = class WorkspaceManager {
    constructor() {
        this.logger = new common_1.Logger('WorkspaceManager');
        this.baseDir = path.join(process.cwd(), 'data', 'workspace');
        this.ensureDir(this.baseDir);
    }
    /**
     * 创建项目目录
     */
    createProjectDir(projectId) {
        const projectDir = path.join(this.baseDir, projectId);
        this.ensureDir(projectDir);
        this.ensureDir(path.join(projectDir, 'src'));
        this.ensureDir(path.join(projectDir, 'tests'));
        this.ensureDir(path.join(projectDir, 'docs'));
        this.logger.log(`项目工作区已创建: ${projectDir}`);
        return projectDir;
    }
    /**
     * 写入文件
     */
    writeFiles(projectId, files) {
        const projectDir = this.getProjectDir(projectId);
        const writtenPaths = [];
        for (const file of files) {
            const fullPath = path.join(projectDir, file.path);
            const dir = path.dirname(fullPath);
            this.ensureDir(dir);
            fs.writeFileSync(fullPath, file.content, 'utf-8');
            writtenPaths.push(file.path);
            this.logger.log(`文件已写入: ${file.path}`);
        }
        return writtenPaths;
    }
    /**
     * 读取项目目录下所有文件
     */
    readAllFiles(projectId) {
        const projectDir = this.getProjectDir(projectId);
        const result = [];
        this.walkDir(projectDir, projectDir, result);
        return result;
    }
    /**
     * 打包项目为zip（开发环境返回目录路径，生产用archiver）
     */
    async packZip(projectId, outputPath) {
        const projectDir = this.getProjectDir(projectId);
        this.ensureDir(path.dirname(outputPath));
        // 开发环境：创建一个包含文件清单的标记文件代替真实zip
        const files = this.readAllFiles(projectId);
        const manifest = {
            project_id: projectId,
            file_count: files.length,
            files: files.map((f) => ({ path: f.path, size: Buffer.byteLength(f.content, 'utf-8') })),
            packed_at: new Date().toISOString(),
        };
        fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2), 'utf-8');
        this.logger.log(`项目打包完成(模拟): ${outputPath}, 共${files.length}个文件`);
        return outputPath;
    }
    /**
     * 获取项目目录路径
     */
    getProjectDir(projectId) {
        return path.join(this.baseDir, projectId);
    }
    ensureDir(dir) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }
    walkDir(baseDir, currentDir, result) {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(currentDir, entry.name);
            if (entry.isDirectory()) {
                this.walkDir(baseDir, fullPath, result);
            }
            else if (entry.isFile()) {
                const relativePath = path.relative(baseDir, fullPath);
                const content = fs.readFileSync(fullPath, 'utf-8');
                result.push({ path: relativePath, content });
            }
        }
    }
};
exports.WorkspaceManager = WorkspaceManager;
exports.WorkspaceManager = WorkspaceManager = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], WorkspaceManager);
//# sourceMappingURL=workspace-manager.js.map