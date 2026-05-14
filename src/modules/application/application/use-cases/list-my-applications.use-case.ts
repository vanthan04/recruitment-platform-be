import { Injectable } from '@nestjs/common';
import { IJobApplicationRepository } from '@/modules/application/domain/repositories/job-application.repository';
import { ApplicationResponseMapper } from '@/modules/application/application/mappers/application-response.mapper';
import { ApplicationResponseDto } from '@/modules/application/application/dto/application-response.dto';

@Injectable()
export class ListMyApplicationsUseCase {
  constructor(private readonly applicationRepository: IJobApplicationRepository) {}

  async execute(userId: string): Promise<ApplicationResponseDto[]> {
    const apps = await this.applicationRepository.findAllByUserId(userId);
    return ApplicationResponseMapper.toDtoList(apps);
  }
}
