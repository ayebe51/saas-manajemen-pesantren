import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { KoperasiService } from './koperasi.service';
import { KoperasiController } from './koperasi.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [InventoryController, KoperasiController],
  providers: [InventoryService, KoperasiService],
  exports: [KoperasiService],
})
export class InventoryModule {}
