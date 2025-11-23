import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { PaymentsController } from './payments.controller';
import { FlowService } from './flow.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 30000, // Aumentado a 30 segundos por defecto
      maxRedirects: 5,
    }),
    ConfigModule,
    PrismaModule,
  ],
  controllers: [PaymentsController],
  providers: [FlowService],
  exports: [FlowService],
})
export class PaymentsModule {}
