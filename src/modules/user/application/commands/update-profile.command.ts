import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IUserRepository } from '@/modules/user/domain/repositories/user.repository';
import { Gender } from '@/common/enums/gender.enum';
import { UserNotFoundException } from '@/modules/user/domain/exceptions/user.exceptions';

export interface UpdateProfileInput {
  fullName?: string;
  phoneNumber?: string;
  gender?: Gender;
  birthDate?: Date;
  avatarUrl?: string;
}

export class UpdateProfileCommand {
  constructor(
    public readonly userId: string,
    public readonly input: UpdateProfileInput,
  ) {}
}

@Injectable()
@CommandHandler(UpdateProfileCommand)
export class UpdateProfileHandler implements ICommandHandler<UpdateProfileCommand> {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute({ userId, input }: UpdateProfileCommand) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException(userId);
    }

    await this.userRepository.updateProfile(userId, input);

    return {
      message: 'Profile updated successfully',
    };
  }
}
