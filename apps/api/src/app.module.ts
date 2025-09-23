import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { UsersModule } from './users/users.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { AuthModule } from './auth/auth.module';
import { ConciergeModule } from './concierge/concierge.module';
import { ResidentsModule } from './residents/residents.module';
import { AdminModule } from './admin/admin.module';
import { PublicModule } from './public/public.module';
import { CommunitiesModule } from './communities/communities.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from './config/config.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    AuthModule,
    HealthModule,
    UsersModule,
    OrganizationsModule,
    ConciergeModule,
    ResidentsModule,
    AdminModule,
    PublicModule,
    CommunitiesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
