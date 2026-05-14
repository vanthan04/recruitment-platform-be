export declare class UpdateExperienceDto {
    id?: string;
    company: string;
    position: string;
    description?: string;
    startDate: string;
    endDate?: string;
    isCurrent?: boolean;
}
export declare class UpdateEducationDto {
    id?: string;
    school: string;
    degree: string;
    fieldOfStudy?: string;
    description?: string;
    startDate: string;
    endDate?: string;
}
export declare class UpdateSkillDto {
    id?: string;
    name: string;
    level?: string;
}
export declare class UpdateCvDto {
    title?: string;
    summary?: string;
    experiences?: UpdateExperienceDto[];
    educations?: UpdateEducationDto[];
    skills?: UpdateSkillDto[];
}
