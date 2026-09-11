import { AiTool, ToolContext } from '@/modules/ai/tools/ai-tool.interface';
import { createGetJobTool } from '@/modules/ai/tools/get-job.tool';
import { createSearchCandidatesTool } from '@/modules/ai/tools/search-candidates.tool';
import { createGetCandidateTool } from '@/modules/ai/tools/get-candidate.tool';
import { createGetCvAnalysisTool } from '@/modules/ai/tools/get-cv-analysis.tool';
import { createGetApplicationsTool } from '@/modules/ai/tools/get-applications.tool';

/**
 * The agent's explicit tool allow-list. Only tools built here can ever be
 * executed — see RecruitmentAgent, which looks up every tool_use the model
 * returns by name in this map and rejects (UnregisteredToolException)
 * anything not present, rather than attempting to execute it.
 */
export class ToolRegistry {
  private readonly tools: Map<string, AiTool>;

  constructor(context: ToolContext) {
    this.tools = new Map(
      [
        createGetJobTool(context),
        createSearchCandidatesTool(context),
        createGetCandidateTool(context),
        createGetCvAnalysisTool(context),
        createGetApplicationsTool(context),
      ].map((tool) => [tool.definition.name, tool]),
    );
  }

  get definitions() {
    return Array.from(this.tools.values()).map((tool) => tool.definition);
  }

  get(name: string): AiTool | undefined {
    return this.tools.get(name);
  }
}
