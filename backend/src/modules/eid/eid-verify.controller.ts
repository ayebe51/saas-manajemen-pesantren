import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { EidService } from './eid.service';

/**
 * Public endpoint for QR code verification — Req 17.3
 * No auth required; scanned by anyone to verify santri identity.
 */
@ApiTags('E-ID Card Verification')
@Controller('public/verify-eid')
export class EidVerifyController {
  constructor(private readonly eidService: EidService) {}

  @Get(':santriId')
  @Public()
  @ApiOperation({ summary: 'Verifikasi keaslian E-ID Card santri via QR code' })
  @ApiParam({ name: 'santriId', description: 'ID santri dari QR code' })
  @ApiResponse({ status: 200, description: 'Data verifikasi santri' })
  @ApiResponse({ status: 404, description: 'Santri tidak ditemukan' })
  async verify(@Param('santriId') santriId: string) {
    return this.eidService.verifySantri(santriId);
  }
}
