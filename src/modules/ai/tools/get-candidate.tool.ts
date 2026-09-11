import { AiTool, ToolContext } from '@/modules/ai/tools/ai-tool.interface';
import { requireString } from '@/modules/ai/tools/tool-input.util';

/**
 * Returns only what recruitment matching needs (name, headline, analyzed
 * skills/experience/education/summary) — deliberately never email, phone,
 * birthDate, or gender, even though the recruiter's own existing
 * candidate-detail views may show those elsewhere. Never returns a CV file
 * key or download URL; see get-cv-analysis.tool.ts for the same rule.
 */
export function createGetCandidateTool(ctx: ToolContext): AiTool {
  return {
    definition: {
      name: 'get_candidate',
      description:
        "Retrieve one candidate's profile summary and analyzed CV skills/experience/education for closer evaluation.",
      inputSchema: {
        type: 'object',
        properties: {
          candidateId: { type: 'string' },
        },
        required: ['candidateId'],
      },
    },
    async execute(input) {
      const candidateId = requireString(input, 'candidateId');
      const candidate =
        await ctx.cvAnalysisRepository.findCandidateByUserId(candidateId);
      return candidate ?? { found: false, candidateId };
    },
  };
}
