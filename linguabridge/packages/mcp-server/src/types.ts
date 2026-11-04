import type { FinancialEntity, LanguagePackManifest, LanguagePackStatus } from '@linguabridge/shared-types';

export interface TranslateToolInput {
  text: string;
  targetLang: string;
  sourceLang?: string;
  domain?: string;
}

export interface TranslateToolOutput {
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  safe: boolean;
  status: 'completed' | 'unsafe' | 'failed';
  sourceFingerprint: string;
  translatedFingerprint: string;
  entities: FinancialEntity[];
  translatedEntities: FinancialEntity[];
  violations: string[];
  phonetic?: string;
  error?: string;
}

export interface VerifyToolInput {
  sourceText: string;
  translatedText: string;
}

export interface VerifyToolOutput {
  safe: boolean;
  match: boolean;
  sourceFingerprint: string;
  translatedFingerprint: string;
  violations: string[];
  sourceEntities: FinancialEntity[];
  translatedEntities: FinancialEntity[];
}

export interface GlossaryToolInput {
  term: string;
  lang?: string;
}

export interface GlossaryTermEntry {
  key: string;
  fr: string;
  en: string;
  ewo: string;
  phonetic?: string;
  definition?: string;
  provenance?: string;
}

export interface GlossaryToolOutput {
  query: string;
  lang: string;
  matches: GlossaryTermEntry[];
  total: number;
}

export interface LanguagesToolInput {
  includeQuarantined?: boolean;
}

export interface SupportedLanguageSummary {
  code: string;
  name: string;
  nativeName: string;
  iso639_3: string;
  status: LanguagePackStatus;
  qualityStatus: string;
  isAvailable: boolean;
  speechAvailable: boolean;
  capabilities: {
    hasDictionary: boolean;
    hasParallelCorpus: boolean;
    hasSpeech: boolean;
    hasPronunciation: boolean;
    hasGlossary: boolean;
  };
}

export interface LanguagesToolOutput {
  languages: SupportedLanguageSummary[];
  total: number;
  approvedCount: number;
  quarantinedCount: number;
}

export interface McpServerConfig {
  name?: string;
  version?: string;
  packsDir?: string;
}
