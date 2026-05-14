import { Cv } from '@/modules/cv/domain/entities/cv.entity';
import { CvResponseDto } from '@/modules/cv/application/dto/cv-response.dto';
export declare class CvResponseMapper {
    static toDto(cv: Cv): CvResponseDto;
    static toDtoList(cvs: Cv[]): CvResponseDto[];
    private static toExperienceDto;
    private static toEducationDto;
    private static toSkillDto;
}
