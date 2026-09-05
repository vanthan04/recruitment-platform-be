import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';
import { SocialProfile } from '@/common/strategies/google.strategy';

// Same "fall back to placeholders instead of throwing" rationale as
// google.strategy.ts — keeps the app bootable before OAuth credentials exist.
@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(configService: ConfigService) {
    super({
      clientID:
        configService.get<string>('FACEBOOK_CLIENT_ID') || 'not-configured',
      clientSecret:
        configService.get<string>('FACEBOOK_CLIENT_SECRET') || 'not-configured',
      callbackURL:
        configService.get<string>('FACEBOOK_CALLBACK_URL') ||
        'http://localhost:8080/api/v1/auth/facebook/callback',
      profileFields: ['id', 'emails', 'name', 'picture.type(large)'],
    });
  }

  // See google.strategy.ts's validate() for why there's no `done` param here.
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
      provider: 'FACEBOOK',
      providerId: profile.id,
      email,
      fullName: profile.displayName,
      avatarUrl: profile.photos?.[0]?.value,
    };
  }
}
