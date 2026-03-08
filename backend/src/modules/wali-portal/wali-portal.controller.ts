import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { WaliPortalService } from './wali-portal.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Wali Portal')
@Controller('wali')
export class WaliPortalController {
  constructor(private readonly waliPortalService: WaliPortalService) {}

  @Get('portal')
  @Public()
  @ApiOperation({ summary: 'Get santri data by wali phone number (public endpoint)' })
  @ApiQuery({ name: 'phone', required: true, description: 'Phone number of wali' })
  async getSantriByPhone(@Query('phone') phone: string) {
    return this.waliPortalService.findSantriByWaliPhone(phone);
  }
}
