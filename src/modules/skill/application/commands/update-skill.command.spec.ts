import {
  UpdateSkillCommand,
  UpdateSkillHandler,
} from '@/modules/skill/application/commands/update-skill.command';
import { ISkillRepository } from '@/modules/skill/domain/repositories/skill.repository';
import { SkillNotFoundException } from '@/modules/skill/domain/exceptions/skill.exceptions';
import { Skill } from '@/modules/skill/domain/entities/skill.entity';

describe('UpdateSkillHandler', () => {
  let handler: UpdateSkillHandler;
  let skillRepository: jest.Mocked<ISkillRepository>;

  beforeEach(() => {
    skillRepository = {
      findById: jest.fn(),
      findManyByIds: jest.fn(),
      existsBySlug: jest.fn(),
      findAll: jest.fn(),
      countReferencingJobs: jest.fn(),
      save: jest.fn(),
      update: jest.fn((skill: Skill) => Promise.resolve(skill)),
      delete: jest.fn(),
    };

    handler = new UpdateSkillHandler(skillRepository);
  });

  it('throws SkillNotFoundException when the skill does not exist', async () => {
    skillRepository.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new UpdateSkillCommand('skill-1', 'Rust')),
    ).rejects.toThrow(SkillNotFoundException);
    expect(skillRepository.update).not.toHaveBeenCalled();
  });

  it('updates the name and persists it when the skill exists', async () => {
    const skill = new Skill({ id: 'skill-1', name: 'Golang', slug: 'golang' });
    skillRepository.findById.mockResolvedValue(skill);

    await handler.execute(new UpdateSkillCommand('skill-1', 'Go'));

    expect(skillRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'skill-1', name: 'Go' }),
    );
  });

  it("does not change the skill's slug, only its name", async () => {
    const skill = new Skill({ id: 'skill-1', name: 'Golang', slug: 'golang' });
    skillRepository.findById.mockResolvedValue(skill);

    await handler.execute(new UpdateSkillCommand('skill-1', 'Go'));

    expect(skillRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'golang' }),
    );
  });

  it('returns the mapped response DTO for the updated skill', async () => {
    const skill = new Skill({
      id: 'skill-1',
      name: 'Golang',
      slug: 'golang',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-02'),
    });
    skillRepository.findById.mockResolvedValue(skill);

    const result = await handler.execute(
      new UpdateSkillCommand('skill-1', 'Go'),
    );

    expect(result).toEqual(
      expect.objectContaining({ id: 'skill-1', name: 'Go', slug: 'golang' }),
    );
  });
});
