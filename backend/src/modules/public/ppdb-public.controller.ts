import { Controller, Post, Body, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PpdbService } from '../ppdb/ppdb.service';
import { PublicCreatePpdbDto } from './dto/public-ppdb.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Public PPDB Portal')
@Controller('public/ppdb')
@Public()
export class PpdbPublicController {
  private readonly logger = new Logger(PpdbPublicController.name);

  constructor(private readonly ppdbService: PpdbService) {}

  @Post('register')
  @ApiOperation({ summary: 'Endpoint publik calon santri untuk mendaftar tanpa login' })
  async register(@Body() dto: PublicCreatePpdbDto) {
    this.logger.log(`Pendaftaran PPDB Publik untuk tenant: ${dto.tenantId}`);
    try {
      // Destructure tenantId out so it's not spread into Prisma data alongside the explicit tenantId param
      const { tenantId, ...createData } = dto;
      const result = await this.ppdbService.create(tenantId, createData);
      return result;
    } catch (error: any) {
      this.logger.error(`Error in PPDB register: ${error.message}`, error.stack);
      throw error;
    }
  }
}
