import { AiTool, ToolContext } from '@/modules/ai/tools/ai-tool.interface';
import { requireString } from '@/modules/ai/tools/tool-input.util';

/**
 * Returns the structured analysis only — never `extractedText` (the raw CV
 * text). The analysis already distilled everything relevant; re-feeding the
 * full document into the prompt would waste tokens and needlessly widen the
 * prompt-injection surface for no benefit (see recruitment.prompt.ts).
 */
export function createGetCvAnalysisTool(ctx: ToolContext): AiTool {
  return {
    definition: {
      name: 'get_cv_analysis',
      description:
        "Retrieve one CV's structured analysis (summary, skills, experience years, education) by CV id.",
      inputSchema: {
        type: 'object',
        properties: {
          cvId: { type: 'string' },
        },
        required: ['cvId'],
      },
    },
    async execute(input) {
      const cvId = requireString(input, 'cvId');
      const analysis = await ctx.cvAnalysisRepository.findByCvId(cvId);
      if (!analysis || !analysis.isSearchable) {
        return { found: false, cvId };
      }
      return {
        cvId: analysis.cvId,
        summary: analysis.summary,
        skills: analysis.skills,
        experienceYears: analysis.experienceYears,
        education: analysis.education,
      };
    },
  };
}
