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
var UploadService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_s3_1 = require("@aws-sdk/client-s3");
let UploadService = UploadService_1 = class UploadService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(UploadService_1.name);
        const region = this.configService.get('AWS_REGION') || 'ap-southeast-1';
        const accessKeyId = this.configService.get('AWS_ACCESS_KEY_ID');
        const secretAccessKey = this.configService.get('AWS_SECRET_ACCESS_KEY');
        const endpoint = this.configService.get('AWS_S3_ENDPOINT');
        if (accessKeyId && secretAccessKey) {
            this.s3Client = new client_s3_1.S3Client({
                region,
                endpoint,
                credentials: {
                    accessKeyId,
                    secretAccessKey,
                },
                forcePathStyle: true,
            });
            this.logger.log(`S3 Client Initialized (Region: ${region})`);
        }
        else {
            this.logger.warn('AWS Credentials (Access Key & Secret Key) are MISSING in environment variables. Uploads will fail if attempted.');
        }
    }
    async uploadFile(file, folder = 'general') {
        if (!this.s3Client) {
            this.logger.warn(`[Upload Fallback] Missing credentials, simulating upload for ${file.originalname}`);
            return `https://mock-s3-bucket.s3.amazonaws.com/${folder}/${Date.now()}-${file.originalname}`;
        }
        const bucketName = this.configService.get('AWS_S3_BUCKET_NAME');
        if (!bucketName) {
            throw new Error('AWS_S3_BUCKET_NAME is not configured.');
        }
        const cleanFilename = file.originalname.replace(/\s+/g, '-').toLowerCase();
        const uniqueFilename = `${folder}/${Date.now()}-${cleanFilename}`;
        try {
            this.logger.log(`Uploading ${uniqueFilename} to S3 bucket ${bucketName}...`);
            const command = new client_s3_1.PutObjectCommand({
                Bucket: bucketName,
                Key: uniqueFilename,
                Body: file.buffer,
                ContentType: file.mimetype,
            });
            await this.s3Client.send(command);
            this.logger.log(`Successfully uploaded ${uniqueFilename}`);
            const customUrl = this.configService.get('AWS_S3_BUCKET_URL');
            if (customUrl) {
                return `${customUrl}/${uniqueFilename}`;
            }
            const region = await this.s3Client.config.region();
            return `https://${bucketName}.s3.${region}.amazonaws.com/${uniqueFilename}`;
        }
        catch (error) {
            this.logger.error(`Failed to upload file to S3: ${error.message}`);
            throw error;
        }
    }
};
exports.UploadService = UploadService;
exports.UploadService = UploadService = UploadService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], UploadService);
//# sourceMappingURL=upload.service.js.map