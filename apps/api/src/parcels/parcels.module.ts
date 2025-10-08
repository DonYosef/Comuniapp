import { Module } from '@nestjs/common';
import { ParcelsService } from './parcels.service';
import { ParcelsController } from './parcels.controller';
import { UnitsService } from './units.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ParcelsController],
  providers: [ParcelsService, UnitsService],
  exports: [ParcelsService, UnitsService],
})
export class ParcelsModule {}
