import { IoAdapter } from '@nestjs/platform-socket.io';
import type { ServerOptions } from 'socket.io';

/**
 * Applies the same CORS_ORIGIN/credentials rule as the HTTP server (main.ts)
 * to the Socket.IO server. Configured here (bootstrap time, after
 * ConfigModule has loaded `.env`) rather than in the `@WebSocketGateway(...)`
 * decorator, whose options object is evaluated at class-definition time —
 * i.e. when the file is first imported, before `.env` is guaranteed loaded.
 */
export class ChatIoAdapter extends IoAdapter {
  createIOServer(port: number, options?: ServerOptions) {
    const corsOrigin = process.env.CORS_ORIGIN;
    const cors = {
      origin: corsOrigin ? corsOrigin.split(',').map((o) => o.trim()) : true,
      credentials: true,
    };
    return super.createIOServer(port, { ...options, cors });
  }
}
