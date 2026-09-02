import { SavedSearch } from '@/modules/job-alert/domain/entities/saved-search.entity';
export declare abstract class ISavedSearchRepository {
    abstract findById(id: string): Promise<SavedSearch | null>;
    abstract findAllByUserId(userId: string): Promise<SavedSearch[]>;
    abstract findAll(): Promise<SavedSearch[]>;
    abstract save(savedSearch: SavedSearch): Promise<SavedSearch>;
    abstract delete(id: string): Promise<void>;
}
