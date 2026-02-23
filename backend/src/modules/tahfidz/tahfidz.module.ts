import { Module } from '@nestjs/common';
import { TahfidzService } from './tahfidz.service';
import { TahfidzController } from './tahfidz.controller';

@Module({
  controllers: [TahfidzController],
  providers: [TahfidzService],
})
export class TahfidzModule {}
