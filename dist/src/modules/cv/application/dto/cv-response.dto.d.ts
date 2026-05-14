export declare class CvResponseDto {
    id: string;
    title: string;
    summary: string | null;
    status: string;
    publishedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    experiences: ExperienceResponseDto[];
    educations: EducationResponseDto[];
    skills: SkillResponseDto[];
}
export declare class ExperienceResponseDto {
    id: string;
    company: string;
    position: string;
    description: string | null;
    startDate: Date;
    endDate: Date | null;
    isCurrent: boolean;
}
export declare class EducationResponseDto {
    id: string;
    school: string;
    degree: string;
    fieldOfStudy: string | null;
    description: string | null;
    startDate: Date;
    endDate: Date | null;
}
export declare class SkillResponseDto {
    id: string;
    name: string;
    level: string | null;
}
