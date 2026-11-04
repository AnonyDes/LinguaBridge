import type { FinancialEntity, FinancialGuardResult } from '@linguabridge/shared-types';

export type MomoNotificationType =
  | 'received'
  | 'sent'
  | 'cash_out'
  | 'payment'
  | 'balance'
  | 'ussd_prompt'
  | 'unknown';

export interface MomoNotification {
  type: MomoNotificationType;
  amount?: string;
  currency?: string;
  sender?: string;
  recipient?: string;
  fee?: string;
  balance?: string;
  transactionId?: string;
  date?: string;
  raw: string;
  metadata?: Record<string, unknown>;
}

export interface LocalizeMomoOptions {
  strict?: boolean;
  customTemplate?: string;
}

export interface OrangeMoneyWebhookEvent {
  event: string;
  orderId: string;
  amount: string | number;
  currency: string;
  customerPhone: string;
  transactionId: string;
  fee?: string | number;
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | string;
  timestamp?: string;
  merchantId?: string;
  metadata?: Record<string, unknown>;
  rawPayload?: string | Record<string, unknown>;
}

export interface OrangeMoneyReceipt {
  header: string; // 'Kaladí nláman' in Ewondo
  title: string;
  transactionId: string;
  orderId: string;
  amount: string;
  currency: string;
  fee: string;
  customerPhone: string;
  date: string;
  status: string;
  formattedText: string;
  text?: string;
  targetLang: string;
  verified: boolean;
  safe?: boolean;
  sourceFingerprint: string;
  translatedFingerprint: string;
}

export interface OrangeMoneyReceiptOptions {
  strict?: boolean;
  header?: string;
  merchantName?: string;
  date?: string;
}

export interface AggregatorSanitizeOptions {
  targetLang?: string;
  translatableFields?: string[];
  strictZeroDrift?: boolean;
  throwOnDrift?: boolean;
}

export interface MiddlewareOptions {
  targetLang?: string | ((req: unknown) => string | undefined);
  fields?: string[];
  strict?: boolean;
  headerName?: string;
  onDriftViolation?: (violation: unknown, req: unknown) => void;
}

export interface VerificationResult {
  safe: boolean;
  sourceEntities: FinancialEntity[];
  targetEntities: FinancialEntity[];
  guardResult: FinancialGuardResult & {
    sourceFingerprint: string;
    translatedFingerprint: string;
  };
}
