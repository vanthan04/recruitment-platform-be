import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IUserRepository } from '@/modules/user/domain/repositories/user.repository';
import { ISessionRevocationPort } from '@/modules/user/application/ports/session-revocation.port';
import { UserStatus } from '@/common/enums/user-status.enum';
import { UserRole } from '@/common/enums/user-role.enum';
import {
  UserNotFoundException,
  CannotModifyOwnAccountException,
  CannotRemoveLastAdminException,
} from '@/modules/user/domain/exceptions/user.exceptions';

export interface AdminUpdateUserInput {
  status?: UserStatus;
  role?: UserRole;
}

export class AdminUpdateUserStatusCommand {
  constructor(
    public readonly actingAdminId: string,
    public readonly userId: string,
    public readonly input: AdminUpdateUserInput,
  ) {}
}

@Injectable()
@CommandHandler(AdminUpdateUserStatusCommand)
export class AdminUpdateUserStatusHandler implements ICommandHandler<AdminUpdateUserStatusCommand> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly sessionRevocation: ISessionRevocationPort,
  ) {}

  async execute({ actingAdminId, userId, input }: AdminUpdateUserStatusCommand) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException(userId);
    }

    // An admin demoting/blocking themselves can strand the platform with no
    // one left who can reach this very endpoint to undo it — force a
    // different admin to make that call instead.
    const isSelfBlock = input.status && input.status !== UserStatus.ACTIVE;
    const isSelfDemote = input.role && input.role !== user.role;
    if (userId === actingAdminId && (isSelfBlock || isSelfDemote)) {
      throw new CannotModifyOwnAccountException();
    }

    const isRemovingAdminAccess =
      user.role === UserRole.ADMIN &&
      ((input.status && input.status !== UserStatus.ACTIVE) ||
        (input.role && input.role !== UserRole.ADMIN));
    if (isRemovingAdminAccess) {
      const activeAdmins = await this.userRepository.countActiveAdmins();
      if (activeAdmins <= 1) {
        throw new CannotRemoveLastAdminException();
      }
    }

    if (input.status) {
      user.changeStatus(input.status);
    }
    if (input.role) {
      user.changeRole(input.role);
    }

    await this.userRepository.save(user);

    if (input.status === UserStatus.BLOCKED) {
      await this.sessionRevocation.revokeAllForUser(userId);
    }

    return {
      message: 'User status updated successfully',
    };
  }
}
