import { PartialType, ApiProperty } from '@nestjs/swagger';
import { CreatePpdbDto } from '../../ppdb/dto/ppdb.dto';
import { IsNotEmpty, IsString } from 'class-validator';

export class PublicCreatePpdbDto extends CreatePpdbDto {
  @ApiProperty({ description: 'Kode unik pesantren (Tenant ID) tempat santri mendaftar' })
  @IsString()
  @IsNotEmpty()
  tenantId: string;
}
