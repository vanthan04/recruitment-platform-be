import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '@/common/decorators/public.decorator';

// Registered globally as APP_GUARD (see app.module.ts) — every route
// requires a valid JWT by default now, unless the handler or its
// controller is marked @Public(). Still usable via local @UseGuards(
// JwtAuthGuard) too (e.g. auth.controller.ts's OAuth routes, which need
// @Public() themselves to skip *this* guard while keeping their own
// Google/FacebookAuthGuard) — canActivate behaves identically either way.
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    return super.canActivate(context);
  }
}
