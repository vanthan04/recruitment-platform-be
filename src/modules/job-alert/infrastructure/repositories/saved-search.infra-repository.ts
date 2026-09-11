import { Injectable } from '@nestjs/common';
import { ISavedSearchRepository } from '@/modules/job-alert/domain/repositories/saved-search.repository';
import { SavedSearch } from '@/modules/job-alert/domain/entities/saved-search.entity';
import { SavedSearchPrismaRepository } from '@/modules/job-alert/infrastructure/persistence/prisma/saved-search-prisma.repository';
import { SavedSearchMapper } from '@/modules/job-alert/infrastructure/persistence/mappers/saved-search.mapper';

@Injectable()
export class SavedSearchInfraRepository implements ISavedSearchRepository {
  constructor(
    private readonly savedSearchPrisma: SavedSearchPrismaRepository,
  ) {}

  async findById(id: string): Promise<SavedSearch | null> {
    const raw = await this.savedSearchPrisma.findById(id);
    return SavedSearchMapper.toDomain(raw);
  }

  async findAllByUserId(
    userId: string,
    params: { skip: number; take: number },
  ): Promise<{ savedSearches: SavedSearch[]; total: number }> {
    const { savedSearches: raws, total } =
      await this.savedSearchPrisma.findAllByUserId(userId, params);
    return {
      savedSearches: raws.map((r) => SavedSearchMapper.toDomain(r)!),
      total,
    };
  }

  async countByUserId(userId: string): Promise<number> {
    return this.savedSearchPrisma.countByUserId(userId);
  }

  async findAll(): Promise<SavedSearch[]> {
    const raws = await this.savedSearchPrisma.findAll();
    return raws.map((r) => SavedSearchMapper.toDomain(r)!);
  }

  async findBatch(params: {
    cursor?: string;
    take: number;
  }): Promise<SavedSearch[]> {
    const raws = await this.savedSearchPrisma.findBatch(params);
    return raws.map((r) => SavedSearchMapper.toDomain(r)!);
  }

  async save(savedSearch: SavedSearch): Promise<SavedSearch> {
    const data = SavedSearchMapper.toPersistence(savedSearch);
    const raw = await this.savedSearchPrisma.create(data);
    return SavedSearchMapper.toDomain(raw)!;
  }

  async delete(id: string): Promise<void> {
    await this.savedSearchPrisma.delete(id);
  }
}
