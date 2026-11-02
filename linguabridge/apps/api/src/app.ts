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
    hasSpeech: false,
    hasPronunciation: true,
    hasGlossary: true,
  },
  supportedSourceLangs: ['fr', 'en'],
  supportedTargetLangs: ['ewo-CM', 'ewo'],
  license: 'CC-BY-NC-4.0',
  provenance: 'NACALCO / SIL Cameroon financial lexicon consensus',
  attribution: 'Université de Yaoundé I & NACALCO Language Committee',
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

  // Swagger Documentation
  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'LinguaBridge API',
        description: 'Multilingual Accessibility Infrastructure Platform API — Central African Financial Inclusion',
        version: '1.0.0',
      },
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
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
