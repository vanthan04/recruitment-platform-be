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
exports.AdminListUsersUseCase = void 0;
const common_1 = require("@nestjs/common");
const user_repository_1 = require("../../domain/repositories/user.repository");
const pagination_util_1 = require("../../../../common/utils/pagination.util");
const api_response_1 = require("../../../../common/dtos/api-response");
let AdminListUsersUseCase = class AdminListUsersUseCase {
    userRepository;
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async execute(page = 1, limit = 10) {
        const normalized = (0, pagination_util_1.normalizePagination)({ page, limit });
        const { users, total } = await this.userRepository.findAllPaginated(normalized.page, normalized.limit);
        const data = users.map(user => {
            const { password, ...safeUser } = user;
            return safeUser;
        });
        const paginationInfo = (0, pagination_util_1.getPaginationInfo)({
            page: normalized.page,
            limit: normalized.limit,
            total,
        });
        return api_response_1.ApiResponse.ok(data, 'Lấy danh sách người dùng thành công', paginationInfo);
    }
};
exports.AdminListUsersUseCase = AdminListUsersUseCase;
exports.AdminListUsersUseCase = AdminListUsersUseCase = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [user_repository_1.IUserRepository])
], AdminListUsersUseCase);
//# sourceMappingURL=admin-list-users.use-case.js.map