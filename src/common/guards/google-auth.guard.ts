import { ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';

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
    return super.canActivate(context) as Promise<boolean>;
  }

  // Carries the requester's chosen role (?role=CANDIDATE|RECRUITER) through
  // Google's redirect round-trip — read back as req.query.state on the
  // callback route, since `state` is opaque to Google and echoed back as-is.
  getAuthenticateOptions(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>();
    const role = req.query.role;
    return {
      session: false,
      state: typeof role === 'string' ? role : undefined,
    };
  }
}
