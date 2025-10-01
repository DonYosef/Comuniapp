import { Module } from '@nestjs/common';
import { CommonExpensesService } from './common-expenses.service';
import { CommonExpensesController } from './common-expenses.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [CommonExpensesService],
  controllers: [CommonExpensesController],
})
export class CommonExpensesModule {}
