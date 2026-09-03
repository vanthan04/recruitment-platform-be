import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IUserRepository } from '@/modules/user/domain/repositories/user.repository';
import { UserStatus } from '@/common/enums/user-status.enum';
import { UserRole } from '@/common/enums/user-role.enum';
import { UserNotFoundException } from '@/modules/user/domain/exceptions/user.exceptions';

export interface AdminUpdateUserInput {
  status?: UserStatus;
  role?: UserRole;
}

export class AdminUpdateUserStatusCommand {
  constructor(
    public readonly userId: string,
    public readonly input: AdminUpdateUserInput,
  ) {}
}

@Injectable()
@CommandHandler(AdminUpdateUserStatusCommand)
export class AdminUpdateUserStatusHandler implements ICommandHandler<AdminUpdateUserStatusCommand> {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute({ userId, input }: AdminUpdateUserStatusCommand) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException(userId);
    }

    if (input.status) {
      user.changeStatus(input.status);
    }
    if (input.role) {
      user.changeRole(input.role);
    }

    await this.userRepository.save(user);

    return {
      message: 'User status updated successfully',
    };
  }
}
