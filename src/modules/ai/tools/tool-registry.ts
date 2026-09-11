import { StructuredToolInterface } from '@langchain/core/tools';
import { ToolContext } from '@/modules/ai/tools/ai-tool.interface';
import { createGetJobTool } from '@/modules/ai/tools/get-job.tool';
import { createSearchCandidatesTool } from '@/modules/ai/tools/search-candidates.tool';
import { createGetCandidateTool } from '@/modules/ai/tools/get-candidate.tool';
import { createGetCvAnalysisTool } from '@/modules/ai/tools/get-cv-analysis.tool';
import { createGetApplicationsTool } from '@/modules/ai/tools/get-applications.tool';

/**
 * The agent's explicit tool allow-list, built fresh per request from an
 * already-authorized ToolContext. RecruitmentAgent binds these (plus the
 * separate, never-executed submit_matching_result tool) to the model and
 * builds its LangGraph ToolNode from exactly this list — nothing outside
 * this registry can ever be executed.
 */
export class ToolRegistry {
  readonly tools: StructuredToolInterface[];

  constructor(context: ToolContext) {
    this.tools = [
      createGetJobTool(context),
      createSearchCandidatesTool(context),
      createGetCandidateTool(context),
      createGetCvAnalysisTool(context),
      createGetApplicationsTool(context),
    ];
  }
}
