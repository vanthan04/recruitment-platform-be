import {
  matchJobSkills,
  rankJobsBySkillMatch,
  rankValue,
} from '@/modules/ai/domain/services/skill-match';

const job = (
  id: string,
  skillNames: string[],
  createdAt = '2026-06-01T00:00:00.000Z',
) => ({
  id,
  skillNames,
  createdAt: new Date(createdAt),
});

describe('matchJobSkills', () => {
  const candidate = new Set(['nestjs', 'postgresql', 'docker']);

  it("splits the job's skills into matched and missing, in the job's own spelling", () => {
    expect(
      matchJobSkills(['NestJS', 'Kubernetes', 'PostgreSQL'], candidate),
    ).toEqual({
      matchedSkills: ['NestJS', 'PostgreSQL'],
      missingSkills: ['Kubernetes'],
      score: 2 / 3,
    });
  });

  it('compares case- and whitespace-insensitively', () => {
    expect(
      matchJobSkills(['  Docker ', 'NESTJS'], candidate).matchedSkills,
    ).toEqual(['Docker', 'NESTJS']);
  });

  it('counts a skill the job lists twice (in different spellings) only once', () => {
    expect(matchJobSkills(['NestJS', 'nestjs', 'Go'], candidate)).toEqual({
      matchedSkills: ['NestJS'],
      missingSkills: ['Go'],
      score: 0.5,
    });
  });

  it('scores 0 for a job with no skills rather than dividing by zero', () => {
    expect(matchJobSkills([], candidate)).toEqual({
      matchedSkills: [],
      missingSkills: [],
      score: 0,
    });
    expect(matchJobSkills(['  '], candidate).score).toBe(0);
  });
});

describe('rankValue (smoothed coverage used for ordering)', () => {
  const m = (matched: number, total: number) =>
    rankValue({
      matchedSkills: Array(matched).fill('x'),
      missingSkills: Array(total - matched).fill('y'),
      score: matched / total,
    });

  it('does not let a one-skill job beat a well-covered bigger one', () => {
    expect(m(1, 1)).toBeLessThan(m(3, 4)); // the whole point
    expect(m(1, 1)).toBeCloseTo(0.5);
    expect(m(3, 4)).toBeCloseTo(0.6);
  });

  it('still prefers full coverage of a real requirement set', () => {
    expect(m(4, 4)).toBeGreaterThan(m(3, 4));
    expect(m(2, 2)).toBeGreaterThan(m(1, 1));
  });

  it('keeps a broad posting where only a few skills match low', () => {
    expect(m(3, 10)).toBeLessThan(m(2, 2));
  });
});

describe('rankJobsBySkillMatch', () => {
  const skills = ['NestJS', 'PostgreSQL', 'Docker', 'TypeScript'];

  it('returns nothing when the candidate has no skills', () => {
    expect(rankJobsBySkillMatch([job('a', ['NestJS'])], [], 10)).toEqual([]);
  });

  it('drops jobs the candidate matches no skill of', () => {
    const result = rankJobsBySkillMatch(
      [job('a', ['Rust', 'Go']), job('b', ['NestJS'])],
      skills,
      10,
    );
    expect(result.map((r) => r.job.id)).toEqual(['b']);
  });

  it('orders by smoothed coverage: 4/4 > 3/4 > 1/1 > 2/6', () => {
    const result = rankJobsBySkillMatch(
      [
        job('one-of-one', ['TypeScript']),
        job('two-of-six', ['NestJS', 'Docker', 'Go', 'Rust', 'Kafka', 'Scala']),
        job('three-of-four', ['NestJS', 'PostgreSQL', 'Docker', 'Kubernetes']),
        job('four-of-four', ['NestJS', 'PostgreSQL', 'Docker', 'TypeScript']),
      ],
      skills,
      10,
    );

    expect(result.map((r) => r.job.id)).toEqual([
      'four-of-four',
      'three-of-four',
      'one-of-one',
      'two-of-six',
    ]);
  });

  it('breaks a tie in coverage by the number of skills matched, then by newest', () => {
    const result = rankJobsBySkillMatch(
      [
        // 1/1 and 2/2 smooth differently, so use equal smoothed values: 1/2 (0.33) vs 2/5 (0.33).
        job('older-1-of-2', ['NestJS', 'Go'], '2026-01-01T00:00:00.000Z'),
        job(
          '2-of-5',
          ['NestJS', 'Docker', 'Go', 'Rust', 'Kafka'],
          '2026-01-01T00:00:00.000Z',
        ),
        job('newer-1-of-2', ['Docker', 'Rust'], '2026-06-01T00:00:00.000Z'),
      ],
      skills,
      10,
    );

    expect(result.map((r) => r.job.id)).toEqual([
      '2-of-5',
      'newer-1-of-2',
      'older-1-of-2',
    ]);
  });

  it('returns at most `limit` jobs', () => {
    const jobs = Array.from({ length: 5 }, (_, i) => job(`j${i}`, ['NestJS']));
    expect(rankJobsBySkillMatch(jobs, skills, 3)).toHaveLength(3);
    expect(rankJobsBySkillMatch(jobs, skills, 0)).toEqual([]);
  });

  it('reports the plain (unsmoothed) score alongside matched and missing skills', () => {
    const [top] = rankJobsBySkillMatch(
      [job('a', ['NestJS', 'Kubernetes'])],
      skills,
      10,
    );
    expect(top).toMatchObject({
      matchedSkills: ['NestJS'],
      missingSkills: ['Kubernetes'],
      score: 0.5,
    });
  });

  it("normalizes the candidate's skills too", () => {
    const [top] = rankJobsBySkillMatch(
      [job('a', ['NestJS'])],
      ['  NESTJS  '],
      10,
    );
    expect(top.matchedSkills).toEqual(['NestJS']);
  });
});
