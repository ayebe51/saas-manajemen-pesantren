import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PointsService } from './points.service';
import { TenantId } from '../../common/decorators/tenant-id.decorator';

@ApiTags('Points & Rewards')
@Controller('points')
export class PointsController {
  constructor(private readonly pointsService: PointsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all point entries for the tenant' })
  async findAll(@TenantId() tenantId: string) {
    return this.pointsService.findAll(tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Add points to a santri' })
  async create(
    @TenantId() tenantId: string,
    @Body() body: { santriId: string; category: string; points: number; description: string },
  ) {
    return this.pointsService.create(tenantId, body);
  }
}
