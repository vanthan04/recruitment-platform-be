import { SavedSearch } from '@/modules/job-alert/domain/entities/saved-search.entity';
import { JobType } from '@/modules/job/domain/value-objects/job-type.vo';

export class SavedSearchMapper {
  static toDomain(raw: any): SavedSearch | null {
    if (!raw) return null;

    return new SavedSearch({
      id: raw.id,
      userId: raw.userId,
      keyword: raw.keyword,
      location: raw.location,
      categoryId: raw.categoryId,
      jobType: raw.jobType as JobType | null,
      createdAt: raw.createdAt,
    });
  }

  static toPersistence(savedSearch: SavedSearch): any {
    return {
      userId: savedSearch.userId,
      keyword: savedSearch.keyword,
      location: savedSearch.location,
      categoryId: savedSearch.categoryId,
      jobType: savedSearch.jobType,
    };
  }
}
