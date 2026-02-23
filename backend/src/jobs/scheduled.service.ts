import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class ScheduledTasksService {
  private readonly logger = new Logger(ScheduledTasksService.name);

  constructor(private prisma: PrismaService) {}

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
}
