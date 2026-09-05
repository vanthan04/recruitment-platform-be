import { SkillLookupAdapter } from './skill-lookup.adapter';
import { ISkillRepository } from '@/modules/skill/domain/repositories/skill.repository';
import { Skill } from '@/modules/skill/domain/entities/skill.entity';

describe('SkillLookupAdapter', () => {
  it('batches all requested ids into a single findManyByIds call', async () => {
    const skillRepository: jest.Mocked<Pick<ISkillRepository, 'findManyByIds'>> = {
      findManyByIds: jest.fn().mockResolvedValue([
        new Skill({ id: 'skill-1', name: 'TypeScript', slug: 'typescript' }),
      ]),
    };
    const adapter = new SkillLookupAdapter(skillRepository as any);

    const result = await adapter.findManyByIds(['skill-1', 'skill-1', 'skill-2']);

    expect(skillRepository.findManyByIds).toHaveBeenCalledTimes(1);
    expect(skillRepository.findManyByIds).toHaveBeenCalledWith([
      'skill-1',
      'skill-2',
    ]);
    expect(result.get('skill-1')).toEqual({
      id: 'skill-1',
      name: 'TypeScript',
      slug: 'typescript',
    });
    expect(result.has('skill-2')).toBe(false);
  });
});
