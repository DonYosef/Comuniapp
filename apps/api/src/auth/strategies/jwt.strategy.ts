import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { AuthService } from '../services/auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const user = await this.authService.getUserWithRoles(payload.sub);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuario no válido o inactivo');
    }

    const result = {
      id: user.id,
      email: user.email,
      name: user.name,
      organizationId: user.organizationId,
      roles: user.roles.map((ur) => ur.role),
      userUnits: user.userUnits,
    };
    try {
      const roleSummary = result.roles.map((r: any) => ({
        name: r.name,
        perms: (r.permissions || []).length,
      }));
      // eslint-disable-next-line no-console
      console.log('🔎 [JwtStrategy.validate] roles:', roleSummary);
    } catch {}
    return result;
  }
}
