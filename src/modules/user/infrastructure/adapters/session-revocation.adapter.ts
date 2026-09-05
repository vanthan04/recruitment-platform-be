import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { ISessionRevocationPort } from '@/modules/user/application/ports/session-revocation.port';

@Injectable()
export class SessionRevocationAdapter implements ISessionRevocationPort {
  constructor(private readonly prisma: PrismaService) {}

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
