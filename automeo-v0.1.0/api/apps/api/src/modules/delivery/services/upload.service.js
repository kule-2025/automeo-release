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
exports.UploadService = void 0;
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
const prisma_service_1 = require("../../../prisma/prisma.service");
const shared_1 = require("../../../../../../packages/shared/src");
/**
 * 上传服务 - 本地存储，生成7天过期下载链接，预留OSS/S3接口
 */
let UploadService = class UploadService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger('UploadService');
        this.deliveryBaseDir = path.join(process.cwd(), 'data', 'deliveries');
        this.ensureDir(this.deliveryBaseDir);
    }
    /**
     * 上传交付文件（本地存储）
     * 预留OSS/S3接口：生产环境可替换为云存储上传
     */
    async upload(deliveryId, projectId, filePath, fileName, fileType) {
        this.logger.log(`上传交付文件: ${fileName}`);
        const fileSize = fs.existsSync(filePath) ? fs.statSync(filePath).size : 0;
        // 生成7天过期下载链接
        const expiresAt = new Date(Date.now() + shared_1.DELIVERY_LINK_EXPIRES * 1000);
        const token = this.generateToken(deliveryId, fileName);
        const downloadUrl = `/api/v1/deliveries/${deliveryId}/download?token=${token}&expires=${expiresAt.getTime()}`;
        // 保存DeliveryFile记录
        await this.prisma.deliveryFile.create({
            data: {
                delivery_id: deliveryId,
                file_name: fileName,
                file_path: filePath,
                file_size: fileSize,
                file_type: fileType,
            },
        });
        this.logger.log(`文件上传完成: ${fileName}, 大小=${fileSize}bytes, 过期=${expiresAt.toISOString()}`);
        return { download_url: downloadUrl, file_size: fileSize, expires_at: expiresAt };
    }
    /**
     * 预留OSS/S3上传接口
     */
    async uploadToOSS(filePath, objectKey) {
        // TODO: 生产环境接入阿里云OSS / AWS S3
        this.logger.log(`OSS上传(预留): ${objectKey}`);
        return {
            url: `https://oss.example.com/${objectKey}`,
            etag: this.generateToken(filePath, objectKey).substring(0, 32),
        };
    }
    /**
     * 获取交付文件列表
     */
    async getFiles(deliveryId) {
        return this.prisma.deliveryFile.findMany({
            where: { delivery_id: deliveryId },
            orderBy: { created_at: 'desc' },
        });
    }
    generateToken(deliveryId, fileName) {
        return crypto
            .createHash('md5')
            .update(`${deliveryId}:${fileName}:${Date.now()}`)
            .digest('hex');
    }
    ensureDir(dir) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }
};
exports.UploadService = UploadService;
exports.UploadService = UploadService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UploadService);
//# sourceMappingURL=upload.service.js.map