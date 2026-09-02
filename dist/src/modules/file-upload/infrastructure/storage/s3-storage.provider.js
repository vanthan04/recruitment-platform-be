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
exports.S3StorageProvider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_s3_1 = require("@aws-sdk/client-s3");
const crypto_1 = require("crypto");
const path = __importStar(require("path"));
let S3StorageProvider = class S3StorageProvider {
    configService;
    s3Client;
    bucketName;
    region;
    constructor(configService) {
        this.configService = configService;
        this.region = this.configService.get('S3_REGION');
        this.bucketName = this.configService.get('S3_BUCKET');
        this.s3Client = new client_s3_1.S3Client({
            region: this.region,
            credentials: {
                accessKeyId: this.configService.get('S3_ACCESS_KEY'),
                secretAccessKey: this.configService.get('S3_SECRET_KEY'),
            },
            endpoint: this.configService.get('S3_ENDPOINT'),
            forcePathStyle: this.configService.get('S3_FORCE_PATH_STYLE', false),
        });
    }
    async upload(file, folder = 'general') {
        try {
            const fileExtension = path.extname(file.originalname);
            const fileName = `${(0, crypto_1.randomUUID)()}${fileExtension}`;
            const fileKey = `${folder}/${fileName}`;
            const command = new client_s3_1.PutObjectCommand({
                Bucket: this.bucketName,
                Key: fileKey,
                Body: file.buffer,
                ContentType: file.mimetype,
            });
            await this.s3Client.send(command);
            const endpoint = this.configService.get('S3_ENDPOINT');
            if (endpoint) {
                return `${endpoint}/${this.bucketName}/${fileKey}`;
            }
            return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${fileKey}`;
        }
        catch (error) {
            throw new common_1.InternalServerErrorException('Lỗi khi upload lên S3: ' + error.message);
        }
    }
    async delete(fileUrl) {
        try {
            const fileKey = fileUrl.split(`${this.bucketName}/`)[1] || fileUrl.split('.com/')[1];
            if (fileKey) {
                const command = new client_s3_1.DeleteObjectCommand({
                    Bucket: this.bucketName,
                    Key: fileKey,
                });
                await this.s3Client.send(command);
            }
        }
        catch (error) {
            console.error('Không thể xóa file trên S3:', error.message);
        }
    }
};
exports.S3StorageProvider = S3StorageProvider;
exports.S3StorageProvider = S3StorageProvider = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], S3StorageProvider);
//# sourceMappingURL=s3-storage.provider.js.map