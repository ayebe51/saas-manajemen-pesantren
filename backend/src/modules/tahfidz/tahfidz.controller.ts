import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CreateMutabaahDto, CreateTahfidzDto } from './dto/tahfidz.dto';
import { TahfidzService } from './tahfidz.service';

@ApiTags('Tahfidz & Mutabaah')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('api/v1/tahfidz')
export class TahfidzController {
  constructor(private readonly tahfidzService: TahfidzService) {}

  @Post()
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'GURU', 'MUSYRIF')
  @ApiOperation({ summary: 'Mencatat setoran tahfidz santri' })
  async createTahfidz(
    @TenantId() tenantId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateTahfidzDto,
  ) {
    return this.tahfidzService.createTahfidz(tenantId, userId, dto);
  }

  @Get('santri/:santriId')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'GURU', 'MUSYRIF', 'WALI')
  @ApiOperation({ summary: 'Melihat riwayat hafalan santri' })
  async getTahfidzHistory(@TenantId() tenantId: string, @Param('santriId') santriId: string) {
    return this.tahfidzService.getTahfidzBySantri(tenantId, santriId);
  }

  @Post('mutabaah')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'GURU', 'MUSYRIF')
  @ApiOperation({ summary: 'Mencatat kegiatan harian (mutabaah) santri' })
  async createMutabaah(
    @TenantId() tenantId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateMutabaahDto,
  ) {
    return this.tahfidzService.createOrUpdateMutabaah(tenantId, userId, dto);
  }

  @Get('mutabaah/santri/:santriId')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'GURU', 'MUSYRIF', 'WALI')
  @ApiOperation({ summary: 'Melihat riwayat mutabaah 30 hari terakhir santri' })
  async getMutabaahHistory(@TenantId() tenantId: string, @Param('santriId') santriId: string) {
    return this.tahfidzService.getMutabaahBySantri(tenantId, santriId);
  }
}
