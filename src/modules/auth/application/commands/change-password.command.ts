import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IAuthUserRepositoryPort } from '@/modules/auth/application/ports/auth-user-repository.port';
import { ChangePasswordDto } from '@/modules/auth/presentation/dtos/change-password.dto';
import {
  UserNotFoundException,
  InvalidOldPasswordException,
} from '@/modules/auth/domain/exceptions/auth.exceptions';
import * as bcrypt from 'bcrypt';

export class ChangePasswordCommand {
  constructor(
    public readonly userId: string,
    public readonly dto: ChangePasswordDto,
  ) {}
}

@Injectable()
@CommandHandler(ChangePasswordCommand)
export class ChangePasswordHandler implements ICommandHandler<
  ChangePasswordCommand,
  { message: string }
> {
  constructor(private readonly userRepository: IAuthUserRepositoryPort) {}

  async execute({
    userId,
    dto,
  }: ChangePasswordCommand): Promise<{ message: string }> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException(userId);
    }

    const isMatch = await bcrypt.compare(dto.oldPassword, user.password!);
    if (!isMatch) {
      throw new InvalidOldPasswordException();
    }

    const salt = await bcrypt.genSalt();
    user.password = await bcrypt.hash(dto.newPassword, salt);

    await this.userRepository.save(user);

    return {
      message: 'Đổi mật khẩu thành công',
    };
  }
}
