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

  async findAllByUserId(userId: string): Promise<SavedSearch[]> {
    const raws = await this.savedSearchPrisma.findAllByUserId(userId);
    return raws.map((r) => SavedSearchMapper.toDomain(r)!);
  }

  async findAll(): Promise<SavedSearch[]> {
    const raws = await this.savedSearchPrisma.findAll();
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
