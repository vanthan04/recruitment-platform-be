import { ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';

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
    return super.canActivate(context) as Promise<boolean>;
  }

  // See GoogleAuthGuard for why the requested role is carried through `state`.
  getAuthenticateOptions(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>();
    const role = req.query.role;
    return {
      session: false,
      state: typeof role === 'string' ? role : undefined,
    };
  }
}
