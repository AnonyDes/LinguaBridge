export {
  LinguaBridgeClient,
  LinguaBridgeError,
  AuthenticationError,
  ValidationError,
  FinancialDriftError,
  verifyZeroDrift,
  type LinguaBridgeClientOptions,
  type ZeroDriftResult,
  type ZeroDriftViolation,
  type BatchTranslateItem,
} from './client';

export type {
  TranslationRequest,
  TranslationResult,
  Language,
  TranslationDomain,
  ContentType,
} from '@linguabridge/shared-types';
