import {
  DeleteSkillCommand,
  DeleteSkillHandler,
} from '@/modules/skill/application/commands/delete-skill.command';
import { ISkillRepository } from '@/modules/skill/domain/repositories/skill.repository';
import {
  SkillNotFoundException,
  SkillInUseException,
} from '@/modules/skill/domain/exceptions/skill.exceptions';
import { Skill } from '@/modules/skill/domain/entities/skill.entity';

describe('DeleteSkillHandler', () => {
  let handler: DeleteSkillHandler;
  let skillRepository: jest.Mocked<ISkillRepository>;

  beforeEach(() => {
    skillRepository = {
      findById: jest.fn(),
      existsBySlug: jest.fn(),
      findAll: jest.fn(),
      countReferencingJobs: jest.fn().mockResolvedValue(0),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    handler = new DeleteSkillHandler(skillRepository);
  });

  it('throws SkillNotFoundException when the skill does not exist', async () => {
    skillRepository.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new DeleteSkillCommand('skill-1')),
    ).rejects.toThrow(SkillNotFoundException);
    expect(skillRepository.delete).not.toHaveBeenCalled();
  });

  it('deletes the skill when it exists and no job references it', async () => {
    skillRepository.findById.mockResolvedValue(
      new Skill({ id: 'skill-1', name: 'TypeScript', slug: 'typescript' }),
    );

    await handler.execute(new DeleteSkillCommand('skill-1'));

    expect(skillRepository.delete).toHaveBeenCalledWith('skill-1');
  });

  it('throws SkillInUseException and does not delete when jobs still tag it', async () => {
    skillRepository.findById.mockResolvedValue(
      new Skill({ id: 'skill-1', name: 'TypeScript', slug: 'typescript' }),
    );
    skillRepository.countReferencingJobs.mockResolvedValue(5);

    await expect(
      handler.execute(new DeleteSkillCommand('skill-1')),
    ).rejects.toThrow(SkillInUseException);
    expect(skillRepository.delete).not.toHaveBeenCalled();
  });
});
