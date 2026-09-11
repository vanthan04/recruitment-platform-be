import { normalizeSkills } from '@/modules/ai/domain/entities/cv-analysis.entity';
import { AiTool, ToolContext } from '@/modules/ai/tools/ai-tool.interface';
import {
  optionalNumber,
  optionalStringArray,
} from '@/modules/ai/tools/tool-input.util';

/**
 * The deterministic-filtering tool: only ever returns candidates whose CV
 * analysis is COMPLETED (see CvAnalysisStatus), via ICvAnalysisRepository —
 * never a raw Prisma query from this layer. `limit` is always clamped to
 * `ctx.maxCandidates` (AI_MAX_CANDIDATES) regardless of what the model asks
 * for — a resource bound the LLM does not control.
 */
export function createSearchCandidatesTool(ctx: ToolContext): AiTool {
  return {
    definition: {
      name: 'search_candidates',
      description:
        "Search the candidate pool by required skills and minimum years of experience. Returns only candidates with a completed CV analysis. Use the job's own required skills (from get_job) as the primary filter.",
      inputSchema: {
        type: 'object',
        properties: {
          skills: {
            type: 'array',
            items: { type: 'string' },
            description:
              'Skill names to match against, e.g. ["NestJS", "PostgreSQL"].',
          },
          minExperienceYears: {
            type: 'number',
            description: 'Minimum years of professional experience required.',
          },
        },
      },
    },
    async execute(input) {
      const skills = normalizeSkills(optionalStringArray(input, 'skills'));
      const minExperienceYears = optionalNumber(input, 'minExperienceYears');

      return ctx.cvAnalysisRepository.searchCandidatePool({
        skills,
        minExperienceYears,
        limit: ctx.maxCandidates,
      });
    },
  };
}
