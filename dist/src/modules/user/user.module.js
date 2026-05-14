"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModule = void 0;
const common_1 = require("@nestjs/common");
const user_controller_1 = require("./presentation/controllers/user.controller");
const user_admin_controller_1 = require("./presentation/controllers/user-admin.controller");
const user_repository_1 = require("./domain/repositories/user.repository");
const user_prisma_repository_1 = require("./infrastructure/persistence/prisma/user-prisma.repository");
const file_upload_module_1 = require("../file-upload/file-upload.module");
const user_file_storage_port_1 = require("./application/ports/user-file-storage.port");
const user_file_storage_adapter_1 = require("./infrastructure/adapters/user-file-storage.adapter");
const get_my_profile_use_case_1 = require("./application/use-cases/get-my-profile.use-case");
const update_profile_use_case_1 = require("./application/use-cases/update-profile.use-case");
const admin_list_users_use_case_1 = require("./application/use-cases/admin-list-users.use-case");
const admin_update_user_status_use_case_1 = require("./application/use-cases/admin-update-user-status.use-case");
let UserModule = class UserModule {
};
exports.UserModule = UserModule;
exports.UserModule = UserModule = __decorate([
    (0, common_1.Module)({
        imports: [file_upload_module_1.FileUploadModule],
        controllers: [user_controller_1.UserController, user_admin_controller_1.UserAdminController],
        providers: [
            user_prisma_repository_1.UserPrismaRepository,
            {
                provide: user_repository_1.IUserRepository,
                useClass: user_prisma_repository_1.UserPrismaRepository,
            },
            {
                provide: user_file_storage_port_1.IUserFileStoragePort,
                useClass: user_file_storage_adapter_1.UserFileStorageAdapter,
            },
            get_my_profile_use_case_1.GetMyProfileUseCase,
            update_profile_use_case_1.UpdateProfileUseCase,
            admin_list_users_use_case_1.AdminListUsersUseCase,
            admin_update_user_status_use_case_1.AdminUpdateUserStatusUseCase,
        ],
        exports: [user_repository_1.IUserRepository],
    })
], UserModule);
//# sourceMappingURL=user.module.js.map