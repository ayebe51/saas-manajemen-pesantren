import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateAuditLogDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsString()
  aksi: string;

  @IsString()
  modul: string;

  @IsOptional()
  @IsUUID()
  entitasId?: string;

  @IsOptional()
  @IsString()
  entitasTipe?: string;

  @IsOptional()
  nilaiBefore?: Record<string, unknown>;

  @IsOptional()
  nilaiAfter?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}
