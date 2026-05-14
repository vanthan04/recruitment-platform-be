export declare class CreateExperienceDto {
    company: string;
    position: string;
    description?: string;
    startDate: string;
    endDate?: string;
    isCurrent?: boolean;
}
export declare class CreateEducationDto {
    school: string;
    degree: string;
    fieldOfStudy?: string;
    description?: string;
    startDate: string;
    endDate?: string;
}
export declare class CreateSkillDto {
    name: string;
    level?: string;
}
export declare class CreateCvDto {
    title: string;
    summary?: string;
    experiences?: CreateExperienceDto[];
    educations?: CreateEducationDto[];
    skills?: CreateSkillDto[];
}
