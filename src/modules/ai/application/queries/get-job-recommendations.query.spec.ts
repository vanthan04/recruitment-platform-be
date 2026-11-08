import {
  GetJobRecommendationsHandler,
  GetJobRecommendationsQuery,
  MAX_RECOMMENDATIONS,
} from '@/modules/ai/application/queries/get-job-recommendations.query';
import {
  RECOMMENDATION_CANDIDATE_POOL,
  RecommendableJobRecord,
} from '@/modules/ai/domain/repositories/job-recommendation.repository';

const job = (
  id: string,
  skillNames: string[],
  overrides: Partial<RecommendableJobRecord> = {},
): RecommendableJobRecord => ({
  id,
  title: `Job ${id}`,
  location: 'Hà Nội',
  employmentType: 'FULL_TIME',
  workMode: 'HYBRID',
  level: 'MIDDLE',
  salaryMin: 20000000,
  salaryMax: 35000000,
  currency: 'VND',
  expiresAt: null,
  createdAt: new Date('2026-06-01T00:00:00.000Z'),
  company: { id: 'c1', name: 'Acme', logoUrl: null },
  skillNames,
  ...overrides,
});

describe('GetJobRecommendationsHandler', () => {
  let repository: {
    findCandidateSkillProfile: jest.Mock;
    findOpenJobsNotAppliedBy: jest.Mock;
    findSkillDisplayNames: jest.Mock;
  };
  let handler: GetJobRecommendationsHandler;

  beforeEach(() => {
    repository = {
      findCandidateSkillProfile: jest.fn().mockResolvedValue({
        hasAnalyzedCv: true,
        skills: ['nestjs', 'postgresql', 'docker'],
      }),
      findOpenJobsNotAppliedBy: jest.fn().mockResolvedValue([]),
      findSkillDisplayNames: jest.fn().mockResolvedValue(new Map()),
    };
    handler = new GetJobRecommendationsHandler(repository);
  });

  it("doesn't load jobs when the candidate has no analyzed CV, and says so", async () => {
    repository.findCandidateSkillProfile.mockResolvedValue({
      hasAnalyzedCv: false,
      skills: [],
    });

    const result = await handler.execute(new GetJobRecommendationsQuery('u1'));

    expect(result).toEqual({
      hasAnalyzedCv: false,
      candidateSkills: [],
      items: [],
    });
    expect(repository.findOpenJobsNotAppliedBy).not.toHaveBeenCalled();
    expect(repository.findSkillDisplayNames).not.toHaveBeenCalled();
  });

  it('returns nothing (but reports the analyzed CV) when the analysis found no skills', async () => {
    repository.findCandidateSkillProfile.mockResolvedValue({
      hasAnalyzedCv: true,
      skills: [],
    });

    const result = await handler.execute(new GetJobRecommendationsQuery('u1'));

    expect(result).toEqual({
      hasAnalyzedCv: true,
      candidateSkills: [],
      items: [],
    });
    expect(repository.findOpenJobsNotAppliedBy).not.toHaveBeenCalled();
  });

  it("scores this candidate's open, not-yet-applied jobs from the candidate pool", async () => {
    await handler.execute(new GetJobRecommendationsQuery('u1'));

    expect(repository.findOpenJobsNotAppliedBy).toHaveBeenCalledWith(
      'u1',
      RECOMMENDATION_CANDIDATE_POOL,
    );
  });

  it('returns ranked jobs with matched/missing skills and a rounded score', async () => {
    repository.findOpenJobsNotAppliedBy.mockResolvedValue([
      job('partial', ['NestJS', 'Kubernetes', 'Go']),
      job('full', ['NestJS', 'PostgreSQL', 'Docker']),
      job('none', ['Rust']),
    ]);

    const result = await handler.execute(new GetJobRecommendationsQuery('u1'));

    expect(result.hasAnalyzedCv).toBe(true);
    expect(result.candidateSkills).toEqual(['nestjs', 'postgresql', 'docker']);
    expect(result.items.map((i) => i.job.id)).toEqual(['full', 'partial']);
    expect(result.items[1]).toMatchObject({
      matchedSkills: ['NestJS'],
      missingSkills: ['Kubernetes', 'Go'],
      matchScore: 0.33,
    });
    expect(result.items[0].matchScore).toBe(1);
  });

  it("shows the candidate's skills in the catalogue's spelling, keeping unknown ones as stored", async () => {
    repository.findCandidateSkillProfile.mockResolvedValue({
      hasAnalyzedCv: true,
      skills: ['mysql', '.net / c#', 'automation testing'],
    });
    repository.findSkillDisplayNames.mockResolvedValue(
      new Map([
        ['mysql', 'MySQL'],
        ['.net / c#', '.NET / C#'],
      ]),
    );
    repository.findOpenJobsNotAppliedBy.mockResolvedValue([
      job('a', ['MySQL', 'Go']),
    ]);

    const result = await handler.execute(new GetJobRecommendationsQuery('u1'));

    expect(repository.findSkillDisplayNames).toHaveBeenCalledWith([
      'mysql',
      '.net / c#',
      'automation testing',
    ]);
    expect(result.candidateSkills).toEqual([
      'MySQL',
      '.NET / C#',
      'automation testing',
    ]);
    // Matching still runs on the normalized skills.
    expect(result.items[0].matchedSkills).toEqual(['MySQL']);
  });

  it("sends only the card's fields of a job — not its internal skill list", async () => {
    repository.findOpenJobsNotAppliedBy.mockResolvedValue([
      job('a', ['NestJS']),
    ]);

    const [item] = (await handler.execute(new GetJobRecommendationsQuery('u1')))
      .items;

    expect(item.job).toEqual({
      id: 'a',
      title: 'Job a',
      location: 'Hà Nội',
      employmentType: 'FULL_TIME',
      workMode: 'HYBRID',
      level: 'MIDDLE',
      salaryMin: 20000000,
      salaryMax: 35000000,
      currency: 'VND',
      expiresAt: null,
      createdAt: new Date('2026-06-01T00:00:00.000Z'),
      company: { id: 'c1', name: 'Acme', logoUrl: null },
    });
    expect(item.job).not.toHaveProperty('skillNames');
  });

  it(`caps the number of results at ${MAX_RECOMMENDATIONS}, and returns at least one when asked for 0`, async () => {
    repository.findOpenJobsNotAppliedBy.mockResolvedValue(
      Array.from({ length: 30 }, (_, i) => job(`j${i}`, ['NestJS'])),
    );

    expect(
      (await handler.execute(new GetJobRecommendationsQuery('u1', 100))).items,
    ).toHaveLength(MAX_RECOMMENDATIONS);
    expect(
      (await handler.execute(new GetJobRecommendationsQuery('u1', 3))).items,
    ).toHaveLength(3);
    expect(
      (await handler.execute(new GetJobRecommendationsQuery('u1', 0))).items,
    ).toHaveLength(1);
  });
});
