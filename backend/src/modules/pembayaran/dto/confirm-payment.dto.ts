import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ConfirmPaymentDto {
  @ApiPropertyOptional({ description: 'Keterangan pembayaran' })
  @IsOptional()
  @IsString()
  keterangan?: string;

  @ApiPropertyOptional({ description: 'Metode pembayaran', example: 'TRANSFER' })
  @IsOptional()
  @IsString()
  metodePembayaran?: string;
}
