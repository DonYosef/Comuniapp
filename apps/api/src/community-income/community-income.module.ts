import { Module } from '@nestjs/common';
import { CommunityIncomeService } from './community-income.service';
import { CommunityIncomeController } from './community-income.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [CommunityIncomeService],
  controllers: [CommunityIncomeController],
  exports: [CommunityIncomeService],
})
export class CommunityIncomeModule {}
