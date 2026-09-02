import { BaseEntity } from '@/common/domain/base.entity';
export declare class Category extends BaseEntity {
    name: string;
    slug: string;
    constructor(partial: Partial<Category>);
    updateName(name: string): void;
}
