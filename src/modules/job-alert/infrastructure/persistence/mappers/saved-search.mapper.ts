import { SavedSearch } from '@/modules/job-alert/domain/entities/saved-search.entity';
import { EmploymentType } from '@/modules/job/domain/value-objects/employment-type.vo';
import { WorkMode } from '@/modules/job/domain/value-objects/work-mode.vo';

export class SavedSearchMapper {
  static toDomain(raw: any): SavedSearch | null {
    if (!raw) return null;

    return new SavedSearch({
      id: raw.id,
      userId: raw.userId,
      keyword: raw.keyword,
      location: raw.location,
      categoryId: raw.categoryId,
      employmentType: raw.employmentType as EmploymentType | null,
      workMode: raw.workMode as WorkMode | null,
      createdAt: raw.createdAt,
    });
  }

  static toPersistence(savedSearch: SavedSearch): any {
    return {
      userId: savedSearch.userId,
      keyword: savedSearch.keyword,
      location: savedSearch.location,
      categoryId: savedSearch.categoryId,
      employmentType: savedSearch.employmentType,
      workMode: savedSearch.workMode,
    };
  }
}
