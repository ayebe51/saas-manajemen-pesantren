import { ApiProperty } from '@nestjs/swagger';

export class EidResponseDto {
  @ApiProperty({ description: 'ID santri' })
  santriId: string;

  @ApiProperty({ description: 'Nama lengkap santri' })
  namaLengkap: string;

  @ApiProperty({ description: 'Nomor Induk Santri' })
  nis: string;

  @ApiProperty({ description: 'Kelas santri' })
  kelas: string;

  @ApiProperty({ description: 'URL verifikasi QR code' })
  verificationUrl: string;

  @ApiProperty({ description: 'Waktu generate PDF' })
  generatedAt: Date;
}
