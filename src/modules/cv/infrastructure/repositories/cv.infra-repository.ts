import { Injectable } from '@nestjs/common';
import { ICvRepository } from '@/modules/cv/domain/repositories/cv.repository';
import { Cv } from '@/modules/cv/domain/entities/cv.entity';
import { CvPrismaRepository } from '@/modules/cv/infrastructure/persistence/prisma/cv-prisma.repository';
import { CvMapper } from '@/modules/cv/infrastructure/persistence/mappers/cv.mapper';

/**
 * Infrastructure implementation of ICvRepository.
 * Orchestrates Prisma data access and domain mapping.
 */
@Injectable()
export class CvInfraRepository implements ICvRepository {
  constructor(private readonly cvPrisma: CvPrismaRepository) {}

  async findById(id: string): Promise<Cv | null> {
    const raw = await this.cvPrisma.findById(id);
    return CvMapper.toDomain(raw);
  }

  async findByIdWithRelations(id: string): Promise<Cv | null> {
    const raw = await this.cvPrisma.findByIdWithRelations(id);
    return CvMapper.toDomain(raw);
  }

  async findAllByUserId(userId: string): Promise<Cv[]> {
    const raws = await this.cvPrisma.findAllByUserId(userId);
    return raws.map((r: any) => CvMapper.toDomain(r)!);
  }

  async save(cv: Cv): Promise<Cv> {
    const data = CvMapper.toPersistence(cv);

    const createData: any = {
      ...data,
      experiences: {
        create: cv.experiences.map(CvMapper.experienceToPersistence),
      },
      educations: {
        create: cv.educations.map(CvMapper.educationToPersistence),
      },
      skills: {
        create: cv.skills.map(CvMapper.skillToPersistence),
      },
    };

    const raw = await this.cvPrisma.create(createData);
    return CvMapper.toDomain(raw)!;
  }

  async update(cv: Cv): Promise<Cv> {
    // Delete existing nested records and recreate (full replace strategy)
    await Promise.all([
      this.cvPrisma.deleteExperiencesByCvId(cv.id),
      this.cvPrisma.deleteEducationsByCvId(cv.id),
      this.cvPrisma.deleteSkillsByCvId(cv.id),
    ]);

    const data = CvMapper.toPersistence(cv);
    const updateData: any = {
      ...data,
      experiences: {
        create: cv.experiences.map(CvMapper.experienceToPersistence),
      },
      educations: {
        create: cv.educations.map(CvMapper.educationToPersistence),
      },
      skills: {
        create: cv.skills.map(CvMapper.skillToPersistence),
      },
    };

    const raw = await this.cvPrisma.update(cv.id, updateData);
    return CvMapper.toDomain(raw)!;
  }

  async delete(id: string): Promise<void> {
    await this.cvPrisma.hardDelete(id);
  }

  async softDelete(id: string): Promise<void> {
    await this.cvPrisma.softDelete(id);
  }
}
