import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { LanguageRegistry } from '@linguabridge/language-registry';
import {
  TranslationPipeline,
  FixtureProvider,
  LibreTranslateProvider,
  OpenRouterProvider,
} from '@linguabridge/translation-engine';
import type { TranslationProvider } from '@linguabridge/shared-types';
import { MemoryCacheStore } from './cache/memory-cache';
import { ApiKeyService } from './services/api-key-service';
import { authorize } from './services/authorization';
import { AuditLoggerService } from './services/audit-logger-service';
import { healthRoutes } from './routes/health';
import { translateRoutes } from './routes/translate';
import { languageRoutes } from './routes/languages';
import { packRoutes } from './routes/packs';
import { keysRoutes } from './routes/keys';
import { logsRoutes } from './routes/logs';
import { dashboardRoutes } from './routes/dashboard';
import { speechRoutes } from './routes/speech.routes';
import {
  TranslateRequestSchema,
  TranslationResultSchema,
  BatchTranslateRequestSchema,
  BatchTranslateResponseSchema,
  AsyncBatchTranslateRequestSchema,
  AsyncBatchTranslateResponseSchema,
  LanguageItemSchema,
  LanguagesListResponseSchema,
  PackSummarySchema,
  PacksListResponseSchema,
  FullPackManifestSchema,
  UpdatePackStatusBodySchema,
  UpdatePackStatusResponseSchema,
  HealthResponseSchema,
  BatchCompletedWebhookPayloadSchema,
  BatchFailedWebhookPayloadSchema,
  FinancialDriftWebhookPayloadSchema,
  CreateKeyRequestSchema,
  ApiKeyItemSchema,
  ApiKeysListResponseSchema,
  RevokeKeyResponseSchema,
  AuditLogEntrySchema,
  AuditLogsResponseSchema,
  DashboardStatsResponseSchema,
  Error400Schema,
  Error401Schema,
  Error404Schema,
  Error422Schema,
  Error500Schema,
} from './schemas/openapi-schemas';

// Built-in English-French production pack
const enFrPack = {
  id: 'en-fr',
  name: 'English - French',
  iso639_3: 'fra',
  locale: 'fr',
  version: '1.0.0',
  schemaVersion: '1.0.0',
  status: 'production_approved' as const,
  capabilities: {
    hasDictionary: true,
    hasParallelCorpus: true,
    hasSpeech: true,
    hasPronunciation: true,
    hasGlossary: true,
  },
  supportedSourceLangs: ['en', 'fr'],
  supportedTargetLangs: ['fr', 'en'],
  license: 'MIT',
  provenance: 'LinguaBridge official core pack',
  qualityStatus: 'certified' as const,
};

// Sovereign Certified National Cameroonian Language Packs (5 Mastered Languages)
const ewondoPack = {
  id: 'ewondo',
  name: 'Ewondo',
  nativeName: 'Kóbó Ewondo',
  iso639_3: 'ewo',
  locale: 'ewo-CM',
  version: '1.0.0',
  schemaVersion: '1.0.0',
  status: 'production_approved' as const,
  capabilities: {
    hasDictionary: true,
    hasParallelCorpus: true,
    hasSpeech: true,
    hasPronunciation: true,
    hasGlossary: true,
  },
  supportedSourceLangs: ['fr', 'en'],
  supportedTargetLangs: ['ewo-CM', 'ewo'],
  license: 'CC-BY-NC-4.0 & GPL-3.0',
  provenance: 'NACALCO / SIL Cameroon financial consensus & Apertium ewo-fra Lexicon',
  attribution: 'Université de Yaoundé I, NACALCO Language Committee & Apertium Community',
  qualityStatus: 'certified' as const,
};

const fulfuldePack = {
  id: 'fulfulde',
  name: 'Fulfulde',
  nativeName: 'Fulfulde',
  iso639_3: 'fuv',
  locale: 'fuv-CM',
  version: '1.0.0',
  schemaVersion: '1.0.0',
  status: 'production_approved' as const,
  capabilities: {
    hasDictionary: true,
    hasParallelCorpus: true,
    hasSpeech: true,
    hasPronunciation: true,
    hasGlossary: true,
  },
  supportedSourceLangs: ['fr', 'en'],
  supportedTargetLangs: ['fuv-CM', 'fuv'],
  license: 'CC-BY-NC-4.0 & MIT',
  provenance: 'Northern Cameroon Financial Lexicon & NACALCO / SIL',
  attribution: 'Northern Linguistic Committee & LinguaBridge Sovereign Corpus',
  qualityStatus: 'certified' as const,
};

const haoussaPack = {
  id: 'haoussa',
  name: 'Haoussa',
  nativeName: 'Hausa',
  iso639_3: 'hau',
  locale: 'hau-CM',
  version: '1.0.0',
  schemaVersion: '1.0.0',
  status: 'production_approved' as const,
  capabilities: {
    hasDictionary: true,
    hasParallelCorpus: true,
    hasSpeech: true,
    hasPronunciation: true,
    hasGlossary: true,
  },
  supportedSourceLangs: ['fr', 'en'],
  supportedTargetLangs: ['hau-CM', 'hau'],
  license: 'CC-BY-NC-4.0 & MIT',
  provenance: 'Cameroon & CEMAC Trade Corridor Financial Lexicon',
  attribution: 'CEMAC Cross-border Trade Committee & LinguaBridge Sovereign Corpus',
  qualityStatus: 'certified' as const,
};

const kanuriPack = {
  id: 'kanuri',
  name: 'Kanuri',
  nativeName: 'Kanuri',
  iso639_3: 'knc',
  locale: 'knc-CM',
  version: '1.0.0',
  schemaVersion: '1.0.0',
  status: 'production_approved' as const,
  capabilities: {
    hasDictionary: true,
    hasParallelCorpus: true,
    hasSpeech: false,
    hasPronunciation: true,
    hasGlossary: true,
  },
  supportedSourceLangs: ['fr', 'en'],
  supportedTargetLangs: ['knc-CM', 'knc'],
  license: 'CC-BY-NC-4.0 & MIT',
  provenance: 'Far North & Lake Chad Commercial Banking Lexicon',
  attribution: 'Far North Community Linguistic Board & LinguaBridge Sovereign Corpus',
  qualityStatus: 'certified' as const,
};

const pidginPack = {
  id: 'pidgin',
  name: 'Cameroon Pidgin',
  nativeName: 'Cameroon Pidgin English',
  iso639_3: 'pcm',
  locale: 'pcm-CM',
  version: '1.0.0',
  schemaVersion: '1.0.0',
  status: 'production_approved' as const,
  capabilities: {
    hasDictionary: true,
    hasParallelCorpus: true,
    hasSpeech: true,
    hasPronunciation: true,
    hasGlossary: true,
  },
  supportedSourceLangs: ['fr', 'en'],
  supportedTargetLangs: ['pcm-CM', 'pcm'],
  license: 'CC-BY-NC-4.0 & MIT',
  provenance: 'CEMAC Cross-border Urban Market & Mobile Money Lexicon',
  attribution: 'National Pidgin Documentation Project & LinguaBridge Sovereign Corpus',
  qualityStatus: 'certified' as const,
};

// Unreviewed Cameroonian language templates (strictly quarantined until certified)
const cameroonianTemplates = [
  {
    id: 'duala',
    name: 'Duala',
    nativeName: 'Duala',
    iso639_3: 'dua',
    locale: 'dua-CM',
    version: '0.0.1-template',
    schemaVersion: '1.0.0',
    status: 'not_installed' as const,
    capabilities: {
      hasDictionary: false,
      hasParallelCorpus: false,
      hasSpeech: false,
      hasPronunciation: false,
      hasGlossary: false,
    },
    supportedSourceLangs: [],
    supportedTargetLangs: [],
    license: 'TBD',
    provenance: 'Configuration template only',
    qualityStatus: 'unverified' as const,
  },
  {
    id: 'basaa',
    name: 'Basaa',
    nativeName: 'Ɓàsàa',
    iso639_3: 'bas',
    locale: 'bas-CM',
    version: '0.0.1-template',
    schemaVersion: '1.0.0',
    status: 'not_installed' as const,
    capabilities: {
      hasDictionary: false,
      hasParallelCorpus: false,
      hasSpeech: false,
      hasPronunciation: false,
      hasGlossary: false,
    },
    supportedSourceLangs: [],
    supportedTargetLangs: [],
    license: 'TBD',
    provenance: 'Configuration template only',
    qualityStatus: 'unverified' as const,
  },
  {
    id: 'bulu',
    name: 'Bulu',
    nativeName: 'Bulu',
    iso639_3: 'bum',
    locale: 'bum-CM',
    version: '0.0.1-template',
    schemaVersion: '1.0.0',
    status: 'not_installed' as const,
    capabilities: {
      hasDictionary: false,
      hasParallelCorpus: false,
      hasSpeech: false,
      hasPronunciation: false,
      hasGlossary: false,
    },
    supportedSourceLangs: [],
    supportedTargetLangs: [],
    license: 'TBD',
    provenance: 'Configuration template only',
    qualityStatus: 'unverified' as const,
  },
];

export interface AppOptions {
  enableLogging?: boolean;
  providers?: TranslationProvider[];
  registry?: LanguageRegistry;
  apiKeyService?: ApiKeyService;
  auditLogger?: AuditLoggerService;
  webhookDestinations?: readonly string[];
}

export async function buildApp(opts: AppOptions = {}): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: opts.enableLogging ?? false,
    ajv: {
      customOptions: {
        strict: false,
      },
    },
  });

  const apiKeyService = opts.apiKeyService || new ApiKeyService();
  const auditLogger = opts.auditLogger || new AuditLoggerService();

  // Security headers
  await fastify.register(helmet, {
    contentSecurityPolicy: false, // Allow Swagger UI
  });

  // CORS
  await fastify.register(cors, {
    origin: process.env.NODE_ENV === 'production'
      ? (process.env.CORS_ORIGINS ?? '').split(',').map((origin) => origin.trim()).filter(Boolean)
      : true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  });

  // Rate Limiting
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // Schema error handler
  fastify.setErrorHandler<import('fastify').FastifyError>((error, _request, reply) => {
    if (error.validation) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: error.message || 'Validation failed for request parameters or body',
        details: error.validation,
      });
    }
    return reply.status(error.statusCode || 500).send({
      error: error.name || 'Internal Server Error',
      message: (error.statusCode ?? 500) >= 500 ? 'An unexpected server error occurred' : error.message,
    });
  });

  // Audit Logging hooks
  fastify.addHook('onRequest', async (request) => {
    (request.raw as any)._startTime = Date.now();
  });

  fastify.addHook('onResponse', async (request, reply) => {
    const startTime = (request.raw as any)._startTime || Date.now();
    const latencyMs = Math.max(1, Date.now() - startTime);
    const auditMeta = (request as any).auditMetadata || {};
    const keyInfo = request.apiKey;

    auditLogger.log({
      apiKey: keyInfo?.prefix,
      keyId: keyInfo?.id,
      method: request.method,
      route: request.url.split('?')[0],
      statusCode: reply.statusCode,
      latencyMs,
      sourceLang: auditMeta.sourceLang,
      targetLang: auditMeta.targetLang,
      protectedEntities: auditMeta.protectedEntities,
      driftDetected: !!auditMeta.driftDetected,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    });
  });

  // Automated OpenAPI 3.1 Documentation Generation
  const openapi = {
      openapi: '3.1.0',
      info: {
        title: 'LinguaBridge API Gateway',
        description:
          'Universal Multilingual Accessibility Infrastructure Platform API — Sovereign African Language Translations with Cryptographic AST Zero-Drift Financial Protection.\n\n### Authentication\nProvide a valid API key in the `x-api-key` header (e.g. `lb_demo_key_2026`).\n\n### Interactive Documentation\nExplore request and response schemas, error examples, and live cURL snippets directly below.',
        version: '1.0.0',
        contact: {
          name: 'LinguaBridge Core Infrastructure Team',
          url: 'https://linguabridge.org',
          email: 'api@linguabridge.org',
        },
        license: {
          name: 'Apache-2.0 / MIT Dual License',
          url: 'https://linguabridge.org/license',
        },
      },
      servers: [
        {
          url: 'http://localhost:3001',
          description: 'Local development server',
        },
        {
          url: 'https://api.linguabridge.org',
          description: 'Production API Gateway',
        },
      ],
      components: {
        securitySchemes: {
          ApiKeyAuth: {
            type: 'apiKey',
            name: 'x-api-key',
            in: 'header',
            description:
              'LinguaBridge API Key for authentication and tenant isolation (e.g., `lb_demo_key_2026`).',
          },
        },
        schemas: {
          TranslateRequest: TranslateRequestSchema,
          TranslationResult: TranslationResultSchema,
          BatchTranslateRequest: BatchTranslateRequestSchema,
          BatchTranslateResponse: BatchTranslateResponseSchema,
          AsyncBatchTranslateRequest: AsyncBatchTranslateRequestSchema,
          AsyncBatchTranslateResponse: AsyncBatchTranslateResponseSchema,
          LanguageItem: LanguageItemSchema,
          LanguagesListResponse: LanguagesListResponseSchema,
          PackSummary: PackSummarySchema,
          PacksListResponse: PacksListResponseSchema,
          FullPackManifest: FullPackManifestSchema,
          UpdatePackStatusBody: UpdatePackStatusBodySchema,
          UpdatePackStatusResponse: UpdatePackStatusResponseSchema,
          HealthResponse: HealthResponseSchema,
          BatchCompletedWebhookPayload: BatchCompletedWebhookPayloadSchema,
          BatchFailedWebhookPayload: BatchFailedWebhookPayloadSchema,
          FinancialDriftWebhookPayload: FinancialDriftWebhookPayloadSchema,
          CreateKeyRequest: CreateKeyRequestSchema,
          ApiKeyItem: ApiKeyItemSchema,
          ApiKeysListResponse: ApiKeysListResponseSchema,
          RevokeKeyResponse: RevokeKeyResponseSchema,
          AuditLogEntry: AuditLogEntrySchema,
          AuditLogsResponse: AuditLogsResponseSchema,
          DashboardStatsResponse: DashboardStatsResponseSchema,
          Error400: Error400Schema,
          Error401: Error401Schema,
          Error404: Error404Schema,
          Error422: Error422Schema,
          Error500: Error500Schema,
        },
      },
      security: [{ ApiKeyAuth: [] }],
      tags: [
        {
          name: 'Translation',
          description:
            'Financial AST-guarded sovereign language translation and synchronous/asynchronous batch processing',
        },
        {
          name: 'Languages',
          description: 'Certified national languages catalog and discovery (quarantined templates isolated)',
        },
        {
          name: 'Packs',
          description: 'Administrative language pack management, capability matrix, and lifecycle transitions',
        },
        {
          name: 'API Keys',
          description: 'API key lifecycle management (provisioning, protection, instant revocation)',
        },
        {
          name: 'Audit Logs',
          description: 'Developer audit logs, telemetry, and financial drift traceability',
        },
        {
          name: 'Dashboard',
          description: 'Developer control dashboard and real-time operational statistics',
        },
        {
          name: 'System',
          description: 'Operational readiness, uptime, and translation provider telemetry',
        },
      ],
      webhooks: {
        'translation.batch.completed': {
          post: {
            summary: 'Asynchronous batch translation completed',
            description:
              'Dispatched to destination webhookUrl when an asynchronous batch translation completes. Payload includes array of TranslationResult objects with cryptographic AST verification fingerprints and is secured with HMAC SHA-256 in X-LinguaBridge-Signature.',
            requestBody: {
              required: true,
              description: 'Completed batch event payload',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/BatchCompletedWebhookPayload',
                  },
                },
              },
            },
            responses: {
              '200': {
                description: 'Webhook delivery acknowledged by receiver',
              },
            },
          },
        },
        'translation.batch.failed': {
          post: {
            summary: 'Asynchronous batch translation failed',
            description:
              'Dispatched when an asynchronous batch translation encounters a failure. Secured with HMAC SHA-256 in X-LinguaBridge-Signature.',
            requestBody: {
              required: true,
              description: 'Batch failure event payload',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/BatchFailedWebhookPayload',
                  },
                },
              },
            },
            responses: {
              '200': {
                description: 'Webhook failure event acknowledged',
              },
            },
          },
        },
        'audit.financial_drift_detected': {
          post: {
            summary: 'Financial entity drift / tampering detected',
            description:
              'Real-time security alert dispatched when the AST Financial Guard detects an entity mismatch (monetary amount, currency, phone number, account ID) between source and translated text. Secured with HMAC SHA-256 in X-LinguaBridge-Signature.',
            requestBody: {
              required: true,
              description: 'Financial drift alert payload',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/FinancialDriftWebhookPayload',
                  },
                },
              },
            },
            responses: {
              '200': {
                description: 'Security alert acknowledged by fintech monitoring system',
              },
            },
          },
        },
      },
  } as const;
  await fastify.register(swagger, {
    // The shared JSON schema constants use readonly arrays. Swagger receives a mutable copy.
    openapi: structuredClone(openapi) as unknown as import('@fastify/swagger').FastifyDynamicSwaggerOptions['openapi'],
  });

  // Swagger UI Interactive Documentation Gateway
  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
    staticCSP: false,
  });

  // Language Registry setup
  const registry = opts.registry || new LanguageRegistry();
  await registry.loadManifest(enFrPack);
  await registry.loadManifest(ewondoPack);
  await registry.loadManifest(fulfuldePack);
  await registry.loadManifest(haoussaPack);
  await registry.loadManifest(kanuriPack);
  await registry.loadManifest(pidginPack);
  for (const template of cameroonianTemplates) {
    await registry.loadManifest(template);
  }

  // Translation Providers setup
  const providers: TranslationProvider[] = opts.providers?.slice() || [];
  if (providers.length === 0) {
    // 1. Fixture & National Lexicon Provider (always available)
    providers.push(new FixtureProvider());

    // 2. LibreTranslate Provider (if URL configured)
    const libreUrl = process.env.LIBRETRANSLATE_URL || 'http://localhost:5000';
    providers.push(
      new LibreTranslateProvider({
        baseUrl: libreUrl,
        apiKey: process.env.LIBRETRANSLATE_API_KEY,
      })
    );

    // 3. OpenRouter is an explicitly enabled external provider.
    if (process.env.OPENROUTER_API_KEY && process.env.ENABLE_LLM_TRANSLATION === 'true') {
      providers.push(
        new OpenRouterProvider({
          apiKey: process.env.OPENROUTER_API_KEY,
          baseUrl: process.env.OPENROUTER_BASE_URL,
          model: process.env.OPENROUTER_MODEL || 'mistralai/mistral-7b-instruct',
          fallbackModels: (process.env.OPENROUTER_FALLBACK_MODELS || '').split(',').filter(Boolean),
        })
      );
    }
  }

  // Request-derived translations stay transient and never enter reviewed translation memory.
  const cache = new MemoryCacheStore();
  const pipeline = new TranslationPipeline({
    providers,
    cache,
  });

  // Register Routes
  await fastify.register(healthRoutes, { providers });
  await fastify.register(translateRoutes, {
    pipeline, apiKeyService, webhookDestinations: opts.webhookDestinations,
    canTranslateTo: (target) => registry.canTranslateTo(target),
  });
  await fastify.register(languageRoutes, { registry });
  await fastify.register(async (admin) => {
    admin.addHook('onRequest', authorize(apiKeyService, 'admin'));
    await admin.register(packRoutes, { registry });
    await admin.register(keysRoutes, { apiKeyService });
    await admin.register(logsRoutes, { auditLogger });
    await admin.register(dashboardRoutes, { auditLogger, apiKeyService });
  });
  await fastify.register(async (speech) => {
    speech.addHook('onRequest', authorize(apiKeyService, 'speech:write', () => process.env.NODE_ENV !== 'production'));
    await speech.register(speechRoutes);
  });

  return fastify;
}
