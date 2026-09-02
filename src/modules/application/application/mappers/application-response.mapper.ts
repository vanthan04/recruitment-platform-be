import { JobApplication } from '@/modules/application/domain/entities/job-application.entity';
import { ApplicationResponseDto } from '@/modules/application/application/dto/application-response.dto';

export class ApplicationResponseMapper {
  static toDto(app: JobApplication): ApplicationResponseDto {
    const dto = new ApplicationResponseDto();
    dto.id = app.id;
    dto.status = app.status;
    dto.coverLetter = app.coverLetter;
    dto.userId = app.userId;
    dto.jobId = app.jobId;
    dto.cvId = app.cvId;
    dto.createdAt = app.createdAt;
    dto.updatedAt = app.updatedAt;

    // In a real scenario, we might map nested relations if they exist in the domain object
    return dto;
  }

  static toDtoList(apps: JobApplication[]): ApplicationResponseDto[] {
    return apps.map(ApplicationResponseMapper.toDto);
  }
}
