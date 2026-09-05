import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/modules/prisma/prisma.service';
import {
  IVerificationTokenRepositoryPort,
  StoredVerificationToken,
} from '@/modules/auth/application/ports/verification-token-repository.port';
import { VerificationTokenType } from '@/common/enums/verification-token-type.enum';

@Injectable()
export class VerificationTokenPrismaRepository implements IVerificationTokenRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    type: VerificationTokenType,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.prisma.verificationToken.create({
      data: { userId, type, tokenHash, expiresAt },
    });
  }

  async findValidByHashAndType(
    tokenHash: string,
    type: VerificationTokenType,
  ): Promise<StoredVerificationToken | null> {
    const row = await this.prisma.verificationToken.findUnique({
      where: { tokenHash },
    });
    if (!row || row.type !== type || row.usedAt || row.expiresAt < new Date()) {
      return null;
    }
    return row as StoredVerificationToken;
  }

  async markUsed(id: string): Promise<void> {
    await this.prisma.verificationToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }
}
