import { ConfigService } from '@nestjs/config';
import { GoogleStrategy } from './google.strategy';

// The most important property of this strategy: passport-google-oauth20's
// underlying OAuth2Strategy throws in its constructor if clientID/
// clientSecret are missing. If GoogleStrategy didn't fall back to
// placeholders, the whole app would fail to boot the moment AuthModule
// loads while GOOGLE_CLIENT_ID isn't set yet — exactly the situation before
// the user supplies real credentials.
describe('GoogleStrategy', () => {
  it('does not throw when constructed with no Google env vars configured', () => {
    const configService = {
      get: jest.fn().mockReturnValue(undefined),
    } as unknown as ConfigService;
    expect(() => new GoogleStrategy(configService)).not.toThrow();
  });

  describe('validate', () => {
    let strategy: GoogleStrategy;

    beforeEach(() => {
      const configService = {
        get: jest.fn().mockReturnValue(undefined),
      } as unknown as ConfigService;
      strategy = new GoogleStrategy(configService);
    });

    it('returns an EMAIL_REQUIRED marker when the Google profile has no email', () => {
      const result = strategy.validate('access', 'refresh', {
        id: 'google-1',
        displayName: 'No Email',
      } as any);
      expect(result).toEqual({ error: 'EMAIL_REQUIRED' });
    });

    it('maps a valid Google profile to a SocialProfile', () => {
      const result = strategy.validate('access', 'refresh', {
        id: 'google-1',
        displayName: 'Jane Doe',
        emails: [{ value: 'jane@example.com', verified: true }],
        photos: [{ value: 'https://example.com/avatar.png' }],
      } as any);
      expect(result).toEqual({
        provider: 'GOOGLE',
        providerId: 'google-1',
        email: 'jane@example.com',
        fullName: 'Jane Doe',
        avatarUrl: 'https://example.com/avatar.png',
      });
    });
  });
});
