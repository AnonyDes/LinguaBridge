import { FinancialEntityExtractor } from '@linguabridge/financial-domain';
import type { PipelineStage } from '../pipeline-stage';
import type { PipelineContext } from '../pipeline-context';

export class FinancialGuardStage implements PipelineStage {
  name = 'financial-guard';
  private extractor = new FinancialEntityExtractor();

  shouldSkip(ctx: PipelineContext): boolean {
    return ctx.request.domain !== 'financial' || !ctx.result.translatedText;
  }

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    const sourceEntities = this.extractor.extract(ctx.request.sourceText);
    const translatedEntities = this.extractor.extract(ctx.result.translatedText || '');

    ctx.extractedEntities = sourceEntities;

    if (sourceEntities.length === 0) {
      return ctx; // No financial entities to guard
    }

    const guardResult = this.extractor.compare(sourceEntities, translatedEntities);

    if (!guardResult.safe) {
      ctx.result.status = 'unsafe';
      ctx.result.translatedText = ctx.request.sourceText; // Revert to original
      ctx.result.warnings = [
        ...(ctx.result.warnings || []),
        'FINANCIAL_ENTITY_MISMATCH',
        ...guardResult.violations.map((v) => v.issue),
      ];
    }

    return ctx;
  }
}
