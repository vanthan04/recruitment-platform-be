import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/modules/prisma/prisma.service';
import {
  IOauthLoginCodeRepositoryPort,
  StoredOauthLoginCode,
} from '@/modules/auth/application/ports/oauth-login-code-repository.port';

@Injectable()
export class OauthLoginCodePrismaRepository implements IOauthLoginCodeRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    codeHash: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.prisma.oauthLoginCode.create({
      data: { userId, codeHash, expiresAt },
    });
  }

  async findValidByHash(
    codeHash: string,
  ): Promise<StoredOauthLoginCode | null> {
    const row = await this.prisma.oauthLoginCode.findUnique({
      where: { codeHash },
    });
    if (!row || row.usedAt || row.expiresAt < new Date()) {
      return null;
    }
    return row;
  }

  async markUsed(id: string): Promise<void> {
    await this.prisma.oauthLoginCode.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }
}
