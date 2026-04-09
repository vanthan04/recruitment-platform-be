import { Module } from '@nestjs/common';
import { UserService } from '@/modules/user/application/user.service';
import { UserController } from '@/modules/user/presentation/controllers/user.controller';
import { UserAdminController } from '@/modules/user/presentation/controllers/user-admin.controller';
import { UserInfraRepository } from '@/modules/user/infrastructure/repositories/user.infra-repository';
import { AddressInfraRepository } from '@/modules/user/infrastructure/repositories/address.infra-repository';
import { IUserRepository } from '@/modules/user/domain/repositories/user.repository';
import { IAddressRepository } from '@/modules/user/domain/repositories/address.repository';
import { UserPrismaRepository } from '@/modules/user/infrastructure/persistence/prisma/user-prisma.repository';
import { AddressPrismaRepository } from '@/modules/user/infrastructure/persistence/prisma/address-prisma.repository';
import { FileUploadModule } from '@/modules/file-upload/file-upload.module';
import { IUserFileStoragePort } from './application/ports/user-file-storage.port';
import { UserFileStorageAdapter } from './infrastructure/adapters/user-file-storage.adapter';

// Use Cases
import { GetMyProfileUseCase } from './application/use-cases/get-my-profile.use-case';
import { UpdateProfileUseCase } from './application/use-cases/update-profile.use-case';
import { AddAddressUseCase } from './application/use-cases/add-address.use-case';
import { UpdateAddressUseCase } from './application/use-cases/update-address.use-case';
import { DeleteAddressUseCase } from './application/use-cases/delete-address.use-case';
import { SetDefaultAddressUseCase } from './application/use-cases/set-default-address.use-case';
import { AdminListUsersUseCase } from './application/use-cases/admin-list-users.use-case';
import { AdminUpdateUserStatusUseCase } from './application/use-cases/admin-update-user-status.use-case';

@Module({
  imports: [FileUploadModule],
  controllers: [UserController, UserAdminController],
  providers: [
    UserService,
    UserPrismaRepository,
    AddressPrismaRepository,
    {
      provide: IUserRepository,
      useClass: UserInfraRepository,
    },
    {
      provide: IAddressRepository,
      useClass: AddressInfraRepository,
    },
    {
      provide: IUserFileStoragePort,
      useClass: UserFileStorageAdapter,
    },
    // Registering Use Cases as providers
    GetMyProfileUseCase,
    UpdateProfileUseCase,
    AddAddressUseCase,
    UpdateAddressUseCase,
    DeleteAddressUseCase,
    SetDefaultAddressUseCase,
    AdminListUsersUseCase,
    AdminUpdateUserStatusUseCase,
  ],
  exports: [UserService, IUserRepository, IAddressRepository],
})
export class UserModule { }
