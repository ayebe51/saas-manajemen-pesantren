import {
  Controller, Post, Body, Logger,
  UseInterceptors, UploadedFile, ParseFilePipe,
  MaxFileSizeValidator, FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { PpdbService } from '../ppdb/ppdb.service';
import { UploadService } from '../upload/upload.service';
import { PublicCreatePpdbDto } from './dto/public-ppdb.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Public PPDB Portal')
@Controller('public/ppdb')
@Public()
export class PpdbPublicController {
  private readonly logger = new Logger(PpdbPublicController.name);

  constructor(
    private readonly ppdbService: PpdbService,
    private readonly uploadService: UploadService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Endpoint publik calon santri untuk mendaftar tanpa login' })
  async register(@Body() dto: PublicCreatePpdbDto) {
    this.logger.log(`Pendaftaran PPDB Publik untuk tenant: ${dto.tenantId}`);
    try {
      const { tenantId, ...fields } = dto;
      // Map legacy flat fields into the new dataCalon JSONB format
      const dataCalon: Record<string, any> = {
        nama_lengkap: (fields as any).fullName ?? (fields as any).nama_lengkap,
        jenis_kelamin: (fields as any).gender ?? (fields as any).jenis_kelamin,
        tanggal_lahir: (fields as any).dob ?? (fields as any).tanggal_lahir,
        sekolah_asal: (fields as any).previousSchool ?? (fields as any).sekolah_asal,
        jalur: (fields as any).pathway ?? (fields as any).jalur,
        no_hp_wali: (fields as any).no_hp_wali ?? '',
        ...fields,
      };
      const result = await this.ppdbService.create(tenantId, { dataCalon });
      return result;
    } catch (error: any) {
      this.logger.error(`Error in PPDB register: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('upload')
  @ApiOperation({ summary: 'Upload dokumen persyaratan PPDB (KK, Akta, Ijazah, Pas Foto)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5_000_000 }), // 5MB
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg|pdf)' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const fileUrl = await this.uploadService.uploadFile(file, 'ppdb-documents');
    return { success: true, data: { url: fileUrl } };
  }
}
