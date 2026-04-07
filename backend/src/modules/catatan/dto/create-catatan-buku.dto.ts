import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBukuPenghubungDto {
  @ApiProperty({ description: 'ID santri yang dituju' })
  @IsUUID()
  @IsNotEmpty()
  santri_id: string;

  @ApiProperty({ description: 'Isi pesan buku penghubung' })
  @IsString()
  @IsNotEmpty()
  isi: string;
}
