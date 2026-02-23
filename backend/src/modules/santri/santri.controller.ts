import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { SantriService } from './santri.service';
import { CreateSantriDto, UpdateSantriDto, CreateWaliDto } from './dto/santri.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { AuditLogInterceptor } from '../../common/interceptors/audit-log.interceptor';

@ApiTags('Santri')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditLogInterceptor)
@Controller('santri')
export class SantriController {
  constructor(private readonly santriService: SantriService) {}

  @Post()
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS')
  @ApiOperation({ summary: 'Create a new santri' })
  create(@Body() createSantriDto: CreateSantriDto, @TenantId() tenantId: string) {
    return this.santriService.create(tenantId, createSantriDto);
  }

  @Post('import/bulk')
  @Roles('SUPERADMIN', 'TENANT_ADMIN')
  @ApiOperation({ summary: 'Bulk Create/Import Santri via Excel File' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async bulkImport(@UploadedFile() file: any, @TenantId() tenantId: string) {
    return this.santriService.bulkImport(tenantId, file);
  }

  @Get()
  @ApiOperation({ summary: 'Get all santri for current tenant' })
  @ApiQuery({ name: 'kelas', required: false })
  @ApiQuery({ name: 'room', required: false })
  findAll(
    @TenantId() tenantId: string,
    @Query('kelas') kelas?: string,
    @Query('room') room?: string,
  ) {
    return this.santriService.findAll(tenantId, { kelas, room });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get santri details with wali info' })
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.santriService.findOne(id, tenantId);
  }

  @Put(':id')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS')
  @ApiOperation({ summary: 'Update santri' })
  update(
    @Param('id') id: string,
    @Body() updateSantriDto: UpdateSantriDto,
    @TenantId() tenantId: string,
  ) {
    return this.santriService.update(id, tenantId, updateSantriDto);
  }

  // Wali Management for Santri

  @Post(':id/wali')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS')
  @ApiOperation({ summary: 'Add a new wali and link to santri' })
  addWali(
    @Param('id') santriId: string,
    @Body() createWaliDto: CreateWaliDto,
    @TenantId() tenantId: string,
  ) {
    return this.santriService.addWali(santriId, tenantId, createWaliDto);
  }

  @Post(':id/wali/:waliId/link')
  @Roles('SUPERADMIN', 'TENANT_ADMIN', 'PENGURUS')
  @ApiOperation({ summary: 'Link an existing wali to this santri' })
  linkExistingWali(
    @Param('id') santriId: string,
    @Param('waliId') waliId: string,
    @TenantId() tenantId: string,
  ) {
    return this.santriService.linkWali(santriId, waliId, tenantId);
  }
}
