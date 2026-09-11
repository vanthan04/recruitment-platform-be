import type { INestApplicationContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import type { Server, ServerOptions } from 'socket.io';
import { resolveCorsOptions } from '@/common/config/cors.config';

/**
 * Applies the same CORS_ORIGIN/credentials rule as the HTTP server (main.ts)
 * to the Socket.IO server. Configured here (bootstrap time, after
 * ConfigModule has loaded `.env`) rather than in the `@WebSocketGateway(...)`
 * decorator, whose options object is evaluated at class-definition time —
 * i.e. when the file is first imported, before `.env` is guaranteed loaded.
 */
export class ChatIoAdapter extends IoAdapter {
  constructor(private readonly app: INestApplicationContext) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions): Server {
    const corsOrigin = this.app.get(ConfigService).get<string>('CORS_ORIGIN');
    const cors = resolveCorsOptions(corsOrigin);
    return super.createIOServer(port, { ...options, cors }) as Server;
  }
}
