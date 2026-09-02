import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { IJobApplicationRepository } from '@/modules/application/domain/repositories/job-application.repository';
import { ApplicationResponseMapper } from '@/modules/application/application/mappers/application-response.mapper';
import { ApplicationResponseDto } from '@/modules/application/application/dto/application-response.dto';

export class ListMyApplicationsQuery {
  constructor(public readonly userId: string) {}
}

@Injectable()
@QueryHandler(ListMyApplicationsQuery)
export class ListMyApplicationsHandler implements IQueryHandler<
  ListMyApplicationsQuery,
  ApplicationResponseDto[]
> {
  constructor(
    private readonly applicationRepository: IJobApplicationRepository,
  ) {}

  async execute({
    userId,
  }: ListMyApplicationsQuery): Promise<ApplicationResponseDto[]> {
    const apps = await this.applicationRepository.findAllByUserId(userId);
    return ApplicationResponseMapper.toDtoList(apps);
  }
}
