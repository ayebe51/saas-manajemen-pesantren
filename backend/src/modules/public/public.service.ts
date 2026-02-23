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
          // Check if Santri exists
          const existingSantri = await prisma.santri.findFirst({
            where: { nisn: item.nisn, tenantId },
            include: { walis: { include: { wali: true } } }, // Relasi many-to-many via SantriWali
          });

          // Pre-processing Wali Data
          // Use related Wali if exist, assuming the first primary one
          let targetWaliId =
            existingSantri?.walis?.find((w) => w.isPrimary)?.waliId ||
            existingSantri?.walis?.[0]?.waliId;

          if (item.waliName) {
            if (existingSantri && existingSantri.walis?.[0]?.wali) {
              // Update existing Wali (assuming the first linked wali)
              await prisma.wali.update({
                where: { id: existingSantri.walis[0].wali.id },
                data: {
                  name: item.waliName,
                  phone: item.waliPhone || existingSantri.walis[0].wali.phone,
                  email: item.waliEmail || existingSantri.walis[0].wali.email || undefined,
                },
              });
            } else {
              // Create new Wali for this Santri
              const newWali = await prisma.wali.create({
                data: {
                  tenantId: tenantId,
                  name: item.waliName,
                  relation: 'Ayah', // Default relation
                  phone: item.waliPhone || '0000',
                  email: item.waliEmail || undefined,
                },
              });
              targetWaliId = newWali.id;
            }
          }

          let santriId = existingSantri?.id;

          if (existingSantri) {
            // Update existing Santri
            await prisma.santri.update({
              where: { id: existingSantri.id },
              data: {
                name: item.name,
                gender: item.gender,
                kelas: item.kelas,
              },
            });
            results.updated++;
          } else {
            // Insert new Santri
            const newSantri = await prisma.santri.create({
              data: {
                tenantId,
                nisn: item.nisn,
                name: item.name,
                gender: item.gender,
                kelas: item.kelas,
              },
            });
            santriId = newSantri.id;
            results.inserted++;
          }

          // Link Wali to Santri if unlinked
          if (santriId && targetWaliId) {
            const existingLink = await prisma.santriWali.findUnique({
              where: {
                santriId_waliId: {
                  santriId: santriId,
                  waliId: targetWaliId,
                },
              },
            });
            if (!existingLink) {
              await prisma.santriWali.create({
                data: {
                  santriId: santriId,
                  waliId: targetWaliId,
                  isPrimary: true,
                },
              });
            }
          }
        } catch (error) {
          this.logger.error(`Error syncing santri NISN ${item.nisn}: ${error.message}`);
          results.errors++;
        }
      }
    });

    return {
      success: true,
      message: 'Bulk Sync completed',
      metadata: results,
    };
  }
}
