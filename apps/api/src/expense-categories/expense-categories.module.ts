import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';

import { ExpenseCategoriesController } from './expense-categories.controller';
import { ExpenseCategoriesService } from './expense-categories.service';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [ExpenseCategoriesService],
  controllers: [ExpenseCategoriesController],
  exports: [ExpenseCategoriesService],
})
export class ExpenseCategoriesModule {}
