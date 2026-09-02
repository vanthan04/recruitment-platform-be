import { Category } from '@/modules/category/domain/entities/category.entity';
export declare class CategoryMapper {
    static toDomain(raw: any): Category | null;
    static toPersistence(category: Category): any;
}
