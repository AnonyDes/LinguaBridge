/**
 * OpenAPI 3.1 JSON Schemas, Error Models, and Interactive cURL Snippets for LinguaBridge API Gateway.
 */

// -------------------------------------------------------------
// Standard Error Schemas
// -------------------------------------------------------------

export const Error400Schema = {
  type: 'object',
  description: 'Invalid input parameters or schema validation failure',
  properties: {
    error: { type: 'string', example: 'Bad Request' },
    message: { type: 'string', example: 'Invalid translation request body' },
    details: {
      type: 'array',
      items: { type: 'object' },
      description: 'Detailed validation issues from schema parser',
      example: [{ field: 'sourceText', message: 'sourceText cannot be empty' }],
    },
  },
  required: ['error', 'message'],
} as const;

export const Error401Schema = {
  type: 'object',
  description: 'Missing or unauthorized API key',
  properties: {
    error: { type: 'string', example: 'Unauthorized' },
    message: {
      type: 'string',
      example: 'Invalid or missing API key. Provide a valid key via the x-api-key header.',
    },
  },
  required: ['error', 'message'],
} as const;

export const Error404Schema = {
  type: 'object',
  description: 'Target resource not found',
  properties: {
    error: { type: 'string', example: 'Not Found' },
    message: { type: 'string', example: "Language 'xyz' is not an available production language." },
  },
  required: ['error', 'message'],
} as const;

export const Error422Schema = {
  type: 'object',
  description: 'Unprocessable Entity - Semantic or domain policy violation',
  properties: {
    error: { type: 'string', example: 'Unprocessable Entity' },
    message: {
      type: 'string',
      example: 'Cameroonian language resources not yet verified by certified linguistics committee',
    },
  },
  required: ['error', 'message'],
} as const;

export const Error500Schema = {
  type: 'object',
  description: 'Unexpected server or translation pipeline failure',
  properties: {
    error: { type: 'string', example: 'Internal Server Error' },
    message: {
      type: 'string',
      example: 'Translation pipeline encountered an unexpected error',
    },
  },
  required: ['error', 'message'],
} as const;

// -------------------------------------------------------------
// Shared Domain Schemas
// -------------------------------------------------------------

export const ApiKeyHeaderSchema = {
  type: 'object',
  properties: {
    'x-api-key': {
      type: 'string',
      description: 'LinguaBridge API Key (e.g. lb_demo_key_2026)',
      example: 'lb_demo_key_2026',
    },
  },
} as const;

export const TranslateRequestSchema = {
  type: 'object',
  required: ['sourceText', 'sourceLang', 'targetLang'],
  properties: {
    id: {
      type: 'string',
      format: 'uuid',
      description: 'Optional unique identifier for the translation request',
      example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
    },
    sourceText: {
      type: 'string',
      minLength: 1,
      description: 'Source text to translate (protected by AST financial entity guards)',
      example: 'Solde disponible: 50 000 FCFA',
    },
    sourceLang: {
      type: 'string',
      minLength: 2,
      description: 'Source language ISO 639-1 code or locale tag',
      example: 'fr',
    },
    targetLang: {
      type: 'string',
      minLength: 2,
      description: 'Target language code (e.g. ewo-CM for certified Ewondo)',
      example: 'ewo-CM',
    },
    domain: {
      type: 'string',
      enum: ['financial', 'healthcare', 'government', 'general'],
      default: 'financial',
      description: 'Domain context activating specialized terminology and AST financial guards',
      example: 'financial',
    },
    context: {
      type: 'string',
      description: 'Optional context description assisting disambiguation',
      example: 'Mobile money account balance check',
    },
    contentType: {
      type: 'string',
      enum: [
        'ui_label',
        'paragraph',
        'legal',
        'financial_amount',
        'financial_confirmation',
        'error_message',
        'notification',
      ],
      description: 'Type of content being translated',
      example: 'notification',
    },
    providerPreference: {
      type: 'string',
      description: 'Specific translation provider preference (e.g. fixture, libretranslate, openrouter)',
      example: 'fixture',
    },
    tenantId: {
      type: 'string',
      description: 'Multi-tenant organization identifier',
      example: 'org_cinetpay_cm',
    },
    maxLatencyMs: {
      type: 'number',
      description: 'Maximum tolerable latency before fallback',
      example: 2500,
    },
    privacyPolicy: {
      type: 'string',
      enum: ['no_external', 'allow_external'],
      default: 'allow_external',
      description: 'Data privacy handling constraints',
      example: 'allow_external',
    },
    glossaryVersion: {
      type: 'string',
      description: 'Requested glossary version',
      example: '1.0.0',
    },
    packVersion: {
      type: 'string',
      description: 'Requested language pack version',
      example: '1.0.0',
    },
    metadata: {
      type: 'object',
      additionalProperties: true,
      description: 'Arbitrary metadata forwarded with audit trail',
      example: { clientRef: 'TX-994827' },
    },
  },
} as const;

export const TranslationResultSchema = {
  type: 'object',
  required: [
    'id',
    'originalText',
    'translatedText',
    'sourceLang',
    'targetLang',
    'provider',
    'status',
    'cacheStatus',
    'warnings',
    'latencyMs',
    'speechAvailable',
  ],
  properties: {
    id: { type: 'string', format: 'uuid', example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d' },
    originalText: { type: 'string', example: 'Solde disponible: 50 000 FCFA' },
    translatedText: { type: 'string', example: 'Móni mí ne wá é bẽng: 50 000 FCFA' },
    sourceLang: { type: 'string', example: 'fr' },
    targetLang: { type: 'string', example: 'ewo-CM' },
    provider: { type: 'string', example: 'ewondo-lexicon' },
    status: {
      type: 'string',
      enum: ['pending', 'success', 'failed', 'unsafe', 'unverified', 'memory_hit', 'fixture'],
      description: "Translation status ('unsafe' indicates financial entity drift detected)",
      example: 'success',
    },
    cacheStatus: {
      type: 'string',
      enum: ['hit', 'miss', 'bypass'],
      example: 'miss',
    },
    warnings: {
      type: 'array',
      items: { type: 'string' },
      description: 'Security and financial audit warnings',
      example: [],
    },
    latencyMs: { type: 'number', example: 42 },
    speechAvailable: { type: 'boolean', example: true },
    speechUnavailableReason: { type: 'string' },
    packVersion: { type: 'string', example: '1.0.0' },
    glossaryVersion: { type: 'string', example: '1.0.0' },
    memoryId: { type: 'string' },
    phonetic: { type: 'string', example: 'mo-ni mi ne wa e beng' },
  },
} as const;

export const BatchTranslateRequestSchema = {
  type: 'object',
  required: ['requests'],
  properties: {
    requests: {
      type: 'array',
      minItems: 1,
      maxItems: 50,
      description: 'Array of 1 to 50 translation requests',
      items: TranslateRequestSchema,
    },
  },
} as const;

export const BatchTranslateResponseSchema = {
  type: 'object',
  required: ['results'],
  properties: {
    results: {
      type: 'array',
      items: TranslationResultSchema,
      description: 'Ordered array of translation results corresponding to the input batch',
    },
  },
} as const;

export const AsyncBatchTranslateRequestSchema = {
  type: 'object',
  required: ['requests', 'webhookUrl'],
  properties: {
    requests: {
      type: 'array',
      minItems: 1,
      maxItems: 50,
      description: 'Array of 1 to 50 translation requests for asynchronous processing',
      items: TranslateRequestSchema,
    },
    webhookUrl: {
      type: 'string',
      format: 'uri',
      description: 'Destination HTTPS webhook URL for callback dispatch upon completion',
      example: 'https://fintech-gateway.example.com/webhooks/linguabridge',
    },
    webhookSecret: {
      type: 'string',
      description: 'Optional custom HMAC SHA-256 secret for signature signing',
      example: 'sec_custom_hmac_key_2026',
    },
  },
} as const;

export const AsyncBatchTranslateResponseSchema = {
  type: 'object',
  required: ['batchId', 'status', 'totalCount', 'webhookUrl', 'message'],
  properties: {
    batchId: { type: 'string', format: 'uuid', example: 'c1234567-89ab-cdef-0123-456789abcdef' },
    status: { type: 'string', enum: ['queued', 'processing'], example: 'queued' },
    totalCount: { type: 'number', example: 5 },
    webhookUrl: { type: 'string', example: 'https://fintech-gateway.example.com/webhooks/linguabridge' },
    message: { type: 'string', example: 'Asynchronous batch translation accepted and queued' },
  },
} as const;

export const LanguageItemSchema = {
  type: 'object',
  required: ['code', 'name', 'speechAvailable', 'packStatus', 'isAvailable'],
  properties: {
    code: { type: 'string', example: 'ewo-CM' },
    name: { type: 'string', example: 'Ewondo' },
    nativeName: { type: 'string', example: 'Kóbó Ewondo' },
    iso639_3: { type: 'string', example: 'ewo' },
    speechAvailable: { type: 'boolean', example: true },
    packStatus: {
      type: 'string',
      enum: [
        'not_installed',
        'installed_incomplete',
        'internal_testing',
        'under_review',
        'approved_limited',
        'production_approved',
        'deprecated',
        'disabled',
      ],
      example: 'production_approved',
    },
    isAvailable: { type: 'boolean', example: true },
  },
} as const;

export const LanguagesListResponseSchema = {
  type: 'object',
  required: ['languages', 'count'],
  properties: {
    languages: {
      type: 'array',
      items: LanguageItemSchema,
      description: 'List of production approved and verified languages',
    },
    count: { type: 'number', example: 2 },
  },
} as const;

export const PackCapabilitiesSchema = {
  type: 'object',
  required: ['hasDictionary', 'hasParallelCorpus', 'hasSpeech', 'hasPronunciation', 'hasGlossary'],
  properties: {
    hasDictionary: { type: 'boolean', example: true },
    hasParallelCorpus: { type: 'boolean', example: true },
    hasSpeech: { type: 'boolean', example: true },
    hasPronunciation: { type: 'boolean', example: true },
    hasGlossary: { type: 'boolean', example: true },
  },
} as const;

export const PackSummarySchema = {
  type: 'object',
  required: ['packId', 'code', 'name', 'iso639_3', 'locale', 'version', 'status', 'isAvailable', 'capabilities', 'qualityStatus', 'provenance'],
  properties: {
    packId: { type: 'string', example: 'ewondo' },
    code: { type: 'string', example: 'ewo-CM' },
    name: { type: 'string', example: 'Ewondo' },
    nativeName: { type: 'string', example: 'Kóbó Ewondo' },
    iso639_3: { type: 'string', example: 'ewo' },
    locale: { type: 'string', example: 'ewo-CM' },
    version: { type: 'string', example: '1.0.0' },
    status: { type: 'string', example: 'production_approved' },
    isAvailable: { type: 'boolean', example: true },
    capabilities: PackCapabilitiesSchema,
    qualityStatus: { type: 'string', enum: ['unverified', 'reviewed', 'certified'], example: 'certified' },
    provenance: { type: 'string', example: 'NACALCO / SIL Cameroon financial consensus' },
  },
} as const;

export const PacksListResponseSchema = {
  type: 'object',
  required: ['packs', 'count'],
  properties: {
    packs: {
      type: 'array',
      items: PackSummarySchema,
      description: 'Administrative view of all installed packs and quarantined templates',
    },
    count: { type: 'number', example: 6 },
  },
} as const;

export const FullPackManifestSchema = {
  type: 'object',
  required: ['id', 'name', 'iso639_3', 'locale', 'version', 'schemaVersion', 'status', 'capabilities', 'supportedSourceLangs', 'supportedTargetLangs', 'license', 'provenance', 'qualityStatus'],
  properties: {
    id: { type: 'string', example: 'ewondo' },
    name: { type: 'string', example: 'Ewondo' },
    nativeName: { type: 'string', example: 'Kóbó Ewondo' },
    iso639_3: { type: 'string', example: 'ewo' },
    locale: { type: 'string', example: 'ewo-CM' },
    version: { type: 'string', example: '1.0.0' },
    schemaVersion: { type: 'string', example: '1.0.0' },
    status: { type: 'string', example: 'production_approved' },
    capabilities: PackCapabilitiesSchema,
    supportedSourceLangs: { type: 'array', items: { type: 'string' }, example: ['fr', 'en'] },
    supportedTargetLangs: { type: 'array', items: { type: 'string' }, example: ['ewo-CM', 'ewo'] },
    license: { type: 'string', example: 'CC-BY-NC-4.0 & GPL-3.0' },
    provenance: { type: 'string', example: 'NACALCO / SIL Cameroon financial consensus & Apertium ewo-fra Lexicon' },
    attribution: { type: 'string', example: 'Université de Yaoundé I, NACALCO Language Committee & Apertium Community' },
    qualityStatus: { type: 'string', enum: ['unverified', 'reviewed', 'certified'], example: 'certified' },
  },
} as const;

export const UpdatePackStatusBodySchema = {
  type: 'object',
  required: ['status'],
  properties: {
    status: {
      type: 'string',
      enum: [
        'not_installed',
        'installed_incomplete',
        'internal_testing',
        'under_review',
        'approved_limited',
        'production_approved',
        'deprecated',
        'disabled',
      ],
      description: 'Target lifecycle status for language pack',
      example: 'under_review',
    },
  },
} as const;

export const UpdatePackStatusResponseSchema = {
  type: 'object',
  required: ['id', 'status', 'updated'],
  properties: {
    id: { type: 'string', example: 'duala' },
    status: { type: 'string', example: 'under_review' },
    updated: { type: 'boolean', example: true },
  },
} as const;

export const ProviderHealthItemSchema = {
  type: 'object',
  required: ['provider', 'name', 'healthy', 'latencyMs'],
  properties: {
    provider: { type: 'string', example: 'fixture' },
    name: { type: 'string', example: 'Fixture Provider' },
    healthy: { type: 'boolean', example: true },
    latencyMs: { type: 'number', example: 1 },
    message: { type: 'string' },
    supportedPairs: { type: 'array', items: { type: 'string' }, example: ['fr:en', 'en:fr', 'fr:ewo-CM'] },
  },
} as const;

export const HealthResponseSchema = {
  type: 'object',
  required: ['status', 'timestamp', 'uptime', 'providers'],
  properties: {
    status: { type: 'string', enum: ['ok', 'degraded'], example: 'ok' },
    timestamp: { type: 'string', format: 'date-time', example: '2026-11-04T16:00:00.000Z' },
    uptime: { type: 'number', example: 3600.42 },
    providers: {
      type: 'array',
      items: ProviderHealthItemSchema,
    },
  },
} as const;

// -------------------------------------------------------------
// Webhook Payload Schemas (OpenAPI 3.1 Components & Webhooks)
// -------------------------------------------------------------

export const BatchCompletedWebhookPayloadSchema = {
  type: 'object',
  required: ['id', 'event', 'timestamp', 'attempt', 'data'],
  properties: {
    id: { type: 'string', format: 'uuid', example: 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6' },
    event: { type: 'string', enum: ['translation.batch.completed'], example: 'translation.batch.completed' },
    timestamp: { type: 'string', format: 'date-time', example: '2026-11-04T16:05:00.000Z' },
    attempt: { type: 'number', example: 1 },
    data: {
      type: 'object',
      required: ['batchId', 'totalCount', 'successCount', 'failedCount', 'results', 'durationMs'],
      properties: {
        batchId: { type: 'string', format: 'uuid', example: 'c1234567-89ab-cdef-0123-456789abcdef' },
        totalCount: { type: 'number', example: 2 },
        successCount: { type: 'number', example: 2 },
        failedCount: { type: 'number', example: 0 },
        results: { type: 'array', items: TranslationResultSchema },
        durationMs: { type: 'number', example: 120 },
      },
    },
  },
} as const;

export const BatchFailedWebhookPayloadSchema = {
  type: 'object',
  required: ['id', 'event', 'timestamp', 'attempt', 'data'],
  properties: {
    id: { type: 'string', format: 'uuid', example: 'd92e5fbf-8efd-22e1-b876-11b1d02f7cg7' },
    event: { type: 'string', enum: ['translation.batch.failed'], example: 'translation.batch.failed' },
    timestamp: { type: 'string', format: 'date-time', example: '2026-11-04T16:05:00.000Z' },
    attempt: { type: 'number', example: 1 },
    data: {
      type: 'object',
      required: ['batchId', 'error', 'message', 'totalCount'],
      properties: {
        batchId: { type: 'string', format: 'uuid', example: 'c1234567-89ab-cdef-0123-456789abcdef' },
        error: { type: 'string', example: 'PROVIDER_TIMEOUT' },
        message: { type: 'string', example: 'Batch translation timed out waiting for provider' },
        totalCount: { type: 'number', example: 5 },
        failedRequests: { type: 'array', items: TranslateRequestSchema },
      },
    },
  },
} as const;

export const FinancialDriftWebhookPayloadSchema = {
  type: 'object',
  required: ['id', 'event', 'timestamp', 'attempt', 'data'],
  properties: {
    id: { type: 'string', format: 'uuid', example: 'ea3f60ca-9f0e-33f2-c987-22c2e13g8dh8' },
    event: { type: 'string', enum: ['audit.financial_drift_detected'], example: 'audit.financial_drift_detected' },
    timestamp: { type: 'string', format: 'date-time', example: '2026-11-04T16:05:00.000Z' },
    attempt: { type: 'number', example: 1 },
    data: {
      type: 'object',
      required: ['translationId', 'sourceText', 'translatedText', 'sourceLang', 'targetLang', 'violations', 'detectedAt'],
      properties: {
        translationId: { type: 'string', format: 'uuid', example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d' },
        sourceText: { type: 'string', example: 'Solde de 50 000 FCFA' },
        translatedText: { type: 'string', example: 'Balance of 25 000 FCFA' },
        sourceLang: { type: 'string', example: 'fr' },
        targetLang: { type: 'string', example: 'en' },
        domain: { type: 'string', example: 'financial' },
        violations: {
          type: 'array',
          items: { type: 'string' },
          example: ['FINANCIAL_ENTITY_MISMATCH: amount value "50000_FCFA" not found in translation'],
        },
        sourceFingerprint: { type: 'string', example: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' },
        translatedFingerprint: { type: 'string', example: 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb' },
        detectedAt: { type: 'string', format: 'date-time', example: '2026-11-04T16:05:00.000Z' },
        clientIp: { type: 'string', example: '192.168.1.1' },
        tenantId: { type: 'string', example: 'org_cinetpay_cm' },
      },
    },
  },
} as const;

// -------------------------------------------------------------
// Interactive cURL Snippets
// -------------------------------------------------------------

export const CURL_TRANSLATE = `curl -X POST https://api.linguabridge.org/api/v1/translate \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: lb_demo_key_2026" \\
  -d '{
    "sourceText": "Solde disponible: 50 000 FCFA",
    "sourceLang": "fr",
    "targetLang": "ewo-CM",
    "domain": "financial"
  }'`;

export const CURL_TRANSLATE_BATCH = `curl -X POST https://api.linguabridge.org/api/v1/translate/batch \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: lb_demo_key_2026" \\
  -d '{
    "requests": [
      {
        "sourceText": "Solde disponible: 50 000 FCFA",
        "sourceLang": "fr",
        "targetLang": "ewo-CM",
        "domain": "financial"
      },
      {
        "sourceText": "Transfert réussi",
        "sourceLang": "fr",
        "targetLang": "ewo-CM",
        "domain": "financial"
      }
    ]
  }'`;

export const CURL_TRANSLATE_ASYNC = `curl -X POST https://api.linguabridge.org/api/v1/translate/async \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: lb_demo_key_2026" \\
  -d '{
    "requests": [
      {
        "sourceText": "Solde disponible: 50 000 FCFA",
        "sourceLang": "fr",
        "targetLang": "ewo-CM",
        "domain": "financial"
      }
    ],
    "webhookUrl": "https://fintech-gateway.example.com/webhooks/linguabridge"
  }'`;

export const CURL_GET_LANGUAGES = `curl -X GET https://api.linguabridge.org/api/v1/languages`;

export const CURL_GET_LANGUAGE_DETAIL = `curl -X GET https://api.linguabridge.org/api/v1/languages/ewo-CM`;

export const CURL_GET_PACKS = `curl -X GET https://api.linguabridge.org/api/v1/packs`;

export const CURL_GET_PACK_DETAIL = `curl -X GET https://api.linguabridge.org/api/v1/packs/ewondo`;

export const CURL_PATCH_PACK_STATUS = `curl -X PATCH https://api.linguabridge.org/api/v1/packs/duala/status \\
  -H "Content-Type: application/json" \\
  -d '{
    "status": "under_review"
  }'`;

export const CURL_GET_HEALTH = `curl -X GET https://api.linguabridge.org/health`;
