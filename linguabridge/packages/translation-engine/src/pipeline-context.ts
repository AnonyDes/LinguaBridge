import type { TranslationRequest, TranslationResult, FinancialEntity } from '@linguabridge/shared-types';

export class PipelineContext {
  request: TranslationRequest;
  result: Partial<TranslationResult>;
  shouldStop: boolean = false;
  extractedEntities: FinancialEntity[] = [];
  memoryHit: boolean = false;
  selectedProvider: string = '';
  startTime: number;

  constructor(request: TranslationRequest) {
    this.request = request;
    this.startTime = Date.now();
    this.result = {
      id: request.id,
      originalText: request.sourceText,
      sourceLang: request.sourceLang,
      targetLang: request.targetLang,
      status: 'pending',
      cacheStatus: 'miss',
      warnings: [],
      speechAvailable: false,
      latencyMs: 0,
    };
  }

  finalizeResult(): TranslationResult {
    this.result.latencyMs = Date.now() - this.startTime;
    return this.result as TranslationResult;
  }
}
