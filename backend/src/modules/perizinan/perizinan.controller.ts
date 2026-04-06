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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PerizinanService } from './perizinan.service';
import { CreatePerizinanDto } from './dto/create-perizinan.dto';
import { QueryPerizinanDto } from './dto/query-perizinan.dto';
import { RejectPerizinanDto } from './dto/reject-perizinan.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';

@ApiTags('Perizinan')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('perizinan')
export class PerizinanController {
  constructor(private readonly perizinanService: PerizinanService) {}

  /**
   * POST /perizinan — buat izin baru (JWT required)
   * Requirements: 14.2
   */
  @Post()
  @ApiOperation({ summary: 'Buat pengajuan izin baru (status DRAFT)' })
  create(
    @Body() dto: CreatePerizinanDto,
    @CurrentUser() user: any,
    @TenantId() tenantId: string,
  ) {
    return this.perizinanService.create(dto, user.id, tenantId);
  }

  /**
   * GET /perizinan — list izin dengan filter (JWT + R)
   * Requirements: 14.2
   */
  @Get()
  @ApiOperation({ summary: 'Daftar perizinan dengan filter' })
  findAll(@TenantId() tenantId: string, @Query() query: QueryPerizinanDto) {
    return this.perizinanService.findAll(tenantId, query);
  }

  /**
   * GET /perizinan/:id — detail izin (JWT + R)
   * Requirements: 14.2
   */
  @Get(':id')
  @ApiOperation({ summary: 'Detail perizinan' })
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.perizinanService.findOne(id, tenantId);
  }

  /**
   * PUT /perizinan/:id/submit — submit izin DRAFT → SUBMITTED (JWT)
   * Requirements: 14.2
   */
  @Put(':id/submit')
  @ApiOperation({ summary: 'Submit izin (DRAFT → SUBMITTED)' })
  submit(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @TenantId() tenantId: string,
  ) {
    return this.perizinanService.submit(id, user.id, tenantId);
  }

  /**
   * PUT /perizinan/:id/approve — setujui izin (JWT + W, Admin role)
   * Requirements: 14.4
   */
  @Put(':id/approve')
  @UseGuards(RolesGuard)
  @Roles('Admin_Pesantren', 'SUPERADMIN', 'Super_Admin', 'TENANT_ADMIN')
  @ApiOperation({ summary: 'Setujui izin (SUBMITTED → APPROVED)' })
  approve(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @TenantId() tenantId: string,
  ) {
    return this.perizinanService.approve(id, user.id, tenantId);
  }

  /**
   * PUT /perizinan/:id/reject — tolak izin (JWT + W, Admin role)
   * Requirements: 14.4
   */
  @Put(':id/reject')
  @UseGuards(RolesGuard)
  @Roles('Admin_Pesantren', 'SUPERADMIN', 'Super_Admin', 'TENANT_ADMIN')
  @ApiOperation({ summary: 'Tolak izin (SUBMITTED → REJECTED)' })
  reject(
    @Param('id') id: string,
    @Body() dto: RejectPerizinanDto,
    @CurrentUser() user: any,
    @TenantId() tenantId: string,
  ) {
    return this.perizinanService.reject(id, user.id, dto.alasan, tenantId);
  }

  /**
   * PUT /perizinan/:id/complete — tandai santri sudah kembali (JWT + W)
   * Requirements: 14.4
   */
  @Put(':id/complete')
  @ApiOperation({ summary: 'Tandai santri kembali (APPROVED/TERLAMBAT → COMPLETED)' })
  complete(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @TenantId() tenantId: string,
  ) {
    return this.perizinanService.complete(id, user.id, tenantId);
  }
}
