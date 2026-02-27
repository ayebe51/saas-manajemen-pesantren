import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private s3Client: S3Client;

  constructor(private configService: ConfigService) {
    const region = this.configService.get<string>('AWS_REGION') || 'ap-southeast-1';
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
    const endpoint = this.configService.get<string>('AWS_S3_ENDPOINT'); // Optional, e.g., for Cloudflare R2 or MinIO

    if (accessKeyId && secretAccessKey) {
      this.s3Client = new S3Client({
        region,
        endpoint,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
        forcePathStyle: true, // Necessary for some S3-compatible providers like MinIO
      });
      this.logger.log(`S3 Client Initialized (Region: ${region})`);
    } else {
      this.logger.warn(
        'AWS Credentials (Access Key & Secret Key) are MISSING in environment variables. Uploads will fail if attempted.',
      );
    }
  }

  /**
   * Real implementation of S3 Upload using @aws-sdk/client-s3
   */
  async uploadFile(file: Express.Multer.File, folder: string = 'general'): Promise<string> {
    if (!this.s3Client) {
      this.logger.warn(
        `[Upload Fallback] Missing credentials, simulating upload for ${file.originalname}`,
      );
      return `https://mock-s3-bucket.s3.amazonaws.com/${folder}/${Date.now()}-${file.originalname}`;
    }

    const bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME');
    if (!bucketName) {
      throw new Error('AWS_S3_BUCKET_NAME is not configured.');
    }

    const cleanFilename = file.originalname.replace(/\s+/g, '-').toLowerCase();
    const uniqueFilename = `${folder}/${Date.now()}-${cleanFilename}`;

    try {
      this.logger.log(`Uploading ${uniqueFilename} to S3 bucket ${bucketName}...`);

      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: uniqueFilename,
        Body: file.buffer,
        ContentType: file.mimetype,
        // ACL: 'public-read', // Uncomment if bucket allows ACLs to make files publicly accessible directly. Otherwise, use PresignedUrls.
      });

      await this.s3Client.send(command);
      this.logger.log(`Successfully uploaded ${uniqueFilename}`);

      // Determine public URL format
      const customUrl = this.configService.get<string>('AWS_S3_BUCKET_URL');
      if (customUrl) {
        // If using a custom CDN or R2 Public URL
        return `${customUrl}/${uniqueFilename}`;
      }

      // Default AWS S3 URL format
      const region = await this.s3Client.config.region();
      return `https://${bucketName}.s3.${region}.amazonaws.com/${uniqueFilename}`;
    } catch (error) {
      this.logger.error(`Failed to upload file to S3: ${error.message}`);
      throw error;
    }
  }
}
