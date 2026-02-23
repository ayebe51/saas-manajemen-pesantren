import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(private configService: ConfigService) {}

  /**
   * Mock implementation of S3 Upload.
   * In a real application, you would use aws-sdk/client-s3 to push the buffer to S3.
   */
  async uploadFile(file: Express.Multer.File, folder: string = 'general'): Promise<string> {
    this.logger.log(`[Upload Mock] Received file: ${file.originalname} (${file.size} bytes)`);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Construct a mock URL
    const bucketUrl = this.configService.get<string>('AWS_S3_BUCKET_URL') || 'https://mock-s3-bucket.s3.amazonaws.com';
    const cleanFilename = file.originalname.replace(/\s+/g, '-').toLowerCase();
    const uniqueFilename = `${Date.now()}-${cleanFilename}`;
    
    const fileUrl = `${bucketUrl}/${folder}/${uniqueFilename}`;
    
    this.logger.log(`[Upload Mock] File "uploaded" to: ${fileUrl}`);
    
    return fileUrl;
  }
}
