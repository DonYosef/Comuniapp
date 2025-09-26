import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';

import { ConciergeController } from './concierge.controller';
import { ConciergeService } from './concierge.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ConciergeController],
  providers: [ConciergeService],
  exports: [ConciergeService],
})
export class ConciergeModule {}
