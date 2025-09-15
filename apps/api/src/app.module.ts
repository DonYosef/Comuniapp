import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from './config/config.module';

@Module({
  imports: [ConfigModule, PrismaModule, HealthModule, UsersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
