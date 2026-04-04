import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({ example: 'Wali_Kelas', description: 'Nama role unik' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @ApiPropertyOptional({ example: 'Ustadz/ustadzah yang bertanggung jawab atas kelas tertentu' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;
}
