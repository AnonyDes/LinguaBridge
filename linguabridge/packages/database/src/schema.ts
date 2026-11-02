import {
  pgTable, uuid, varchar, text, timestamp, integer,
  boolean, jsonb, index, uniqueIndex
} from 'drizzle-orm/pg-core';

export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  settings: jsonb('settings').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  keyHash: varchar('key_hash', { length: 64 }).notNull().unique(),
  keyPrefix: varchar('key_prefix', { length: 12 }).notNull(),
  scopes: jsonb('scopes').default(['translate:read']),
  lastUsedAt: timestamp('last_used_at'),
  expiresAt: timestamp('expires_at'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const translationMemory = pgTable('translation_memory', {
  id: uuid('id').primaryKey().defaultRandom(),
  cacheKey: varchar('cache_key', { length: 128 }).notNull().unique(),
  sourceText: text('source_text').notNull(),
  translatedText: text('translated_text').notNull(),
  sourceLang: varchar('source_lang', { length: 10 }).notNull(),
  targetLang: varchar('target_lang', { length: 10 }).notNull(),
  domain: varchar('domain', { length: 50 }),
  tenantId: uuid('tenant_id').references(() => tenants.id),
  provider: varchar('provider', { length: 50 }).notNull(),
  reviewStatus: varchar('review_status', { length: 20 }).default('pending').notNull(),
  hitCount: integer('hit_count').default(0).notNull(),
  packVersion: varchar('pack_version', { length: 30 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'),
}, (table) => ({
  cacheKeyIdx: uniqueIndex('tm_cache_key_idx').on(table.cacheKey),
  langPairIdx: index('tm_lang_pair_idx').on(table.sourceLang, table.targetLang),
}));

export const languagePacks = pgTable('language_packs', {
  id: uuid('id').primaryKey().defaultRandom(),
  packId: varchar('pack_id', { length: 50 }).notNull().unique(),
  manifest: jsonb('manifest').notNull(),
  status: varchar('status', { length: 30 }).notNull().default('not_installed'),
  filesPath: varchar('files_path', { length: 500 }),
  checksum: varchar('checksum', { length: 64 }),
  installedAt: timestamp('installed_at'),
  activatedAt: timestamp('activated_at'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const translationRequests = pgTable('translation_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id),
  sourceText: text('source_text').notNull(),
  translatedText: text('translated_text'),
  sourceLang: varchar('source_lang', { length: 10 }).notNull(),
  targetLang: varchar('target_lang', { length: 10 }).notNull(),
  domain: varchar('domain', { length: 50 }),
  provider: varchar('provider', { length: 50 }),
  status: varchar('status', { length: 30 }).notNull().default('pending'),
  cacheStatus: varchar('cache_status', { length: 20 }),
  latencyMs: integer('latency_ms'),
  warnings: jsonb('warnings').default([]),
  financialEntities: jsonb('financial_entities'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('tr_tenant_idx').on(table.tenantId),
  createdAtIdx: index('tr_created_at_idx').on(table.createdAt),
}));

export const speechJobs = pgTable('speech_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  text: text('text').notNull(),
  lang: varchar('lang', { length: 10 }).notNull(),
  engine: varchar('engine', { length: 50 }),
  status: varchar('status', { length: 20 }).default('pending').notNull(),
  audioUrl: varchar('audio_url', { length: 1000 }),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});
