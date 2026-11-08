import { JobRecommendationInfraRepository } from '@/modules/ai/infrastructure/repositories/job-recommendation.infra-repository';

describe('JobRecommendationInfraRepository', () => {
  let prisma: {
    findAnalyzedCvSkills: jest.Mock;
    findOpenJobsNotAppliedBy: jest.Mock;
    findSkillsByNameInsensitive: jest.Mock;
  };
  let repository: JobRecommendationInfraRepository;

  beforeEach(() => {
    prisma = {
      findAnalyzedCvSkills: jest.fn(),
      findOpenJobsNotAppliedBy: jest.fn(),
      findSkillsByNameInsensitive: jest.fn(),
    };
    repository = new JobRecommendationInfraRepository(prisma as any);
  });

  describe('findCandidateSkillProfile', () => {
    it('merges the skills of all analyzed CVs, normalized and de-duplicated', async () => {
      prisma.findAnalyzedCvSkills.mockResolvedValue([
        { skills: ['nestjs', 'docker'] },
        { skills: ['Docker', ' PostgreSQL '] },
      ]);

      await expect(repository.findCandidateSkillProfile('u1')).resolves.toEqual(
        {
          hasAnalyzedCv: true,
          skills: ['nestjs', 'docker', 'postgresql'],
        },
      );
      expect(prisma.findAnalyzedCvSkills).toHaveBeenCalledWith('u1');
    });

    it('reports no analyzed CV when there is none', async () => {
      prisma.findAnalyzedCvSkills.mockResolvedValue([]);

      await expect(repository.findCandidateSkillProfile('u1')).resolves.toEqual(
        {
          hasAnalyzedCv: false,
          skills: [],
        },
      );
    });

    it('distinguishes "analyzed, but no skills found" from "not analyzed"', async () => {
      prisma.findAnalyzedCvSkills.mockResolvedValue([{ skills: [] }]);

      await expect(repository.findCandidateSkillProfile('u1')).resolves.toEqual(
        {
          hasAnalyzedCv: true,
          skills: [],
        },
      );
    });
  });

  describe('findOpenJobsNotAppliedBy', () => {
    it('flattens the skill relation into plain skill names', async () => {
      prisma.findOpenJobsNotAppliedBy.mockResolvedValue([
        {
          id: 'j1',
          title: 'Backend',
          company: { id: 'c1', name: 'Acme', logoUrl: null },
          skills: [
            { skill: { name: 'NestJS' } },
            { skill: { name: 'Docker' } },
          ],
        },
      ]);

      const [job] = await repository.findOpenJobsNotAppliedBy('u1', 300);

      expect(prisma.findOpenJobsNotAppliedBy).toHaveBeenCalledWith('u1', 300);
      expect(job.skillNames).toEqual(['NestJS', 'Docker']);
      expect(job).not.toHaveProperty('skills');
      expect(job).toMatchObject({
        id: 'j1',
        title: 'Backend',
        company: { name: 'Acme' },
      });
    });
  });

  describe('findSkillDisplayNames', () => {
    it('maps each normalized skill to the catalogue spelling, first entry winning on case-only duplicates', async () => {
      prisma.findSkillsByNameInsensitive.mockResolvedValue([
        { name: 'MySQL' },
        { name: ' .NET / C# ' },
        { name: 'mysql' },
      ]);

      const names = await repository.findSkillDisplayNames([
        'mysql',
        '.net / c#',
        'automation testing',
      ]);

      expect(prisma.findSkillsByNameInsensitive).toHaveBeenCalledWith([
        'mysql',
        '.net / c#',
        'automation testing',
      ]);
      expect(Object.fromEntries(names)).toEqual({
        mysql: 'MySQL',
        '.net / c#': '.NET / C#',
      });
    });
  });
});
