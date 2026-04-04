import { ApiProperty } from '@nestjs/swagger';

export class LicenseStatusDto {
  @ApiProperty({ enum: ['INACTIVE', 'ACTIVE', 'GRACE_PERIOD', 'EXPIRED', 'REVOKED'] })
  status: string;

  @ApiProperty({ nullable: true })
  licenseKey: string | null;

  @ApiProperty({ nullable: true })
  activatedAt: Date | null;

  @ApiProperty({ nullable: true })
  lastVerifiedAt: Date | null;

  @ApiProperty()
  gracePeriodDays: number;

  @ApiProperty({ description: 'Days remaining in grace period (null if not in grace period)' })
  daysRemaining: number | null;

  @ApiProperty()
  isReadOnly: boolean;

  @ApiProperty()
  hardwareFingerprint: string;
}
