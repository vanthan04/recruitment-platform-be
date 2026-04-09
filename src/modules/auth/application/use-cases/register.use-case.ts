import { Injectable, ConflictException } from '@nestjs/common';
import { RegisterRequestDto } from '@/modules/auth/presentation/dtos/register-request.dto';
import { IAuthUserRepositoryPort } from '../ports/auth-user-repository.port';
import { IAuthMailServicePort } from '../ports/auth-mail-service.port';
import { UserRole } from '@/common/enums/user-role.enum';
import { UserStatus } from '@/common/enums/user-status.enum';
import * as bcrypt from 'bcrypt';

@Injectable()
export class RegisterUseCase {
  constructor(
    private readonly userRepository: IAuthUserRepositoryPort,
    private readonly mailService: IAuthMailServicePort,
  ) { }

  async execute(dto: RegisterRequestDto) {
    const isExisted = await this.userRepository.existsByEmail(dto.email);
    if (isExisted) {
      throw new ConflictException('EMAIL_ALREADY_EXISTS');
    }

    const salt = await bcrypt.genSalt();
    const hashPassword = await bcrypt.hash(dto.password, salt);

    const verifyCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const newUser = await this.userRepository.save({
      email: dto.email,
      password: hashPassword,
      fullName: dto.fullName,
      verifyCode,
      role: UserRole.USER,
      status: UserStatus.PENDING,
    });

    // Send Real Email
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
