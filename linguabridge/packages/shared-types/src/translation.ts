export type TranslationStatus =
  | 'pending'
  | 'success'
  | 'failed'
  | 'unsafe'
  | 'unverified'
  | 'memory_hit'
  | 'fixture';

export type ContentType =
  | 'ui_label'
  | 'paragraph'
  | 'legal'
  | 'financial_amount'
  | 'financial_confirmation'
  | 'error_message'
  | 'notification';

export type TranslationDomain =
  | 'financial'
  | 'healthcare'
  | 'government'
  | 'general';

export type PrivacyPolicy = 'no_external' | 'allow_external';

export type CacheStatus = 'hit' | 'miss' | 'bypass';

export interface TranslationRequest {
  id: string;
  sourceText: string;
  sourceLang: string;
  targetLang: string;
  domain?: TranslationDomain;
  context?: string;
  contentType?: ContentType;
  providerPreference?: string;
  tenantId?: string;
  maxLatencyMs?: number;
  privacyPolicy?: PrivacyPolicy;
  glossaryVersion?: string;
  packVersion?: string;
  metadata?: Record<string, unknown>;
}

export interface TranslationResult {
  id: string;
  originalText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  provider: string;
  status: TranslationStatus;
  cacheStatus: CacheStatus;
  warnings: string[];
  latencyMs: number;
  speechAvailable: boolean;
  speechUnavailableReason?: string;
  packVersion?: string;
  glossaryVersion?: string;
  memoryId?: string;
}

export interface TranslationProvider {
  id: string;
  name: string;
  translate(request: TranslationRequest): Promise<TranslationResult>;
  translateBatch(requests: TranslationRequest[]): Promise<TranslationResult[]>;
  healthCheck(): Promise<ProviderHealth>;
  supports(sourceLang: string, targetLang: string): boolean;
}

export interface ProviderHealth {
  healthy: boolean;
  latencyMs: number;
  message?: string;
  supportedPairs?: string[];
}

export type LanguagePackStatus =
  | 'not_installed'
  | 'installed_incomplete'
  | 'internal_testing'
  | 'under_review'
  | 'approved_limited'
  | 'production_approved'
  | 'deprecated'
  | 'disabled';

export interface LanguagePackCapabilities {
  hasDictionary: boolean;
  hasParallelCorpus: boolean;
  hasSpeech: boolean;
  hasPronunciation: boolean;
  hasGlossary: boolean;
}

export interface LanguagePackManifest {
  id: string;
  name: string;
  nativeName?: string;
  iso639_3: string;
  locale: string;
  version: string;
  schemaVersion: string;
  status: LanguagePackStatus;
  capabilities: LanguagePackCapabilities;
  supportedSourceLangs: string[];
  supportedTargetLangs: string[];
  orthographicVariants?: string[];
  license: string;
  provenance: string;
  attribution?: string;
  qualityStatus: 'unverified' | 'reviewed' | 'certified';
  reviewedBy?: string;
  checksum?: string;
  installationRequirements?: string[];
  _note?: string;
}

export interface FinancialEntity {
  type:
    | 'amount'
    | 'currency'
    | 'percentage'
    | 'account_id'
    | 'transaction_id'
    | 'date'
    | 'phone'
    | 'fee'
    | 'rate';
  raw: string;
  normalized: string;
  position: { start: number; end: number };
}

export interface FinancialGuardResult {
  safe: boolean;
  violations: Array<{
    entity: FinancialEntity;
    issue: string;
    sourceValue: string;
    translatedValue?: string;
  }>;
}

export interface SpeechSynthesisResult {
  available: boolean;
  lang: string;
  audioUrl?: string;
  audioBase64?: string;
  engine?: string;
  unavailableReason?: string;
  fallbackLang?: null; // Always null — never silently fallback
}

export interface Language {
  code: string;
  name: string;
  nativeName?: string;
  iso639_3?: string;
  speechAvailable: boolean;
  packStatus: LanguagePackStatus;
  isAvailable: boolean; // Only true for production_approved packs
}

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  tenantId: string;
  scopes: string[];
  createdAt: string;
  expiresAt?: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}
