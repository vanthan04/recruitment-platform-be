import { SavedSearch } from '@/modules/job-alert/domain/entities/saved-search.entity';
export declare class SavedSearchMapper {
    static toDomain(raw: any): SavedSearch | null;
    static toPersistence(savedSearch: SavedSearch): any;
}
