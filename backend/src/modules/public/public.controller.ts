import { Controller, Post, Body, UseGuards, Req, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity } from '@nestjs/swagger';
import { PublicService } from './public.service';
import { BulkSyncSantriDto } from './dto/public.dto';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { TenantId } from '../../common/decorators/tenant-id.decorator';

@ApiTags('Public & Integrations')
@ApiSecurity('x-api-key') // Swagger API Key auth
@UseGuards(ApiKeyGuard)
@Controller('public')
export class PublicController {
  private readonly logger = new Logger(PublicController.name);

  constructor(private readonly publicService: PublicService) {}

  @Post('sync/santri')
  @ApiOperation({ summary: 'Bulk upsert Santri data from external SIM' })
  async syncSantri(
    @Body() dto: BulkSyncSantriDto,
    @TenantId() tenantId: string,
    @Req() req: any
  ) {
    this.logger.log(`Received bulk sync for ${dto.santri.length} santri at tenant ${tenantId}`);
    return this.publicService.bulkUpsertSantri(tenantId, dto);
  }
}
