import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class RequestDepositDto {
  @ApiProperty({ description: 'Santri ID user account' })
  @IsUUID()
  @IsNotEmpty()
  santriId: string;

  @ApiProperty({ description: 'Nominal top up dasar sebelum ditambah kode unik' })
  @IsNumber()
  @Min(10000)
  amount: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;
}

export class ManualResolveDepositDto {
  @ApiProperty({ description: 'Transaction ID for the pending deposit' })
  @IsUUID()
  @IsNotEmpty()
  transactionId: string;
}

export class CreatePaymentDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  santriId: string;

  @ApiProperty()
  @IsNumber()
  @Min(100)
  amount: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ description: 'PIN transaksi (opsional untuk MVP)' })
  @IsString()
  @IsOptional()
  pin?: string;
}

// Struct of Moota Webhook (Simplified)
export class MootaWebhookDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  bank_id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  account_number: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  type: string; // 'CR' for Credit (uang masuk), 'DB' for Debit

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;
}
