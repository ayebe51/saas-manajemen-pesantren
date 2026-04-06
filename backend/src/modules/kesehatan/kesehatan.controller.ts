import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { KesehatanService } from './kesehatan.service';
import { CreateRekamMedisDto } from './dto/create-rekam-medis.dto';
import { CreateKunjunganDto } from './dto/create-kunjungan.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Kesehatan')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Petugas_Kesehatan', 'Admin_Pesantren', 'Super_Admin')
@Controller('api/v1/kesehatan')
export class KesehatanController {
  constructor(private readonly kesehatanService: KesehatanService) {}

  // ─── Rekam Medis ──────────────────────────────────────────────────────────

  @Get('rekam-medis/:santriId')
  @ApiOperation({ summary: 'Ambil rekam medis santri' })
  getRekamMedis(@Param('santriId') santriId: string) {
    return this.kesehatanService.getRekamMedis(santriId);
  }

  @Put('rekam-medis/:santriId')
  @ApiOperation({ summary: 'Buat atau perbarui rekam medis santri' })
  upsertRekamMedis(
    @Param('santriId') santriId: string,
    @Body() dto: CreateRekamMedisDto,
    @Req() req: any,
  ) {
    return this.kesehatanService.upsertRekamMedis(santriId, dto, req.user.id);
  }

  // ─── Kunjungan Klinik ─────────────────────────────────────────────────────

  @Post('kunjungan')
  @ApiOperation({ summary: 'Catat kunjungan klinik santri' })
  createKunjungan(@Body() dto: CreateKunjunganDto, @Req() req: any) {
    return this.kesehatanService.createKunjungan(dto, req.user.id);
  }

  @Get('kunjungan/santri/:santriId')
  @ApiOperation({ summary: 'Daftar kunjungan klinik per santri' })
  getKunjunganBySantri(@Param('santriId') santriId: string) {
    return this.kesehatanService.getKunjunganBySantri(santriId);
  }

  @Get('kunjungan/:id')
  @ApiOperation({ summary: 'Detail kunjungan klinik' })
  getKunjunganById(@Param('id') id: string) {
    return this.kesehatanService.getKunjunganById(id);
  }
}
