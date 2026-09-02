"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshTokenPrismaRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
let RefreshTokenPrismaRepository = class RefreshTokenPrismaRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(userId, tokenHash, expiresAt) {
        await this.prisma.refreshToken.create({
            data: { userId, tokenHash, expiresAt },
        });
    }
    async findValidByHash(tokenHash) {
        const row = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
        if (!row || row.revokedAt || row.expiresAt < new Date()) {
            return null;
        }
        return row;
    }
    async revokeByHash(userId, tokenHash) {
        await this.prisma.refreshToken.updateMany({
            where: { userId, tokenHash, revokedAt: null },
            data: { revokedAt: new Date() },
        });
    }
    async revokeAllForUser(userId) {
        await this.prisma.refreshToken.updateMany({
            where: { userId, revokedAt: null },
            data: { revokedAt: new Date() },
        });
    }
};
exports.RefreshTokenPrismaRepository = RefreshTokenPrismaRepository;
exports.RefreshTokenPrismaRepository = RefreshTokenPrismaRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RefreshTokenPrismaRepository);
//# sourceMappingURL=refresh-token-prisma.repository.js.map