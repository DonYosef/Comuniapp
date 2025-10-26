import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';

import { CommonExpensesController } from './common-expenses.controller';
import { CommonExpensesService } from './common-expenses.service';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [CommonExpensesService],
  controllers: [CommonExpensesController],
})
export class CommonExpensesModule {}
