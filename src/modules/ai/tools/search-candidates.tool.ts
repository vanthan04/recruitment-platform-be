import { z } from 'zod';
import { tool } from '@langchain/core/tools';
import { normalizeSkills } from '@/modules/ai/domain/entities/cv-analysis.entity';
import { ToolContext } from '@/modules/ai/tools/ai-tool.interface';

/**
 * The deterministic-filtering tool: only ever returns candidates whose CV
 * analysis is COMPLETED (see CvAnalysisStatus), via ICvAnalysisRepository —
 * never a raw Prisma query from this layer. `limit` is always clamped to
 * `ctx.maxCandidates` (AI_MAX_CANDIDATES) regardless of what the model asks
 * for — a resource bound the LLM does not control. `ctx.jobId` (never the
 * model's input) scopes the search to candidates who applied to this job —
 * this is an applicant-pool search, not a platform-wide résumé search.
 */
export function createSearchCandidatesTool(ctx: ToolContext) {
  return tool(
    async (input) => {
      const skills = normalizeSkills(input.skills ?? []);
      const rows = await ctx.cvAnalysisRepository.searchCandidatePool({
        skills,
        minExperienceYears: input.minExperienceYears ?? undefined,
        limit: ctx.maxCandidates,
        jobId: ctx.jobId,
      });
      return JSON.stringify(rows);
    },
    {
      name: 'search_candidates',
      description:
        "Search this job's applicant pool by required skills and minimum years of experience. Returns only applicants with a completed CV analysis. Use the job's own required skills (from get_job) as the primary filter.",
      schema: z.object({
        skills: z
          .array(z.string())
          .optional()
          .describe(
            'Skill names to match against, e.g. ["NestJS", "PostgreSQL"].',
          ),
        minExperienceYears: z
          .number()
          .optional()
          .describe('Minimum years of professional experience required.'),
      }),
    },
  );
}
