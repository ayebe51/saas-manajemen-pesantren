import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class ScannerLoginDto {
  @ApiProperty({ example: 'AB12CD', description: 'Scanner PIN specific to the tenant' })
  @IsNotEmpty()
  @IsString()
  @Length(6, 6)
  pin: string;
}
