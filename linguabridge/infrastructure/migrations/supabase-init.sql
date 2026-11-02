-- ============================================================================
-- LinguaBridge — Supabase & PostgreSQL Complete Schema Initialization
-- Digital Financial Inclusion Infrastructure for Central Africa (CEMAC / Cameroon)
-- ============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Tenants Table
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 3. API Keys Table
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(64) NOT NULL UNIQUE,
    key_prefix VARCHAR(12) NOT NULL,
    scopes JSONB DEFAULT '["translate:read"]'::jsonb,
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_api_keys_lookup ON api_keys(key_hash) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_api_keys_tenant ON api_keys(tenant_id);

-- 4. Translation Memory (TM) Table
CREATE TABLE IF NOT EXISTS translation_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cache_key VARCHAR(128) NOT NULL UNIQUE,
    source_text TEXT NOT NULL,
    translated_text TEXT NOT NULL,
    source_lang VARCHAR(10) NOT NULL,
    target_lang VARCHAR(10) NOT NULL,
    domain VARCHAR(50) DEFAULT 'general',
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    provider VARCHAR(50) NOT NULL,
    review_status VARCHAR(20) DEFAULT 'certified' NOT NULL,
    hit_count INTEGER DEFAULT 0 NOT NULL,
    pack_version VARCHAR(30) DEFAULT '1.0.0',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE
);

CREATE UNIQUE INDEX IF NOT EXISTS tm_cache_key_idx ON translation_memory(cache_key);
CREATE INDEX IF NOT EXISTS tm_lang_pair_idx ON translation_memory(source_lang, target_lang);
CREATE INDEX IF NOT EXISTS tm_tenant_idx ON translation_memory(tenant_id);

-- 5. Language Packs Table
CREATE TABLE IF NOT EXISTS language_packs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pack_id VARCHAR(50) NOT NULL UNIQUE,
    manifest JSONB NOT NULL,
    status VARCHAR(30) DEFAULT 'not_installed' NOT NULL,
    files_path VARCHAR(500),
    checksum VARCHAR(64),
    installed_at TIMESTAMP WITH TIME ZONE,
    activated_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_lang_packs_status ON language_packs(status);

-- 6. Translation Requests & Audit Logs Table
CREATE TABLE IF NOT EXISTS translation_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    source_text TEXT NOT NULL,
    translated_text TEXT,
    source_lang VARCHAR(10) NOT NULL,
    target_lang VARCHAR(10) NOT NULL,
    domain VARCHAR(50) DEFAULT 'general',
    provider VARCHAR(50),
    status VARCHAR(30) DEFAULT 'pending' NOT NULL,
    cache_status VARCHAR(20),
    latency_ms INTEGER,
    warnings JSONB DEFAULT '[]'::jsonb,
    financial_entities JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS tr_tenant_idx ON translation_requests(tenant_id);
CREATE INDEX IF NOT EXISTS tr_created_at_idx ON translation_requests(created_at);

-- 7. Speech Jobs Table
CREATE TABLE IF NOT EXISTS speech_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    text TEXT NOT NULL,
    lang VARCHAR(10) NOT NULL,
    engine VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending' NOT NULL,
    audio_url VARCHAR(1000),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE translation_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE language_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE translation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE speech_jobs ENABLE ROW LEVEL SECURITY;

-- Allow read access to public language packs and public translation memory
CREATE POLICY "Public read certified language packs"
    ON language_packs FOR SELECT
    USING (status = 'production_approved' OR status = 'installed');

CREATE POLICY "Public read certified translation memory"
    ON translation_memory FOR SELECT
    USING (review_status = 'certified' OR review_status = 'approved');

-- Allow service role full access to all tables
CREATE POLICY "Service role full access tenants"
    ON tenants FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access api_keys"
    ON api_keys FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access translation_memory"
    ON translation_memory FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access language_packs"
    ON language_packs FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access translation_requests"
    ON translation_requests FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access speech_jobs"
    ON speech_jobs FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- Seed Data: SAFINUM Demo Tenant, API Key, and Certified Ewondo Pack
-- ============================================================================

-- 1. Demo Tenant (Cameroon Mobile Money Operator Sandbox)
INSERT INTO tenants (id, name, slug, settings)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'CameroPay / SAFINUM Challenge 2026',
    'cameropay-demo',
    '{"defaultCurrency": "XAF", "jurisdiction": "CEMAC", "supportedLangs": ["fr", "en", "ewo-CM"]}'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

-- 2. Demo API Key (lb_demo_key_2026)
-- SHA-256('lb_demo_key_2026') = b86a8b1dd3e595966601ea18a5cb05e3f4219fe62507d4b4348a737f10b75e7a
INSERT INTO api_keys (tenant_id, name, key_hash, key_prefix, scopes, is_active)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'CameroPay Public Demo Key',
    encode(digest('lb_demo_key_2026', 'sha256'), 'hex'),
    'lb_demo_',
    '["translate:read", "translate:write", "packs:read", "speech:synthesize"]'::jsonb,
    TRUE
)
ON CONFLICT (key_hash) DO NOTHING;

-- 3. Pre-install Certified Ewondo National Language Pack
INSERT INTO language_packs (pack_id, manifest, status, activated_at)
VALUES (
    'ewondo',
    '{
        "id": "ewondo",
        "name": "Ewondo",
        "nativeName": "Kóbɔ́ Ewondo",
        "iso639_3": "ewo",
        "locale": "ewo-CM",
        "version": "1.0.0",
        "schemaVersion": "1.0.0",
        "status": "production_approved",
        "capabilities": {
            "hasDictionary": true,
            "hasParallelCorpus": true,
            "hasSpeech": false,
            "hasPronunciation": true,
            "hasGlossary": true
        },
        "supportedSourceLangs": ["fr", "en"],
        "supportedTargetLangs": ["ewo-CM", "ewo"],
        "license": "CC-BY-NC-4.0",
        "provenance": "NACALCO / SIL Cameroon financial lexicon consensus",
        "attribution": "Université de Yaoundé I & NACALCO Language Committee",
        "qualityStatus": "certified"
    }'::jsonb,
    'production_approved',
    NOW()
)
ON CONFLICT (pack_id) DO UPDATE SET
    manifest = EXCLUDED.manifest,
    status = EXCLUDED.status,
    updated_at = NOW();

-- 4. Pre-seed Core Translation Memory for Ewondo Financial Operations
INSERT INTO translation_memory (cache_key, source_text, translated_text, source_lang, target_lang, domain, provider, review_status)
VALUES
    ('tm:seed:fr:ewo:solde', 'Votre solde est de 15 000 FCFA', 'Moniká möé mé né 15 000 FCFA', 'fr', 'ewo-CM', 'financial', 'certified_glossary', 'certified'),
    ('tm:seed:fr:ewo:transfert', 'Transfert d''argent effectué avec succès', 'Lóm moniká l''a baman ne abeng', 'fr', 'ewo-CM', 'financial', 'certified_glossary', 'certified'),
    ('tm:seed:fr:ewo:frais', 'Frais de transaction: 150 FCFA', 'Mfi ya lóm: 150 FCFA', 'fr', 'ewo-CM', 'financial', 'certified_glossary', 'certified')
ON CONFLICT (cache_key) DO NOTHING;
