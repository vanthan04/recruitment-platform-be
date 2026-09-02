import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RegisterRequestDto } from '@/modules/auth/presentation/dtos/register-request.dto';
import { IAuthUserRepositoryPort } from '@/modules/auth/application/ports/auth-user-repository.port';
import { IAuthMailServicePort } from '@/modules/auth/application/ports/auth-mail-service.port';
import { UserStatus } from '@/common/enums/user-status.enum';
import { EmailAlreadyRegisteredException } from '@/modules/auth/domain/exceptions/auth.exceptions';
import * as bcrypt from 'bcrypt';

export class RegisterCommand {
  constructor(public readonly dto: RegisterRequestDto) {}
}

@Injectable()
@CommandHandler(RegisterCommand)
export class RegisterHandler implements ICommandHandler<
  RegisterCommand,
  { email: string }
> {
  constructor(
    private readonly userRepository: IAuthUserRepositoryPort,
    private readonly mailService: IAuthMailServicePort,
  ) {}

  async execute({ dto }: RegisterCommand): Promise<{ email: string }> {
    const isExisted = await this.userRepository.existsByEmail(dto.email);
    if (isExisted) {
      throw new EmailAlreadyRegisteredException();
    }

    const salt = await bcrypt.genSalt();
    const hashPassword = await bcrypt.hash(dto.password, salt);

    const verifyCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const newUser = await this.userRepository.save({
      email: dto.email,
      password: hashPassword,
      fullName: dto.fullName,
      verifyCode,
      role: dto.role,
      status: UserStatus.PENDING,
    });

    await this.mailService.sendEmail({
      to: dto.email,
      subject: 'Xác thực tài khoản của bạn',
      text: `Mã xác thực của bạn là: ${verifyCode}`,
      html: `<b>Mã xác thực của bạn là: ${verifyCode}</b>`,
    });

    return {
      email: newUser.email,
    };
  }
}
