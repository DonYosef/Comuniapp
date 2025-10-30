import { Module } from '@nestjs/common';
import { AuthorizationService } from '../auth/services/authorization.service';

import { PrismaModule } from '../prisma/prisma.module';

import { ParcelsController } from './parcels.controller';
import { ParcelsService } from './parcels.service';
import { UnitsService } from './units.service';

@Module({
  imports: [PrismaModule],
  controllers: [ParcelsController],
  providers: [ParcelsService, UnitsService, AuthorizationService],
  exports: [ParcelsService, UnitsService],
})
export class ParcelsModule {}
