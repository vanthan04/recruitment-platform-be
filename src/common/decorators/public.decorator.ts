import { SetMetadata } from '@nestjs/common';

// Opt-out for JwtAuthGuard, which is registered globally (see app.module.ts)
// so every route is authenticated by default unless explicitly marked
// @Public() — flips the previous "secure by remembering @UseGuards" default
// to "secure by default, public by exception".
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
