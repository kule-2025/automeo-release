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
exports.PackageService = void 0;
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
const workspace_manager_1 = require("../../project/workspace/workspace-manager");
/**
 * 打包服务 - 压缩项目目录为zip，生成README，计算hash
 */
let PackageService = class PackageService {
    constructor(workspaceManager) {
        this.workspaceManager = workspaceManager;
        this.logger = new common_1.Logger('PackageService');
        this.deliveryBaseDir = path.join(process.cwd(), 'data', 'deliveries');
        this.ensureDir(this.deliveryBaseDir);
    }
    /**
     * 打包项目目录
     */
    async pack(projectId, version, projectName) {
        this.logger.log(`开始打包项目: ${projectName} v${version}`);
        const projectDir = this.workspaceManager.getProjectDir(projectId);
        const outputDir = path.join(this.deliveryBaseDir, projectId);
        this.ensureDir(outputDir);
        // 1. 生成README.md
        const readmePath = path.join(outputDir, 'README.md');
        const readmeContent = this.generateReadme(projectName, version, projectId);
        fs.writeFileSync(readmePath, readmeContent, 'utf-8');
        // 2. 打包为zip（开发环境用manifest代替）
        const zipPath = path.join(outputDir, `${projectName}-v${version}.zip`);
        await this.workspaceManager.packZip(projectId, zipPath);
        // 3. 计算文件hash
        const fileHash = this.calculateFileHash(zipPath);
        const fileSize = fs.existsSync(zipPath) ? fs.statSync(zipPath).size : 0;
        this.logger.log(`打包完成: ${zipPath}, hash=${fileHash}, size=${fileSize}bytes`);
        return { zip_path: zipPath, file_hash: fileHash, file_size: fileSize, readme_path: readmePath };
    }
    /**
     * 生成README.md
     */
    generateReadme(projectName, version, projectId) {
        const date = new Date().toISOString().split('T')[0];
        return `# ${projectName}

## 版本信息
- 版本号: v${version}
- 项目ID: ${projectId}
- 交付日期: ${date}

## 交付物清单
- 源代码包
- 文档
- 部署说明

## 部署说明
1. 解压代码包
2. 安装依赖: \`npm install\`
3. 配置环境变量
4. 启动服务: \`npm start\`

## 技术支持
如有问题请联系客服。

---
*由全自动经营管理系统自动生成*
`;
    }
    /**
     * 计算文件SHA256 hash
     */
    calculateFileHash(filePath) {
        if (!fs.existsSync(filePath)) {
            return crypto.createHash('sha256').update(filePath).digest('hex');
        }
        const content = fs.readFileSync(filePath);
        return crypto.createHash('sha256').update(content).digest('hex');
    }
    ensureDir(dir) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }
};
exports.PackageService = PackageService;
exports.PackageService = PackageService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [workspace_manager_1.WorkspaceManager])
], PackageService);
//# sourceMappingURL=package.service.js.map