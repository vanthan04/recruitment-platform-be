import { SavedSearch } from '@/modules/job-alert/domain/entities/saved-search.entity';

export abstract class ISavedSearchRepository {
  abstract findById(id: string): Promise<SavedSearch | null>;
  abstract findAllByUserId(userId: string): Promise<SavedSearch[]>;
  abstract findAll(): Promise<SavedSearch[]>;
  /** Keyset-paginated batch, ordered by id — for the digest cron, which can't afford to load the whole table into memory at once. */
  abstract findBatch(params: {
    cursor?: string;
    take: number;
  }): Promise<SavedSearch[]>;
  abstract save(savedSearch: SavedSearch): Promise<SavedSearch>;
  abstract delete(id: string): Promise<void>;
}
