import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

/**
 * Shape of the claims signed into both the access and refresh JWTs — see
 * AuthService.getTokens(). `jti` is only present on refresh tokens; `iat`/
 * `exp` are standard claims added by `jsonwebtoken` itself on verification.
 */
export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  jti?: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  // `configService` is read as a constructor parameter, not `this.configService`,
  // because it has to be available before `super()` runs — `this` doesn't exist yet.
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
