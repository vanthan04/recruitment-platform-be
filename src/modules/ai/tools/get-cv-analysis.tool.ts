import { z } from 'zod';
import { tool } from '@langchain/core/tools';
import { ToolContext } from '@/modules/ai/tools/ai-tool.interface';

/**
 * Returns the structured analysis only — never `extractedText` (the raw CV
 * text). The analysis already distilled everything relevant; re-feeding the
 * full document into the prompt would waste tokens and needlessly widen the
 * prompt-injection surface for no benefit (see recruitment.prompt.ts).
 */
export function createGetCvAnalysisTool(ctx: ToolContext) {
  return tool(
    async (input) => {
      const analysis = await ctx.cvAnalysisRepository.findByCvId(input.cvId);
      if (!analysis || !analysis.isSearchable) {
        return JSON.stringify({ found: false, cvId: input.cvId });
      }
      return JSON.stringify({
        cvId: analysis.cvId,
        summary: analysis.summary,
        skills: analysis.skills,
        experienceYears: analysis.experienceYears,
        education: analysis.education,
      });
    },
    {
      name: 'get_cv_analysis',
      description:
        "Retrieve one CV's structured analysis (summary, skills, experience years, education) by CV id.",
      schema: z.object({
        cvId: z.string(),
      }),
    },
  );
}
