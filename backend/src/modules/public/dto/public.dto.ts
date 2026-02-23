import { IsString, IsNotEmpty, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class SyncSantriObj {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nisn: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  gender: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  kelas?: string;
}

export class BulkSyncSantriDto {
  @ApiProperty({ type: [SyncSantriObj] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncSantriObj)
  santri: SyncSantriObj[];
}
