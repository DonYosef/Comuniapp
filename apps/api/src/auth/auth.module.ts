import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './services/auth.service';
import { AuthorizationService } from './services/authorization.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ContextAuthGuard } from './guards/context-auth.guard';
import { AuthController } from './controllers/auth.controller';
import { PrismaModule } from '../prisma/prisma.module';

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
  providers: [AuthService, AuthorizationService, JwtStrategy, JwtAuthGuard, ContextAuthGuard],
  controllers: [AuthController],
  exports: [AuthService, AuthorizationService, JwtAuthGuard, ContextAuthGuard],
})
export class AuthModule {}
