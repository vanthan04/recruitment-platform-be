import { Injectable } from '@nestjs/common';
import { IUserRepository } from '@/modules/user/domain/repositories/user.repository';
import { User } from '@/modules/user/domain/entities/user.entity';

// Use Cases
import { GetMyProfileUseCase } from './use-cases/get-my-profile.use-case';
import { UpdateProfileUseCase, UpdateProfileInput } from './use-cases/update-profile.use-case';
import { AddAddressUseCase, AddAddressInput } from './use-cases/add-address.use-case';
import { UpdateAddressUseCase, UpdateAddressInput } from './use-cases/update-address.use-case';
import { DeleteAddressUseCase } from './use-cases/delete-address.use-case';
import { SetDefaultAddressUseCase } from './use-cases/set-default-address.use-case';
import { AdminListUsersUseCase } from './use-cases/admin-list-users.use-case';
import { AdminUpdateUserStatusUseCase, AdminUpdateUserInput } from './use-cases/admin-update-user-status.use-case';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly getMyProfileUseCase: GetMyProfileUseCase,
    private readonly updateProfileUseCase: UpdateProfileUseCase,
    private readonly addAddressUseCase: AddAddressUseCase,
    private readonly updateAddressUseCase: UpdateAddressUseCase,
    private readonly deleteAddressUseCase: DeleteAddressUseCase,
    private readonly setDefaultAddressUseCase: SetDefaultAddressUseCase,
    private readonly adminListUsersUseCase: AdminListUsersUseCase,
    private readonly adminUpdateUserStatusUseCase: AdminUpdateUserStatusUseCase,
  ) { }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async isExistedUser(email: string): Promise<boolean> {
    return this.userRepository.existsByEmail(email);
  }

  async createNewUser(
    email: string,
    hashPassword: string,
    fullName: string,
    verifyCode: string,
  ): Promise<User> {
    const user = new User({
      email,
      password: hashPassword,
      profile: { fullName } as any,
      verifyCode,
    });
    return this.userRepository.save(user);
  }

  async updateRefreshToken(userId: string, refreshToken: string | null): Promise<void> {
    await this.userRepository.updateRefreshToken(userId, refreshToken);
  }

  // Profile Facade Methods
  async getMyProfile(userId: string) {
    return this.getMyProfileUseCase.execute(userId);
  }

  async updateProfile(userId: string, input: UpdateProfileInput) {
    return this.updateProfileUseCase.execute(userId, input);
  }

  // Address Facade Methods
  async addAddress(userId: string, input: AddAddressInput) {
    return this.addAddressUseCase.execute(userId, input);
  }

  async updateAddress(userId: string, addressId: string, input: UpdateAddressInput) {
    return this.updateAddressUseCase.execute(userId, addressId, input);
  }

  async deleteAddress(userId: string, addressId: string) {
    return this.deleteAddressUseCase.execute(userId, addressId);
  }

  async setDefaultAddress(userId: string, addressId: string) {
    return this.setDefaultAddressUseCase.execute(userId, addressId);
  }

  // Admin Facade Methods
  async listUsers(page: number, limit: number) {
    return this.adminListUsersUseCase.execute(page, limit);
  }

  async updateUserStatus(userId: string, input: AdminUpdateUserInput) {
    return this.adminUpdateUserStatusUseCase.execute(userId, input);
  }
}
