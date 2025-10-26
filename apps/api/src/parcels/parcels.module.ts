import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';

import { ParcelsController } from './parcels.controller';
import { ParcelsService } from './parcels.service';
import { UnitsService } from './units.service';

@Module({
  imports: [PrismaModule],
  controllers: [ParcelsController],
  providers: [ParcelsService, UnitsService],
  exports: [ParcelsService, UnitsService],
})
export class ParcelsModule {}
