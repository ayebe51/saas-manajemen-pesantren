import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma/prisma.service';
import { LicenseService } from '../modules/license/license.service';
import { InvoiceService } from '../modules/pembayaran/invoice.service';

@Injectable()
export class ScheduledTasksService {
  private readonly logger = new Logger(ScheduledTasksService.name);

  constructor(
    private prisma: PrismaService,
    private readonly licenseService: LicenseService,
    private readonly invoiceService: InvoiceService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async handlePaymentReminders() {
    this.logger.log('Running daily payment reminders check...');

    // Find unpaid invoices due in exactly 3 days
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 3);
    targetDate.setHours(0, 0, 0, 0);

    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const dueSoon = await this.prisma.invoice.findMany({
      where: {
        status: { in: ['UNPAID', 'PARTIAL'] },
        dueDate: {
          gte: targetDate,
          lt: nextDay,
        },
      },
      include: {
        santri: {
          include: {
            walis: { include: { wali: true } },
          },
        },
        tenant: true,
      },
    });

    this.logger.log(`Found ${dueSoon.length} invoices due in 3 days.`);

    for (const invoice of dueSoon) {
      if (invoice.santri.walis.length > 0) {
        // In a real app, this would queue a BullMQ job
        this.logger.log(
          `[Queue Mock] Triggering Reminder WA to Wali ${invoice.santri.walis[0].wali.phone} for Invoice ${invoice.id} (Santri: ${invoice.santri.name})`,
        );
      }
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleExpiredIzin() {
    this.logger.log('Running daily expired izin check...');

    const now = new Date();

    const expired = await this.prisma.izin.updateMany({
      where: {
        status: 'PENDING',
        startAt: { lt: now },
      },
      data: {
        status: 'EXPIRED',
      },
    });

    this.logger.log(`Marked ${expired.count} izin requests as expired.`);
  }

  /**
   * LicenseCheckerJob — runs daily at 2 AM.
   * Verifies license online, updates last_verified_at, logs to audit log.
   * If offline, updates status to GRACE_PERIOD or EXPIRED based on grace period.
   * Requirements: 19.6
   */
  @Cron('0 2 * * *')
  async handleLicenseCheck() {
    this.logger.log('Running daily license verification check...');
    try {
      const result = await this.licenseService.verifyLicense();
      this.logger.log(`License check complete. Status: ${result.status}`);

      if (result.status === 'GRACE_PERIOD') {
        this.logger.warn(
          `License in grace period. ${result.daysRemaining ?? 0} day(s) remaining before read-only mode.`,
        );
      } else if (result.status === 'EXPIRED') {
        this.logger.error('License has EXPIRED. System is now in read-only mode.');
      }
    } catch (err) {
      this.logger.error(`License check job failed: ${err.message}`, err.stack);
    }
  }

  /**
   * InvoiceExpiryJob — runs daily at 1 AM.
   * Tandai invoice PENDING yang melewati due_date menjadi EXPIRED.
   * Requirements: 11.2
   */
  @Cron('0 1 * * *')
  async handleInvoiceExpiry() {
    this.logger.log('Running daily invoice expiry check...');
    try {
      const count = await this.invoiceService.expireOverdueInvoices();
      this.logger.log(`InvoiceExpiryJob: marked ${count} invoice(s) as EXPIRED`);
    } catch (err) {
      this.logger.error(`InvoiceExpiryJob failed: ${err.message}`, err.stack);
    }
  }
}
