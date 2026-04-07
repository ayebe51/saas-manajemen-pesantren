import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PpdbService } from './ppdb.service';
import { CreatePpdbDto } from './dto/create-ppdb.dto';
import { UpdatePpdbStatusDto } from './dto/update-ppdb-status.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('PPDB')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ppdb')
export class PpdbController {
  constructor(private readonly ppdbService: PpdbService) {}

  /**
   * POST /ppdb — buat pendaftaran baru (Public)
   * Requirements: 4.1, 4.2
   */
  @Post()
  @Public()
  @ApiOperation({ summary: 'Buat pendaftaran PPDB baru (status DRAFT)' })
  create(@TenantId() tenantId: string, @Body() dto: CreatePpdbDto) {
    return this.ppdbService.create(tenantId, dto);
  }

  /**
   * GET /ppdb — list semua pendaftaran (JWT + Admin)
   * Requirements: 4.1
   */
  @Get()
  @UseGuards(RolesGuard)
  @Roles('Admin_Pesantren', 'SUPERADMIN', 'Super_Admin', 'TENANT_ADMIN')
  @ApiOperation({ summary: 'Daftar semua pendaftaran PPDB' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  findAll(@TenantId() tenantId: string, @Query('status') status?: string) {
    return this.ppdbService.findAll(tenantId, status);
  }

  /**
   * GET /ppdb/:id — detail pendaftaran (JWT)
   * Requirements: 4.1
   */
  @Get(':id')
  @ApiOperation({ summary: 'Detail pendaftaran PPDB' })
  findOne(@Param('id') id: string) {
    return this.ppdbService.findOne(id);
  }

  /**
   * PUT /ppdb/:id/submit — submit pendaftaran DRAFT → SUBMITTED (JWT)
   * Requirements: 4.2, 4.4
   */
  @Put(':id/submit')
  @ApiOperation({ summary: 'Submit pendaftaran (DRAFT → SUBMITTED)' })
  submit(@Param('id') id: string) {
    return this.ppdbService.submit(id);
  }

  /**
   * PUT /ppdb/:id/status — update status oleh admin (JWT + Admin)
   * Requirements: 4.3, 4.4
   */
  @Put(':id/status')
  @UseGuards(RolesGuard)
  @Roles('Admin_Pesantren', 'SUPERADMIN', 'Super_Admin', 'TENANT_ADMIN')
  @ApiOperation({ summary: 'Update status PPDB (SUBMITTED → REVIEW → ACCEPTED/REJECTED)' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePpdbStatusDto,
    @CurrentUser() user: any,
  ) {
    // Inject reviewedBy from JWT if not provided in body
    if (!dto.reviewedBy && user?.id) {
      dto.reviewedBy = user.id;
    }
    return this.ppdbService.updateStatus(id, dto);
  }

  /**
   * POST /ppdb/:id/convert — konversi ACCEPTED ke santri (JWT + Admin)
   * Requirements: 4.5
   */
  @Post(':id/convert')
  @UseGuards(RolesGuard)
  @Roles('Admin_Pesantren', 'SUPERADMIN', 'Super_Admin', 'TENANT_ADMIN')
  @ApiOperation({ summary: 'Konversi pendaftaran ACCEPTED menjadi data santri aktif' })
  convertToSantri(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.ppdbService.convertToSantri(id, tenantId);
  }
}
