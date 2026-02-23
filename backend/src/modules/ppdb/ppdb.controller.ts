import { Controller, Get, Post, Body, Param, Put, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PpdbService } from './ppdb.service';
import { AddPpdbDocumentDto, AddPpdbExamDto, CreatePpdbDto, UpdatePpdbDto } from './dto/ppdb.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';

@ApiTags('PPDB (Penerimaan Siswa Baru)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('api/v1/ppdb')
export class PpdbController {
  constructor(private readonly ppdbService: PpdbService) {}

  @Post()
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS')
  @ApiOperation({ summary: 'Mendaftarkan calon santri baru' })
  create(@TenantId() tenantId: string, @Body() createPpdbDto: CreatePpdbDto) {
    return this.ppdbService.create(tenantId, createPpdbDto);
  }

  @Get()
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS')
  @ApiOperation({ summary: 'Melihat seluruh daftar pendaftar PPDB' })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by status (e.g PENDING, ACCEPTED)',
  })
  findAll(@TenantId() tenantId: string, @Query('status') status?: string) {
    return this.ppdbService.findAll(tenantId, status);
  }

  @Get(':id')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS')
  @ApiOperation({ summary: 'Melihat detail pendaftar PPDB beserta dokumen dan hasil tes' })
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.ppdbService.findOne(tenantId, id);
  }

  @Put(':id')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS')
  @ApiOperation({ summary: 'Mengubah status pendaftaran atau profil calon santri' })
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() updatePpdbDto: UpdatePpdbDto,
  ) {
    return this.ppdbService.update(tenantId, id, updatePpdbDto);
  }

  @Post(':id/documents')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS')
  @ApiOperation({ summary: 'Melampirkan dokumen persyaratan pendaftar (KK, Ijazah)' })
  addDocument(
    @TenantId() tenantId: string,
    @Param('id') registrationId: string,
    @Body() addDocDto: AddPpdbDocumentDto,
  ) {
    return this.ppdbService.addDocument(tenantId, registrationId, addDocDto);
  }

  @Post(':id/exams')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS')
  @ApiOperation({ summary: 'Menginput jadwal atau nilai tes masuk (Wawancara, Tulis, Ngaji)' })
  addExam(
    @TenantId() tenantId: string,
    @Param('id') registrationId: string,
    @Body() addExamDto: AddPpdbExamDto,
  ) {
    return this.ppdbService.addExam(tenantId, registrationId, addExamDto);
  }
}
