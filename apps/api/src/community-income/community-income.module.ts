import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';

import { CommunityIncomeController } from './community-income.controller';
import { CommunityIncomeService } from './community-income.service';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [CommunityIncomeService],
  controllers: [CommunityIncomeController],
  exports: [CommunityIncomeService],
})
export class CommunityIncomeModule {}
