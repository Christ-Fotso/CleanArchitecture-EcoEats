import type { PrismaClient } from "@prisma/client";
import type { IRefreshTokenRepository, RefreshTokenRecord } from "../../application/ports/IRefreshTokenRepository.js";

export class PrismaRefreshTokenRepository implements IRefreshTokenRepository {
  constructor(private readonly prismaClient: PrismaClient) {}

  async create(input: { userId: string; tokenHash: string; expiresAt: Date }): Promise<void> {
    await this.prismaClient.refreshToken.create({
      data: {
        user_id: input.userId,
        token_hash: input.tokenHash,
        expires_at: input.expiresAt,
      },
    });
  }

  async findByHash(hash: string): Promise<RefreshTokenRecord | null> {
    const record = await this.prismaClient.refreshToken.findUnique({
      where: { token_hash: hash },
      select: { id: true, user_id: true, expires_at: true, revoked_at: true },
    });

    if (!record) return null;
    return {
      id: record.id,
      userId: record.user_id,
      expiresAt: record.expires_at,
      revokedAt: record.revoked_at,
    };
  }

  async revoke(id: string): Promise<void> {
    await this.prismaClient.refreshToken.update({
      where: { id },
      data: { revoked_at: new Date() },
    });
  }

  async pruneExpired(): Promise<number> {
    const { count } = await this.prismaClient.refreshToken.deleteMany({
      where: { expires_at: { lt: new Date() } },
    });
    return count;
  }
}