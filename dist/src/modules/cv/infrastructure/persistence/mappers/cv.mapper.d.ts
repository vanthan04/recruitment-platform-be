import { Cv } from '@/modules/cv/domain/entities/cv.entity';
import { Experience } from '@/modules/cv/domain/entities/experience.entity';
import { Education } from '@/modules/cv/domain/entities/education.entity';
import { Skill } from '@/modules/cv/domain/entities/skill.entity';
export declare class CvMapper {
    static toDomain(raw: any): Cv | null;
    static experienceToDomain(raw: any): Experience;
    static educationToDomain(raw: any): Education;
    static skillToDomain(raw: any): Skill;
    static toPersistence(cv: Cv): any;
    static experienceToPersistence(exp: Experience): any;
    static educationToPersistence(edu: Education): any;
    static skillToPersistence(skill: Skill): any;
}
