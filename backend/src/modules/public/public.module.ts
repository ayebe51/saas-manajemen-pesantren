import { Module } from '@nestjs/common';
import { PublicService } from './public.service';
import { PublicController } from './public.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [PublicController],
  providers: [PublicService],
  exports: [PublicService],
})
export class PublicModule {}
