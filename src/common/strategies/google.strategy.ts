import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';

export interface SocialProfile {
  provider: 'GOOGLE' | 'FACEBOOK';
  providerId: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
}

// Passport's OAuth2Strategy throws in its constructor if clientID/clientSecret
// are missing — falling back to placeholder strings instead of the real
// (possibly still-unset) env values keeps the app bootable before OAuth
// credentials exist. GoogleAuthGuard checks the real config at request time
// and never lets an unconfigured request reach this strategy.
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    super({
      clientID:
        configService.get<string>('GOOGLE_CLIENT_ID') || 'not-configured',
      clientSecret:
        configService.get<string>('GOOGLE_CLIENT_SECRET') || 'not-configured',
      callbackURL:
        configService.get<string>('GOOGLE_CALLBACK_URL') ||
        'http://localhost:8080/api/v1/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  // No `done` callback here — the @nestjs/passport mixin awaits this method's
  // return value and forwards it to Passport's real `done` itself (see
  // jwt.strategy.ts for the same convention). Returning (rather than
  // throwing) for the missing-email case keeps all error-redirect logic in
  // the controller instead of scattered across guard/strategy exception
  // handling.
  validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ): SocialProfile | { error: string } {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      return { error: 'EMAIL_REQUIRED' };
    }

    return {
      provider: 'GOOGLE',
      providerId: profile.id,
      email,
      fullName: profile.displayName,
      avatarUrl: profile.photos?.[0]?.value,
    };
  }
}
