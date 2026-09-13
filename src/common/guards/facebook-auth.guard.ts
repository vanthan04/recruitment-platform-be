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
export class FacebookAuthGuard extends AuthGuard('facebook') {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  canActivate(context: ExecutionContext) {
    if (!this.configService.get<string>('FACEBOOK_CLIENT_ID')) {
      const res = context.switchToHttp().getResponse<Response>();
      const frontendUrl = this.configService.get<string>('FRONTEND_URL');
      res.redirect(
        `${frontendUrl}/auth/callback?error=FACEBOOK_NOT_CONFIGURED`,
      );
      return false;
    }

    const req = context.switchToHttp().getRequest<OAuthInitiationRequest>();
    // See GoogleAuthGuard for why only the initiation request (no
    // code/error yet) mints a fresh CSRF nonce.
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

  // See GoogleAuthGuard for why the CSRF nonce and requested role are
  // carried through `state`.
  getAuthenticateOptions(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<OAuthInitiationRequest>();
    return {
      session: false,
      state: req.oauthState,
    };
  }
}
