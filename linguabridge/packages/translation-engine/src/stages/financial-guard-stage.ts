import { FinancialEntityExtractor } from '@linguabridge/financial-domain';
import type { PipelineStage } from '../pipeline-stage';
import type { PipelineContext } from '../pipeline-context';

export class FinancialGuardStage implements PipelineStage {
  name = 'financial-guard';
  private extractor = new FinancialEntityExtractor();

  shouldSkip(ctx: PipelineContext): boolean {
    const { domain, contentType } = ctx.request;
    return (domain !== 'financial' && contentType !== 'financial_confirmation' && contentType !== 'financial_amount') ||
      !ctx.result.translatedText;
  }

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    const sourceEntities = this.extractor.extract(ctx.request.sourceText);
    const translatedEntities = this.extractor.extract(ctx.result.translatedText || '');

    ctx.extractedEntities = sourceEntities;

    const guardResult = this.extractor.compare(sourceEntities, translatedEntities);

    const orderChanged = guardResult.safe && sourceEntities.some((entity, index) =>
      entity.type !== translatedEntities[index]?.type || entity.normalized !== translatedEntities[index]?.normalized);
    if (!guardResult.safe || orderChanged) {
      ctx.result.status = 'unsafe';
      ctx.result.translatedText = ctx.request.sourceText; // Revert to original
      ctx.result.warnings = [
        ...(ctx.result.warnings || []),
        'FINANCIAL_ENTITY_MISMATCH',
        ...(orderChanged ? ['FINANCIAL_ENTITY_ORDER_CHANGED'] : []),
        ...guardResult.violations.map((v) => v.issue.split(':', 1)[0]),
      ];
    }

    return ctx;
  }
}
