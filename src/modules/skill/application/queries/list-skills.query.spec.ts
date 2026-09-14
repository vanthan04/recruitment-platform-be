import { ListSkillsHandler } from '@/modules/skill/application/queries/list-skills.query';
import { ISkillRepository } from '@/modules/skill/domain/repositories/skill.repository';
import { Skill } from '@/modules/skill/domain/entities/skill.entity';

describe('ListSkillsHandler', () => {
  let handler: ListSkillsHandler;
  let skillRepository: jest.Mocked<ISkillRepository>;

  beforeEach(() => {
    skillRepository = {
      findById: jest.fn(),
      findManyByIds: jest.fn(),
      existsBySlug: jest.fn(),
      findAll: jest.fn(),
      countReferencingJobs: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    handler = new ListSkillsHandler(skillRepository);
  });

  it('returns every skill mapped to a response DTO', async () => {
    skillRepository.findAll.mockResolvedValue([
      new Skill({ id: 'skill-1', name: 'NestJS', slug: 'nestjs' }),
      new Skill({ id: 'skill-2', name: 'PostgreSQL', slug: 'postgresql' }),
    ]);

    const result = await handler.execute();

    expect(result).toEqual([
      expect.objectContaining({
        id: 'skill-1',
        name: 'NestJS',
        slug: 'nestjs',
      }),
      expect.objectContaining({
        id: 'skill-2',
        name: 'PostgreSQL',
        slug: 'postgresql',
      }),
    ]);
  });

  it('returns an empty array when no skills exist', async () => {
    skillRepository.findAll.mockResolvedValue([]);

    const result = await handler.execute();

    expect(result).toEqual([]);
  });
});
