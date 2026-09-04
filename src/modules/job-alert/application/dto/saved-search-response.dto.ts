export class SavedSearchResponseDto {
  id: string;
  keyword: string | null;
  location: string | null;
  categoryId: string | null;
  employmentType: string | null;
  workMode: string | null;
  createdAt: Date;
}
