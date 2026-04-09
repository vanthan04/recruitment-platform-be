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
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const user_repository_1 = require("../domain/user.repository");
const user_entity_1 = require("../domain/user.entity");
let UserService = class UserService {
    userRepository;
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async findByEmail(email) {
        return this.userRepository.findByEmail(email);
    }
    async findById(id) {
        return this.userRepository.findById(id);
    }
    async isExistedUser(email) {
        return this.userRepository.existsByEmail(email);
    }
    async createNewUser(email, hashPassword, fullName, verifyCode) {
        const user = new user_entity_1.User({
            email,
            password: hashPassword,
            fullName,
            verifyCode,
            role: 'USER',
            status: 'PENDING',
        });
        return this.userRepository.save(user);
    }
    async updateRefreshToken(userId, refreshToken) {
        await this.userRepository.updateRefreshToken(userId, refreshToken);
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [user_repository_1.IUserRepository])
], UserService);
//# sourceMappingURL=user.service.js.map