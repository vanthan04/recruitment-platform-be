import { Cv } from '@/modules/cv/domain/entities/cv.entity';
import { CvResponseDto } from '@/modules/cv/application/dto/cv-response.dto';

/**
 * Maps domain entities to response DTOs.
 * Lives in the application layer — knows about both domain and DTOs.
 */
export class CvResponseMapper {
  static toDto(cv: Cv): CvResponseDto {
    const dto = new CvResponseDto();
    dto.id = cv.id;
    dto.title = cv.title;
    dto.originalName = cv.originalName;
    dto.fileType = cv.fileType;
    dto.mimeType = cv.mimeType;
    dto.fileSize = cv.fileSize;
    dto.status = cv.status;
    dto.createdAt = cv.createdAt;
    dto.updatedAt = cv.updatedAt;
    dto.userId = cv.userId;
    return dto;
  }

  static toDtoList(cvs: Cv[]): CvResponseDto[] {
    return cvs.map(CvResponseMapper.toDto);
  }
}
