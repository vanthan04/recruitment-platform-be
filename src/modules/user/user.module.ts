import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { UserController } from '@/modules/user/presentation/controllers/user.controller';
import { UserAdminController } from '@/modules/user/presentation/controllers/user-admin.controller';
import { IUserRepository } from '@/modules/user/domain/repositories/user.repository';
import { UserPrismaRepository } from '@/modules/user/infrastructure/persistence/prisma/user-prisma.repository';

import { GetMyProfileHandler } from './application/queries/get-my-profile.query';
import { UpdateProfileHandler } from './application/commands/update-profile.command';
import { AdminListUsersHandler } from './application/queries/admin-list-users.query';
import { AdminUpdateUserStatusHandler } from './application/commands/admin-update-user-status.command';

@Module({
  imports: [CqrsModule],
  controllers: [UserController, UserAdminController],
  providers: [
    UserPrismaRepository,
    {
      provide: IUserRepository,
      useClass: UserPrismaRepository,
    },
    GetMyProfileHandler,
    UpdateProfileHandler,
    AdminListUsersHandler,
    AdminUpdateUserStatusHandler,
  ],
  exports: [IUserRepository],
})
export class UserModule {}
