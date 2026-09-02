import { ISavedSearchRepository } from '@/modules/job-alert/domain/repositories/saved-search.repository';
import { SavedSearch } from '@/modules/job-alert/domain/entities/saved-search.entity';
import { SavedSearchPrismaRepository } from '@/modules/job-alert/infrastructure/persistence/prisma/saved-search-prisma.repository';
export declare class SavedSearchInfraRepository implements ISavedSearchRepository {
    private readonly savedSearchPrisma;
    constructor(savedSearchPrisma: SavedSearchPrismaRepository);
    findById(id: string): Promise<SavedSearch | null>;
    findAllByUserId(userId: string): Promise<SavedSearch[]>;
    findAll(): Promise<SavedSearch[]>;
    save(savedSearch: SavedSearch): Promise<SavedSearch>;
    delete(id: string): Promise<void>;
}
