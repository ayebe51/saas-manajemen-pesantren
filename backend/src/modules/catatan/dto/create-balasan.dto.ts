import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBalasanDto {
  @ApiProperty({ description: 'Isi balasan' })
  @IsString()
  @IsNotEmpty()
  isi: string;
}
