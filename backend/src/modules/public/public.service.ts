import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { BulkSyncSantriDto } from './dto/public.dto';

@Injectable()
export class PublicService {
  private readonly logger = new Logger(PublicService.name);

  constructor(private readonly prisma: PrismaService) {}

  async bulkUpsertSantri(tenantId: string, dto: BulkSyncSantriDto) {
    const results = {
      inserted: 0,
      updated: 0,
      errors: 0,
    };

    // Process in a transaction for data integrity
    await this.prisma.$transaction(async (prisma) => {
      for (const item of dto.santri) {
        try {
          const existing = await prisma.santri.findFirst({
            where: { nisn: item.nisn, tenantId },
          });

          if (existing) {
            await prisma.santri.update({
              where: { id: existing.id },
              data: {
                name: item.name,
                gender: item.gender,
                kelas: item.kelas,
              },
            });
            results.updated++;
          } else {
            await prisma.santri.create({
              data: {
                tenantId,
                nisn: item.nisn,
                name: item.name,
                gender: item.gender,
                kelas: item.kelas,
              },
            });
            results.inserted++;
          }
        } catch (error) {
          this.logger.error(`Error syncing santri NISN ${item.nisn}: ${error.message}`);
          results.errors++;
        }
      }
    });

    return {
      success: true,
      message: 'Sync completed',
      metadata: results,
    };
  }
}
