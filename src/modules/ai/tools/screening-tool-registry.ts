import { StructuredToolInterface } from '@langchain/core/tools';
import { ToolContext } from '@/modules/ai/tools/ai-tool.interface';
import { createGetJobTool } from '@/modules/ai/tools/get-job.tool';
import { createGetCandidateTool } from '@/modules/ai/tools/get-candidate.tool';
import { createGetCvAnalysisTool } from '@/modules/ai/tools/get-cv-analysis.tool';

/**
 * ScreeningAgent's tool allow-list — a deliberately smaller set than
 * matching's: exactly one job and one candidate are ever in scope for a
 * screening conversation (both bound into ToolContext, see get_job/
 * get_candidate's doc comments), so search_candidates and get_applications
 * have no place here. Reuses the same tool factories as matching — there is
 * no screening-specific tool implementation to duplicate.
 */
export class ScreeningToolRegistry {
  readonly tools: StructuredToolInterface[];

  constructor(context: ToolContext) {
    this.tools = [
      createGetJobTool(context),
      createGetCandidateTool(context),
      createGetCvAnalysisTool(context),
    ];
  }
}
