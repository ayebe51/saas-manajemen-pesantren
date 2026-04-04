import { IsString, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ActivateLicenseDto {
  @ApiProperty({ description: 'License key to activate', example: 'PESANTREN-XXXX-XXXX-XXXX' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  licenseKey: string;
}
