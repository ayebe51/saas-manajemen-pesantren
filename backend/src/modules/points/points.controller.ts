import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PointsService } from './points.service';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Points & Rewards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
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
    @CurrentUser() user: any,
    @Body() body: { santriId: string; category: string; points: number; description: string },
  ) {
    return this.pointsService.create(tenantId, body, user?.id);
  }
}
