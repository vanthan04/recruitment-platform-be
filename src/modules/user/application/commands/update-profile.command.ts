import { Injectable } from '@nestjs/common';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IUserRepository } from '@/modules/user/domain/repositories/user.repository';
import { Gender } from '@/common/enums/gender.enum';
import {
  UserNotFoundException,
  InvalidAvatarUrlException,
} from '@/modules/user/domain/exceptions/user.exceptions';
import { IFileStorageProvider } from '@/modules/file-upload/domain/providers/file-storage.provider.interface';

export interface UpdateProfileInput {
  fullName?: string;
  phoneNumber?: string;
  gender?: Gender;
  birthDate?: Date;
  avatarUrl?: string;
}

export interface UpdateProfileResult {
  message: string;
}

export class UpdateProfileCommand extends Command<UpdateProfileResult> {
  constructor(
    public readonly userId: string,
    public readonly input: UpdateProfileInput,
  ) {
    super();
  }
}

@Injectable()
@CommandHandler(UpdateProfileCommand)
export class UpdateProfileHandler implements ICommandHandler<UpdateProfileCommand> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly fileStorage: IFileStorageProvider,
  ) {}

  async execute({
    userId,
    input,
  }: UpdateProfileCommand): Promise<UpdateProfileResult> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException(userId);
    }

    if (input.avatarUrl && !this.fileStorage.isOwnedUrl(input.avatarUrl)) {
      throw new InvalidAvatarUrlException();
    }

    await this.userRepository.updateProfile(userId, input);

    return {
      message: 'Profile updated successfully',
    };
  }
}
