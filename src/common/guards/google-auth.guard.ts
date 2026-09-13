import { ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import {
  OAUTH_STATE_COOKIE,
  buildOAuthState,
  generateOAuthNonce,
  oauthStateCookieOptions,
} from '@/common/utils/oauth-state.util';

interface OAuthInitiationRequest extends Request {
  /** Stashed by canActivate() below so getAuthenticateOptions() (called
   * moments later, same request) can send it without recomputing — never
   * set on a callback request. */
  oauthState?: string;
}

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  canActivate(context: ExecutionContext) {
    if (!this.configService.get<string>('GOOGLE_CLIENT_ID')) {
      const res = context.switchToHttp().getResponse<Response>();
      const frontendUrl = this.configService.get<string>('FRONTEND_URL');
      res.redirect(`${frontendUrl}/auth/callback?error=GOOGLE_NOT_CONFIGURED`);
      return false;
    }

    const req = context.switchToHttp().getRequest<OAuthInitiationRequest>();
    // A callback request carries `code` (success) or `error` (denied) —
    // never both absent. Only the initiation request (no code/error yet)
    // should mint a fresh CSRF nonce; doing it on the callback too would
    // overwrite the cookie the callback itself needs to verify against.
    const isCallback = 'code' in req.query || 'error' in req.query;
    if (!isCallback) {
      const res = context.switchToHttp().getResponse<Response>();
      const role = req.query.role;
      const nonce = generateOAuthNonce();
      req.oauthState = buildOAuthState(
        nonce,
        typeof role === 'string' ? role : undefined,
      );
      res.cookie(
        OAUTH_STATE_COOKIE,
        nonce,
        oauthStateCookieOptions(process.env.NODE_ENV === 'production'),
      );
    }

    return super.canActivate(context) as Promise<boolean>;
  }

  // Carries the CSRF nonce (see canActivate above) and the requester's
  // chosen role (?role=CANDIDATE|RECRUITER) through Google's redirect
  // round-trip — read back as req.query.state on the callback route, since
  // `state` is opaque to Google and echoed back as-is.
  getAuthenticateOptions(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<OAuthInitiationRequest>();
    return {
      session: false,
      state: req.oauthState,
    };
  }
}
