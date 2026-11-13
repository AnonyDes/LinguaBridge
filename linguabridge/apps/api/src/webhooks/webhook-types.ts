import type { TranslationResult, TranslationRequest } from '@linguabridge/shared-types';

export type WebhookEventType =
  | 'translation.batch.completed'
  | 'translation.batch.failed'
  | 'audit.financial_drift_detected';

export interface WebhookPayload<T = unknown> {
  id: string;
  event: WebhookEventType;
  timestamp: string;
  attempt: number;
  data: T;
}

export interface BatchCompletedWebhookData {
  batchId: string;
  totalCount: number;
  successCount: number;
  failedCount: number;
  results: TranslationResult[];
  durationMs: number;
}

export interface BatchFailedWebhookData {
  batchId: string;
  error: string;
  message: string;
  totalCount: number;
  failedRequests?: TranslationRequest[];
}

export interface FinancialDriftWebhookData {
  translationId: string;
  sourceText?: string;
  translatedText?: string;
  sourceLang: string;
  targetLang: string;
  domain?: string;
  violations: string[];
  sourceFingerprint?: string;
  translatedFingerprint?: string;
  detectedAt: string;
  clientIp?: string;
  tenantId?: string;
}

export interface WebhookDispatchResult {
  success: boolean;
  statusCode?: number;
  attempts: number;
  error?: string;
  payload: WebhookPayload<unknown>;
}

export interface WebhookDispatchOptions {
  url: string;
  event: WebhookEventType;
  data: unknown;
  secret?: string;
  maxRetries?: number;
  initialDelayMs?: number;
  timeoutMs?: number;
}
