import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AsramaService } from './asrama.service';
import { CreateAsramaDto } from './dto/create-asrama.dto';
import { CreateKamarDto } from './dto/create-kamar.dto';
import { UpdateKamarDto } from './dto/update-kamar.dto';
import { AssignSantriDto } from './dto/assign-santri.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';

@ApiTags('Asrama')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('asrama')
export class AsramaController {
  constructor(private readonly asramaService: AsramaService) {}

  // ─── Asrama ──────────────────────────────────────────────────────────────────

  @Post()
  @Roles('SUPERADMIN', 'Admin_Pesantren', 'Petugas_Asrama')
  @ApiOperation({ summary: 'Buat gedung asrama baru' })
  createAsrama(@TenantId() tenantId: string, @Body() dto: CreateAsramaDto) {
    return this.asramaService.createAsrama(tenantId, dto);
  }

  @Get()
  @Roles('SUPERADMIN', 'Admin_Pesantren', 'Petugas_Asrama', 'Owner')
  @ApiOperation({ summary: 'Daftar semua asrama beserta kamar' })
  findAllAsrama(@TenantId() tenantId: string) {
    return this.asramaService.findAllAsrama(tenantId);
  }

  // ─── Kamar ───────────────────────────────────────────────────────────────────

  @Post('kamar')
  @Roles('SUPERADMIN', 'Admin_Pesantren', 'Petugas_Asrama')
  @ApiOperation({ summary: 'Buat kamar baru di dalam asrama' })
  createKamar(@TenantId() tenantId: string, @Body() dto: CreateKamarDto) {
    return this.asramaService.createKamar(tenantId, dto);
  }

  @Get('kamar')
  @Roles('SUPERADMIN', 'Admin_Pesantren', 'Petugas_Asrama', 'Owner')
  @ApiOperation({ summary: 'Daftar kamar, opsional filter by asramaId' })
  @ApiQuery({ name: 'asramaId', required: false })
  findAllKamar(
    @TenantId() tenantId: string,
    @Query('asramaId') asramaId?: string,
  ) {
    return this.asramaService.findAllKamar(tenantId, asramaId);
  }

  @Put('kamar/:id')
  @Roles('SUPERADMIN', 'Admin_Pesantren', 'Petugas_Asrama')
  @ApiOperation({ summary: 'Update data kamar (kapasitas, lantai, status)' })
  updateKamar(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateKamarDto,
  ) {
    return this.asramaService.updateKamar(tenantId, id, dto);
  }

  // ─── Penempatan Santri ────────────────────────────────────────────────────────

  @Post('penempatan')
  @Roles('SUPERADMIN', 'Admin_Pesantren', 'Petugas_Asrama')
  @ApiOperation({ summary: 'Tempatkan santri ke kamar (validasi kapasitas)' })
  assignSantri(@TenantId() tenantId: string, @Body() dto: AssignSantriDto) {
    return this.asramaService.assignSantri(tenantId, dto);
  }

  @Get('penempatan/santri/:santriId')
  @Roles('SUPERADMIN', 'Admin_Pesantren', 'Petugas_Asrama', 'Owner')
  @ApiOperation({ summary: 'Riwayat penempatan seorang santri' })
  findPenempatanBySantri(
    @TenantId() tenantId: string,
    @Param('santriId') santriId: string,
  ) {
    return this.asramaService.findPenempatanBySantri(tenantId, santriId);
  }

  @Get('penempatan/kamar/:kamarId')
  @Roles('SUPERADMIN', 'Admin_Pesantren', 'Petugas_Asrama', 'Owner')
  @ApiOperation({ summary: 'Penghuni aktif sebuah kamar' })
  findPenempatanByKamar(
    @TenantId() tenantId: string,
    @Param('kamarId') kamarId: string,
  ) {
    return this.asramaService.findPenempatanByKamar(tenantId, kamarId);
  }

  @Get('laporan-hunian')
  @Roles('SUPERADMIN', 'Admin_Pesantren', 'Petugas_Asrama', 'Owner')
  @ApiOperation({ summary: 'Laporan hunian: kapasitas, penghuni, dan daftar santri per kamar' })
  getLaporanHunian(@TenantId() tenantId: string) {
    return this.asramaService.getLaporanHunian(tenantId);
  }
}
