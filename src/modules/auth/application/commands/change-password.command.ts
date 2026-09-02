import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IAuthUserRepositoryPort } from '@/modules/auth/application/ports/auth-user-repository.port';
import { ChangePasswordDto } from '@/modules/auth/presentation/dtos/change-password.dto';
import * as bcrypt from 'bcrypt';

export class ChangePasswordCommand {
  constructor(
    public readonly userId: string,
    public readonly dto: ChangePasswordDto,
  ) {}
}

@Injectable()
@CommandHandler(ChangePasswordCommand)
export class ChangePasswordHandler
  implements ICommandHandler<ChangePasswordCommand, { message: string }>
{
  constructor(private readonly userRepository: IAuthUserRepositoryPort) {}

  async execute({ userId, dto }: ChangePasswordCommand): Promise<{ message: string }> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    const isMatch = await bcrypt.compare(dto.oldPassword, user.password!);
    if (!isMatch) {
      throw new UnauthorizedException('Mật khẩu cũ không chính xác');
    }

    const salt = await bcrypt.genSalt();
    user.password = await bcrypt.hash(dto.newPassword, salt);

    await this.userRepository.save(user);

    return {
      message: 'Đổi mật khẩu thành công',
    };
  }
}
