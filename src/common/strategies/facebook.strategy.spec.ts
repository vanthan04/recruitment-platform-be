import { ConfigService } from '@nestjs/config';
import { FacebookStrategy } from './facebook.strategy';

// See google.strategy.spec.ts for why this matters — same fallback design.
describe('FacebookStrategy', () => {
  it('does not throw when constructed with no Facebook env vars configured', () => {
    const configService = {
      get: jest.fn().mockReturnValue(undefined),
    } as unknown as ConfigService;
    expect(() => new FacebookStrategy(configService)).not.toThrow();
  });

  describe('validate', () => {
    let strategy: FacebookStrategy;

    beforeEach(() => {
      const configService = {
        get: jest.fn().mockReturnValue(undefined),
      } as unknown as ConfigService;
      strategy = new FacebookStrategy(configService);
    });

    it('returns an EMAIL_REQUIRED marker when the Facebook profile has no email', () => {
      const result = strategy.validate('access', 'refresh', {
        id: 'fb-1',
        displayName: 'No Email',
      } as any);
      expect(result).toEqual({ error: 'EMAIL_REQUIRED' });
    });

    it('maps a valid Facebook profile to a SocialProfile', () => {
      const result = strategy.validate('access', 'refresh', {
        id: 'fb-1',
        displayName: 'John Doe',
        emails: [{ value: 'john@example.com' }],
        photos: [{ value: 'https://example.com/avatar.png' }],
      } as any);
      expect(result).toEqual({
        provider: 'FACEBOOK',
        providerId: 'fb-1',
        email: 'john@example.com',
        fullName: 'John Doe',
        avatarUrl: 'https://example.com/avatar.png',
      });
    });
  });
});
