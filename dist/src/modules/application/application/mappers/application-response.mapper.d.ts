import { JobApplication } from '@/modules/application/domain/entities/job-application.entity';
import { ApplicationResponseDto } from '@/modules/application/application/dto/application-response.dto';
export declare class ApplicationResponseMapper {
    static toDto(app: JobApplication): ApplicationResponseDto;
    static toDtoList(apps: JobApplication[]): ApplicationResponseDto[];
}
