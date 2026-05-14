import { BaseEntity } from '@/common/domain/base.entity';
export declare class Skill extends BaseEntity {
    name: string;
    level: string | null;
    cvId: string;
    constructor(partial: Partial<Skill>);
}
