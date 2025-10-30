import { Module } from '@nestjs/common';
import { AuthorizationService } from '../auth/services/authorization.service';

import { PrismaModule } from '../prisma/prisma.module';

import { VisitorsController } from './visitors.controller';
import { VisitorsService } from './visitors.service';

@Module({
  imports: [PrismaModule],
  controllers: [VisitorsController],
  providers: [VisitorsService, AuthorizationService],
  exports: [VisitorsService],
})
export class VisitorsModule {}
