import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BukuPenghubungService } from './buku-penghubung.service';
import { CreateBukuPenghubungDto } from './dto/create-catatan-buku.dto';
import { CreateBalasanDto } from './dto/create-balasan.dto';
import { QueryCatatanDto } from './dto/query-catatan.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Buku Penghubung')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('catatan')
export class BukuPenghubungController {
  constructor(private readonly bukuPenghubungService: BukuPenghubungService) {}

  /**
   * POST /catatan — Buat entri buku penghubung baru (Wali_Kelas only)
   * Requirements: 7.1
   */
  @Post()
  @Roles('WALI_KELAS', 'SUPERADMIN', 'ADMIN_PESANTREN')
  @ApiOperation({ summary: 'Buat entri buku penghubung baru (Wali_Kelas)' })
  create(
    @Body() dto: CreateBukuPenghubungDto,
    @CurrentUser() currentUser: { id: string; role: string },
  ) {
    return this.bukuPenghubungService.create(dto, currentUser);
  }

  /**
   * GET /catatan — Daftar entri buku penghubung dengan filter & pagination
   * Requirements: 7.1
   */
  @Get()
  @Roles('WALI_KELAS', 'WALI_SANTRI', 'SUPERADMIN', 'ADMIN_PESANTREN')
  @ApiOperation({ summary: 'Daftar entri buku penghubung' })
  findAll(@Query() query: QueryCatatanDto) {
    return this.bukuPenghubungService.findAll(query);
  }

  /**
   * GET /catatan/:id — Detail entri beserta balasan
   * Requirements: 7.1
   */
  @Get(':id')
  @Roles('WALI_KELAS', 'WALI_SANTRI', 'SUPERADMIN', 'ADMIN_PESANTREN')
  @ApiOperation({ summary: 'Detail entri buku penghubung beserta balasan' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.bukuPenghubungService.findOne(id);
  }

  /**
   * POST /catatan/:id/balasan — Buat balasan (Wali_Santri atau Wali_Kelas)
   * Requirements: 7.1, 7.4
   */
  @Post(':id/balasan')
  @Roles('WALI_SANTRI', 'WALI_KELAS', 'SUPERADMIN', 'ADMIN_PESANTREN')
  @ApiOperation({ summary: 'Buat balasan untuk entri buku penghubung' })
  createReply(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateBalasanDto,
    @CurrentUser() currentUser: { id: string; role: string },
  ) {
    return this.bukuPenghubungService.createReply(id, dto, currentUser);
  }

  /**
   * GET /catatan/:id/balasan — Semua balasan untuk satu entri
   * Requirements: 7.1
   */
  @Get(':id/balasan')
  @Roles('WALI_KELAS', 'WALI_SANTRI', 'SUPERADMIN', 'ADMIN_PESANTREN')
  @ApiOperation({ summary: 'Daftar balasan untuk entri buku penghubung' })
  findReplies(@Param('id', ParseUUIDPipe) id: string) {
    return this.bukuPenghubungService.findReplies(id);
  }
}
