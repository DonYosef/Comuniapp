import { Module } from '@nestjs/common';

import { AdminModule } from './admin/admin.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CommonExpensesModule } from './common-expenses/common-expenses.module';
import { CommunitiesModule } from './communities/communities.module';
import { ExpenseCategoriesModule } from './expense-categories/expense-categories.module';
import { CommunityIncomeModule } from './community-income/community-income.module';
import { ConciergeModule } from './concierge/concierge.module';
import { ConfigModule } from './config/config.module';
import { HealthModule } from './health/health.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { ParcelsModule } from './parcels/parcels.module';
import { PrismaModule } from './prisma/prisma.module';
import { PublicModule } from './public/public.module';
import { ResidentsModule } from './residents/residents.module';
import { UsersModule } from './users/users.module';
import { VisitorsModule } from './visitors/visitors.module';

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
    CommonExpensesModule,
    ExpenseCategoriesModule,
    CommunityIncomeModule,
    ParcelsModule,
    VisitorsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
