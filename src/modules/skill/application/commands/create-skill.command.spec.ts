import {
  CreateSkillCommand,
  CreateSkillHandler,
} from '@/modules/skill/application/commands/create-skill.command';
import { ISkillRepository } from '@/modules/skill/domain/repositories/skill.repository';
import { Skill } from '@/modules/skill/domain/entities/skill.entity';

describe('CreateSkillHandler', () => {
  let handler: CreateSkillHandler;
  let skillRepository: jest.Mocked<ISkillRepository>;

  beforeEach(() => {
    skillRepository = {
      findById: jest.fn(),
      findManyByIds: jest.fn(),
      existsBySlug: jest.fn().mockResolvedValue(false),
      findAll: jest.fn(),
      countReferencingJobs: jest.fn(),
      save: jest.fn((skill: Skill) => Promise.resolve(skill)),
      update: jest.fn(),
      delete: jest.fn(),
    };

    handler = new CreateSkillHandler(skillRepository);
  });

  it('generates a lowercase, hyphenated slug from the name', async () => {
    await handler.execute(new CreateSkillCommand('Node.js'));

    expect(skillRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Node.js', slug: 'node-js' }),
    );
  });

  it('strips diacritics when generating a slug', async () => {
    await handler.execute(new CreateSkillCommand('Réact Native'));

    expect(skillRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'react-native' }),
    );
  });

  it('appends an incrementing numeric suffix when the base slug is already taken', async () => {
    skillRepository.existsBySlug.mockImplementation((slug: string) =>
      Promise.resolve(slug === 'typescript' || slug === 'typescript-2'),
    );

    await handler.execute(new CreateSkillCommand('TypeScript'));

    expect(skillRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'typescript-3' }),
    );
  });

  it('returns the mapped response DTO for the saved skill', async () => {
    skillRepository.save.mockResolvedValue(
      new Skill({
        id: 'skill-1',
        name: 'Go',
        slug: 'go',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      }),
    );

    const result = await handler.execute(new CreateSkillCommand('Go'));

    expect(result).toEqual(
      expect.objectContaining({ id: 'skill-1', name: 'Go', slug: 'go' }),
    );
  });
});
