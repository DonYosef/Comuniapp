import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { PrismaModule } from '../prisma/prisma.module';

import { AuthController } from './controllers/auth.controller';
import { ContextAuthGuard } from './guards/context-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermissionGuard } from './guards/permission.guard';
import { AuthService } from './services/auth.service';
import { AuthorizationService } from './services/authorization.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '24h' },
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
  ],
  providers: [
    AuthService,
    AuthorizationService,
    JwtStrategy,
    JwtAuthGuard,
    ContextAuthGuard,
    PermissionGuard,
  ],
  controllers: [AuthController],
  exports: [AuthService, AuthorizationService, JwtAuthGuard, ContextAuthGuard, PermissionGuard],
})
export class AuthModule {}
