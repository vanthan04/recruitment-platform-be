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
exports.UserPrismaRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../prisma/prisma.service");
const base_prisma_repository_1 = require("../../../../../common/infrastructure/base-prisma.repository");
const user_mapper_1 = require("../mappers/user.mapper");
const user_role_enum_1 = require("../../../../../common/enums/user-role.enum");
const user_status_enum_1 = require("../../../../../common/enums/user-status.enum");
let UserPrismaRepository = class UserPrismaRepository extends base_prisma_repository_1.BasePrismaRepository {
    prismaService;
    constructor(prismaService) {
        super(prismaService.user);
        this.prismaService = prismaService;
    }
    async findByEmail(email) {
        const user = await this.prismaService.user.findUnique({
            where: { email },
            include: { profile: true },
        });
        return user_mapper_1.UserMapper.toDomain(user);
    }
    async findById(id) {
        const user = await this.prismaService.user.findUnique({
            where: { id },
            include: { profile: true },
        });
        return user_mapper_1.UserMapper.toDomain(user);
    }
    async findByIdWithProfile(id) {
        const user = await this.prismaService.user.findUnique({
            where: { id },
            include: { profile: true },
        });
        return user_mapper_1.UserMapper.toDomain(user);
    }
    async existsByEmail(email) {
        const user = await this.prismaService.user.findUnique({
            where: { email },
            select: { id: true },
        });
        return !!user;
    }
    async save(data) {
        if (data.id) {
            const updated = await this.prismaService.user.update({
                where: { id: data.id },
                data: {
                    email: data.email,
                    password: data.password,
                    verifyCode: data.verifyCode,
                    role: data.role,
                    status: data.status,
                    profile: data.profile ? {
                        upsert: {
                            create: {
                                fullName: data.profile.fullName || '',
                                phoneNumber: data.profile.phoneNumber,
                                gender: data.profile.gender,
                                birthDate: data.profile.birthDate,
                                avatarUrl: data.profile.avatarUrl,
                                headline: data.profile.headline,
                                summary: data.profile.summary,
                            },
                            update: {
                                fullName: data.profile.fullName,
                                phoneNumber: data.profile.phoneNumber,
                                gender: data.profile.gender,
                                birthDate: data.profile.birthDate,
                                avatarUrl: data.profile.avatarUrl,
                                headline: data.profile.headline,
                                summary: data.profile.summary,
                            }
                        }
                    } : undefined
                },
                include: { profile: true }
            });
            return user_mapper_1.UserMapper.toDomain(updated);
        }
        const created = await this.prismaService.user.create({
            data: {
                email: data.email,
                password: data.password,
                verifyCode: data.verifyCode,
                role: data.role || user_role_enum_1.UserRole.CANDIDATE,
                status: data.status || user_status_enum_1.UserStatus.PENDING,
                profile: {
                    create: {
                        fullName: data.profile?.fullName || '',
                        phoneNumber: data.profile?.phoneNumber,
                        gender: data.profile?.gender,
                        headline: data.profile?.headline,
                        summary: data.profile?.summary,
                    },
                },
            },
            include: { profile: true },
        });
        return user_mapper_1.UserMapper.toDomain(created);
    }
    async updateProfile(userId, profile) {
        await this.prismaService.user.update({
            where: { id: userId },
            data: {
                profile: {
                    update: {
                        fullName: profile?.fullName,
                        phoneNumber: profile?.phoneNumber,
                        gender: profile?.gender,
                        birthDate: profile?.birthDate,
                        avatarUrl: profile?.avatarUrl,
                        headline: profile?.headline,
                        summary: profile?.summary,
                    }
                }
            }
        });
    }
    async findByVerifyCode(code) {
        const user = await this.prismaService.user.findFirst({
            where: { verifyCode: code },
            include: { profile: true },
        });
        return user_mapper_1.UserMapper.toDomain(user);
    }
    async updateCompanyId(userId, companyId) {
        await this.prismaService.user.update({
            where: { id: userId },
            data: { companyId },
        });
    }
    async findAllPaginated(page, limit) {
        const skip = (page - 1) * limit;
        const [users, total] = await Promise.all([
            this.prismaService.user.findMany({
                skip,
                take: limit,
                include: { profile: true },
                orderBy: { createdAt: 'desc' },
            }),
            this.prismaService.user.count(),
        ]);
        return {
            users: users.map(user => user_mapper_1.UserMapper.toDomain(user)),
            total,
        };
    }
};
exports.UserPrismaRepository = UserPrismaRepository;
exports.UserPrismaRepository = UserPrismaRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UserPrismaRepository);
//# sourceMappingURL=user-prisma.repository.js.map