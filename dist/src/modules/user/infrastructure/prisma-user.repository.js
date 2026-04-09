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
exports.PrismaUserRepository = void 0;
const common_1 = require("@nestjs/common");
const user_entity_1 = require("../domain/user.entity");
const prisma_service_1 = require("../../../common/prisma/prisma.service");
let PrismaUserRepository = class PrismaUserRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findByEmail(email) {
        const user = await this.prisma.user.findUnique({
            where: { email },
            include: { profile: true },
        });
        if (!user)
            return null;
        return new user_entity_1.User({
            id: user.id,
            email: user.email,
            password: user.password,
            refreshToken: user.refreshToken || undefined,
            fullName: user.profile?.fullName,
            verifyCode: user.verifyCode || undefined,
            role: user.role,
            status: user.status,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        });
    }
    async findById(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: { profile: true },
        });
        if (!user)
            return null;
        return new user_entity_1.User({
            id: user.id,
            email: user.email,
            password: user.password,
            refreshToken: user.refreshToken || undefined,
            fullName: user.profile?.fullName,
            verifyCode: user.verifyCode || undefined,
            role: user.role,
            status: user.status,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        });
    }
    async updateRefreshToken(id, refreshToken) {
        await this.prisma.user.update({
            where: { id },
            data: { refreshToken },
        });
    }
    async existsByEmail(email) {
        const user = await this.prisma.user.findUnique({
            where: { email },
        });
        return !!user;
    }
    async save(data) {
        if (data.id) {
            const updated = await this.prisma.user.update({
                where: { id: data.id },
                data: {
                    email: data.email,
                    password: data.password,
                    refreshToken: data.refreshToken,
                    verifyCode: data.verifyCode,
                    role: data.role,
                    status: data.status,
                    profile: data.fullName ? {
                        upsert: {
                            create: { fullName: data.fullName },
                            update: { fullName: data.fullName }
                        }
                    } : undefined
                },
                include: { profile: true }
            });
            return new user_entity_1.User({
                ...updated,
                refreshToken: updated.refreshToken || undefined,
                fullName: updated.profile?.fullName,
                verifyCode: updated.verifyCode || undefined
            });
        }
        const created = await this.prisma.user.create({
            data: {
                email: data.email,
                password: data.password,
                refreshToken: data.refreshToken,
                verifyCode: data.verifyCode,
                role: data.role || 'USER',
                status: data.status || 'PENDING',
                profile: {
                    create: {
                        fullName: data.fullName || '',
                    },
                },
            },
            include: { profile: true },
        });
        return new user_entity_1.User({
            id: created.id,
            email: created.email,
            password: created.password,
            refreshToken: created.refreshToken || undefined,
            fullName: created.profile?.fullName,
            verifyCode: created.verifyCode || undefined,
            role: created.role,
            status: created.status,
            createdAt: created.createdAt,
            updatedAt: created.updatedAt,
        });
    }
};
exports.PrismaUserRepository = PrismaUserRepository;
exports.PrismaUserRepository = PrismaUserRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaUserRepository);
//# sourceMappingURL=prisma-user.repository.js.map