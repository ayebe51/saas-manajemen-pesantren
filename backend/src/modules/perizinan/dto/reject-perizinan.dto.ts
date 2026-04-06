import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RejectPerizinanDto {
  @ApiProperty({ description: 'Alasan penolakan izin' })
  @IsString()
  @IsNotEmpty()
  alasan: string;
}
