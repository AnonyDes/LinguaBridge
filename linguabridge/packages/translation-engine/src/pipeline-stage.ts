import type { PipelineContext } from './pipeline-context';

export interface PipelineStage {
  name: string;
  shouldSkip(ctx: PipelineContext): boolean;
  execute(ctx: PipelineContext): Promise<PipelineContext>;
}
