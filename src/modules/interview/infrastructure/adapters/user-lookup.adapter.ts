import { Injectable } from '@nestjs/common';
import {
  IInterviewUserLookupPort,
  InterviewUserLookupResult,
} from '@/modules/interview/application/ports/user-lookup.port';
import { IUserRepository } from '@/modules/user/domain/repositories/user.repository';

@Injectable()
export class InterviewUserLookupAdapter implements IInterviewUserLookupPort {
  constructor(private readonly userRepository: IUserRepository) {}

  async findById(userId: string): Promise<InterviewUserLookupResult | null> {
    const user = await this.userRepository.findByIdWithProfile(userId);
    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      fullName: user.profile?.fullName ?? user.email,
    };
  }
}
