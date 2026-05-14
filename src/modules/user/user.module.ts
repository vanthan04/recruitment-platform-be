import { Module } from '@nestjs/common';
import { UserController } from '@/modules/user/presentation/controllers/user.controller';
import { UserAdminController } from '@/modules/user/presentation/controllers/user-admin.controller';
import { IUserRepository } from '@/modules/user/domain/repositories/user.repository';
import { UserPrismaRepository } from '@/modules/user/infrastructure/persistence/prisma/user-prisma.repository';
import { FileUploadModule } from '@/modules/file-upload/file-upload.module';
import { IUserFileStoragePort } from './application/ports/user-file-storage.port';
import { UserFileStorageAdapter } from './infrastructure/adapters/user-file-storage.adapter';

// Use Cases
import { GetMyProfileUseCase } from './application/use-cases/get-my-profile.use-case';
import { UpdateProfileUseCase } from './application/use-cases/update-profile.use-case';
import { AdminListUsersUseCase } from './application/use-cases/admin-list-users.use-case';
import { AdminUpdateUserStatusUseCase } from './application/use-cases/admin-update-user-status.use-case';

@Module({
  imports: [FileUploadModule],
  controllers: [UserController, UserAdminController],
  providers: [
    UserPrismaRepository,
    {
      provide: IUserRepository,
      useClass: UserPrismaRepository,
    },
    {
      provide: IUserFileStoragePort,
      useClass: UserFileStorageAdapter,
    },
    // Registering Use Cases as providers
    GetMyProfileUseCase,
    UpdateProfileUseCase,
    AdminListUsersUseCase,
    AdminUpdateUserStatusUseCase,
  ],
  exports: [IUserRepository],
})
export class UserModule { }
