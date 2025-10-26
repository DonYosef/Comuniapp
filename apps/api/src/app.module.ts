import { Module } from '@nestjs/common';

import { AdminModule } from './admin/admin.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ChatbotModule } from './chatbot/chatbot.module';
import { CommonExpensesModule } from './common-expenses/common-expenses.module';
import { CommunitiesModule } from './communities/communities.module';
import { CommunityIncomeModule } from './community-income/community-income.module';
import { ConciergeModule } from './concierge/concierge.module';
import { ConfigModule } from './config/config.module';
import { ExpenseCategoriesModule } from './expense-categories/expense-categories.module';
import { HealthModule } from './health/health.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { ParcelsModule } from './parcels/parcels.module';
import { PrismaModule } from './prisma/prisma.module';
import { ResidentsModule } from './residents/residents.module';
import { UsersModule } from './users/users.module';
import { VisitorsModule } from './visitors/visitors.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    AuthModule,
    ChatbotModule,
    HealthModule,
    UsersModule,
    OrganizationsModule,
    ConciergeModule,
    ResidentsModule,
    AdminModule,
    AnnouncementsModule,
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
