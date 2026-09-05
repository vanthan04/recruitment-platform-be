import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import * as crypto from 'crypto';
import { IAuthUserRepositoryPort } from '@/modules/auth/application/ports/auth-user-repository.port';
import { IOauthLoginCodeRepositoryPort } from '@/modules/auth/application/ports/oauth-login-code-repository.port';
import { SocialProfile } from '@/common/strategies/google.strategy';
import { UserRole } from '@/common/enums/user-role.enum';
import { UserStatus } from '@/common/enums/user-status.enum';
import { hashToken } from '@/common/utils/token-hash.util';

const EXCHANGE_CODE_TTL_MS = 60 * 1000; // 60s — just long enough for the browser round-trip.

export class SocialLoginCommand {
  constructor(
    public readonly profile: SocialProfile,
    public readonly requestedRole?: string,
  ) {}
}

@Injectable()
@CommandHandler(SocialLoginCommand)
export class SocialLoginHandler implements ICommandHandler<
  SocialLoginCommand,
  { code: string }
> {
  constructor(
    private readonly userRepository: IAuthUserRepositoryPort,
    private readonly oauthLoginCodeRepository: IOauthLoginCodeRepositoryPort,
  ) {}

  async execute({
    profile,
    requestedRole,
  }: SocialLoginCommand): Promise<{ code: string }> {
    const providerField =
      profile.provider === 'GOOGLE' ? 'googleId' : 'facebookId';

    let user =
      profile.provider === 'GOOGLE'
        ? await this.userRepository.findByGoogleId(profile.providerId)
        : await this.userRepository.findByFacebookId(profile.providerId);

    if (!user) {
      const existing = await this.userRepository.findByEmail(profile.email);
      if (existing) {
        // Link this provider to the existing account — role/password untouched.
        user = await this.userRepository.save({
          id: existing.id,
          email: existing.email,
          [providerField]: profile.providerId,
        });
      } else {
        // Whitelist: only ever CANDIDATE or RECRUITER for a new account, same
        // restriction as the public /auth/register endpoint — a spoofed
        // `state` value can never mint an ADMIN account.
        const role =
          requestedRole === UserRole.RECRUITER
            ? UserRole.RECRUITER
            : UserRole.CANDIDATE;

        user = await this.userRepository.save({
          email: profile.email,
          fullName: profile.fullName,
          role,
          status: UserStatus.ACTIVE, // the provider already verified the email
          [providerField]: profile.providerId,
        });
      }
    }

    const code = crypto.randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + EXCHANGE_CODE_TTL_MS);
    await this.oauthLoginCodeRepository.create(
      user.id,
      hashToken(code),
      expiresAt,
    );

    return { code };
  }
}
