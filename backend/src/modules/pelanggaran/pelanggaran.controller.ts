import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PelanggaranService } from './pelanggaran.service';
import {
  CreatePelanggaranDto,
  CreateRewardPoinDto,
  CreateKategoriPelanggaranDto,
  CreatePembinaanDto,
  QueryPelanggaranDto,
} from './dto/pelanggaran.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';

@ApiTags('Pelanggaran & Reward')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class PelanggaranController {
  constructor(private readonly pelanggaranService: PelanggaranService) {}

  // ─── Kategori Pelanggaran ─────────────────────────────────────────────────

  @Post('pelanggaran/kategori')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS')
  @ApiOperation({ summary: 'Buat kategori pelanggaran baru' })
  createKategori(@Body() dto: CreateKategoriPelanggaranDto) {
    return this.pelanggaranService.createKategori(dto);
  }

  @Get('pelanggaran/kategori')
  @ApiOperation({ summary: 'Daftar kategori pelanggaran' })
  findAllKategori() {
    return this.pelanggaranService.findAllKategori();
  }

  // ─── Pelanggaran ──────────────────────────────────────────────────────────

  @Post('pelanggaran')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'MUSYRIF', 'GURU')
  @ApiOperation({ summary: 'Catat pelanggaran santri' })
  createPelanggaran(
    @Body() dto: CreatePelanggaranDto,
    @TenantId() tenantId: string,
    @Req() req: any,
  ) {
    return this.pelanggaranService.createPelanggaran(tenantId, dto, req.user.id);
  }

  @Get('pelanggaran')
  @ApiOperation({ summary: 'Daftar pelanggaran' })
  @ApiQuery({ name: 'santriId', required: false })
  @ApiQuery({ name: 'tingkatKeparahan', required: false, enum: ['RINGAN', 'SEDANG', 'BERAT'] })
  findAllPelanggaran(@TenantId() tenantId: string, @Query() query: QueryPelanggaranDto) {
    return this.pelanggaranService.findAllPelanggaran(tenantId, query);
  }

  @Get('pelanggaran/santri/:santriId/summary')
  @ApiOperation({ summary: 'Ringkasan pelanggaran dan akumulasi poin santri' })
  getSummary(@TenantId() tenantId: string, @Param('santriId') santriId: string) {
    return this.pelanggaranService.getSummaryPelanggaran(tenantId, santriId);
  }

  // ─── Reward Poin ──────────────────────────────────────────────────────────

  @Post('reward-poin')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'MUSYRIF', 'GURU')
  @ApiOperation({ summary: 'Catat poin reward santri' })
  createReward(
    @Body() dto: CreateRewardPoinDto,
    @TenantId() tenantId: string,
    @Req() req: any,
  ) {
    return this.pelanggaranService.createReward(tenantId, dto, req.user.id);
  }

  @Get('reward-poin')
  @ApiOperation({ summary: 'Daftar reward poin' })
  @ApiQuery({ name: 'santriId', required: false })
  findAllReward(@TenantId() tenantId: string, @Query('santriId') santriId?: string) {
    return this.pelanggaranService.findAllReward(tenantId, santriId);
  }

  // ─── Pembinaan ────────────────────────────────────────────────────────────

  @Post('pembinaan')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS', 'MUSYRIF')
  @ApiOperation({ summary: 'Buat rencana pembinaan' })
  createPembinaan(@Body() dto: CreatePembinaanDto, @TenantId() tenantId: string) {
    return this.pelanggaranService.createPembinaan(tenantId, dto);
  }

  @Get('pembinaan')
  @ApiOperation({ summary: 'Daftar rencana pembinaan' })
  @ApiQuery({ name: 'santriId', required: false })
  findAllPembinaan(@TenantId() tenantId: string, @Query('santriId') santriId?: string) {
    return this.pelanggaranService.findAllPembinaan(tenantId, santriId);
  }
}
