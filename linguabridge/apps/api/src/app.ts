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
import { HybridCacheStore } from './cache/hybrid-cache';
import { healthRoutes } from './routes/health';
import { translateRoutes } from './routes/translate';
import { languageRoutes } from './routes/languages';
import { packRoutes } from './routes/packs';
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

// First Certified National Cameroonian Language Pack: Ewondo
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
    id: 'fulfulde',
    name: 'Fulfulde',
    nativeName: 'Fulfulde',
    iso639_3: 'fub',
    locale: 'fub-CM',
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

  // Security headers
  await fastify.register(helmet, {
    contentSecurityPolicy: false, // Allow Swagger UI
  });

  // CORS
  await fastify.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  });

  // Rate Limiting
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // Schema error handler
  fastify.setErrorHandler((error, _request, reply) => {
    if (error.validation) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: error.message || 'Validation failed for request parameters or body',
        details: error.validation,
      });
    }
    return reply.status(error.statusCode || 500).send({
      error: error.name || 'Internal Server Error',
      message: error.message || 'An unexpected server error occurred',
    });
  });

  // Automated OpenAPI 3.1 Documentation Generation
  await fastify.register(swagger, {
    openapi: {
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
    },
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
  for (const template of cameroonianTemplates) {
    await registry.loadManifest(template);
  }

  // Translation Providers setup
  const providers: TranslationProvider[] = opts.providers || [];
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

    // 3. OpenRouter Provider (auto-activated whenever OPENROUTER_API_KEY is supplied)
    if (process.env.OPENROUTER_API_KEY && process.env.ENABLE_LLM_TRANSLATION !== 'false') {
      providers.push(
        new OpenRouterProvider({
          apiKey: process.env.OPENROUTER_API_KEY,
          baseUrl: process.env.OPENROUTER_BASE_URL,
          model: process.env.OPENROUTER_MODEL || 'mistralai/mistral-7b-instruct',
        })
      );
    }
  }

  // Hybrid Cache: automatically connects to Supabase/PostgreSQL when DATABASE_URL is present,
  // with zero-friction fallback to high-speed in-memory cache.
  const cache = new HybridCacheStore();
  const pipeline = new TranslationPipeline({
    providers,
    cache,
  });

  // Register Routes
  await fastify.register(healthRoutes, { providers });
  await fastify.register(translateRoutes, { pipeline });
  await fastify.register(languageRoutes, { registry });
  await fastify.register(packRoutes, { registry });

  return fastify;
}
