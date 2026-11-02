# Architecture Overview

## 1. System Mission & Context

LinguaBridge is a high-reliability, low-latency multilingual accessibility infrastructure platform designed to make digital financial services in Cameroon accessible across indigenous and official languages.

```
+-----------------------------------------------------------------------------------+
|                                Client Applications                                |
|  +--------------------+   +---------------------+   +--------------------------+  |
|  | CameroPay Fintech  |   | Third-Party Web App |   | Chrome Manifest V3 Ext.  |  |
|  | (Next.js 14 App)   |   | (Embedded Widget)   |   | (Shadow DOM Content)     |  |
|  +---------+----------+   +----------+----------+   +------------+-------------+  |
|            |                         |                           |                |
|            +-------------------------+---------------------------+                |
|                                      |                                            |
|                                      v                                            |
|                       [@linguabridge/sdk-js / sdk-react]                          |
+--------------------------------------+--------------------------------------------+
                                       | HTTP / REST (v1)
                                       v
+-----------------------------------------------------------------------------------+
|                         API Gateway (apps/api — Fastify)                          |
|  - Rate Limiting (100 req/min)   - Helmet & CORS    - Structured Pino Telemetry   |
|  - JWT Tenant Isolation          - OpenAPI / Swagger UI Documentation            |
+--------------------------------------+--------------------------------------------+
                                       |
                                       v
+-----------------------------------------------------------------------------------+
|               Translation Engine Pipeline (@linguabridge/translation-engine)      |
|                                                                                   |
|  [Step 1] In-Memory Translation Memory Cache (L1 Cache — Sub-ms Hit Rate)         |
|             | (Cache Miss)                                                        |
|             v                                                                     |
|  [Step 2] Financial AST Extractor (@linguabridge/financial-domain)                 |
|             Extracts amounts, FCFA currencies, account IDs, phone numbers         |
|             |                                                                     |
|             v                                                                     |
|  [Step 3] Provider Routing (Local Fixture / NLLB-200 / DeepL)                     |
|             |                                                                     |
|             v                                                                     |
|  [Step 4] Financial Corroboration Guard (@linguabridge/financial-domain)          |
|             Verifies translated text preserves all extracted entities (0 Drift)   |
|             |                                                                     |
|             v                                                                     |
|  [Step 5] Store in TM Cache & Return Audited Result                               |
+-----------------------------------------------------------------------------------+
        |                                                           |
        v                                                           v
+-----------------------------------+   +-------------------------------------------+
| Language Registry & Governance    |   | Speech Engine (@linguabridge/speech)      |
| (@linguabridge/language-registry) |   |                                           |
| - Production Approved (en, fr)    |   | - Degrade-First Audio Orchestration       |
| - Cameroon Packs Isolated (ewo,   |   | - Explicit refusal for low-resource       |
|   dua, bas, fuv, bum: Quarantine) |   |   languages without certified acoustics   |
+-----------------------------------+   +-------------------------------------------+
```

---

## 2. Monorepo Package Topology

The repository is managed via **Turborepo** and **pnpm workspaces**:

```
linguabridge/
├── apps/
│   ├── api/                 # Fastify REST API gateway & swagger docs
│   ├── web/                 # Next.js 14 web app, documentation, & CameroPay demo
│   └── extension/           # Chrome Manifest V3 extension with Shadow DOM widget
├── packages/
│   ├── shared-types/        # Canonical TypeScript types & schemas
│   ├── financial-domain/    # AST FinancialEntityExtractor & FinancialGuard
│   ├── language-registry/   # Language pack manifest validation & status machine
│   ├── translation-engine/  # Pipeline orchestrator, TM cache, provider routing
│   ├── speech-engine/       # Degrade-first speech synthesis orchestrator
│   ├── database/            # Drizzle ORM schema, migrations, & SQLite repository
│   ├── sdk-js/              # Vanilla TypeScript client SDK for any JS environment
│   ├── sdk-react/           # React hooks (useTranslate, useLanguages) & <Translate>
│   └── widget/              # Standalone embeddable script with Shadow DOM
├── language-packs/          # Isolated Cameroonian language templates
│   ├── ewondo/              # ewo-CM (ISO 639-3: ewo)
│   ├── duala/               # dua-CM (ISO 639-3: dua)
│   ├── basaa/               # bas-CM (ISO 639-3: bas)
│   ├── fulfulde/            # fuv-CM (ISO 639-3: fuv)
│   └── bulu/                # bum-CM (ISO 639-3: bum)
└── docs/                    # Research, compliance, and Architecture Decision Records
```

---

## 3. Core Architectural Guarantees

### 3.1 Zero-Drift Financial Guard
In financial operations, probabilistic translation models cannot be granted unchecked authority over numbers. A translation that alters `50 000 FCFA` to `5 000 FCFA` or converts an Orange Money phone number from `+237 699123456` to `+237 679123456` produces disastrous financial losses.

The **Financial Guard** operates deterministically:
1. Prior to translation, an Abstract Syntax Tree (AST) pass extracts all financial amounts, currencies, account IDs, and phone numbers.
2. Following translation, a verification pass inspects the translated output. If any numerical value has shifted or gone missing, the guard flags the transaction as `unsafe` or restores the verified source entity.

### 3.2 Quarantine & Isolation of Low-Resource Cameroon Packs
Cameroon national languages are low-resource languages with complex tonal systems and limited standardized corpus assets. LinguaBridge enforces a strict isolation policy:
- Unreviewed packs (Ewondo, Duala, Basaa, Fulfulde, Bulu) are placed in `not_installed` or `under_review` status.
- The public language discovery endpoint (`GET /v1/languages`) filters out all non-approved packs, returning HTTP 404 if a caller attempts to request them directly.
- The administrative route (`GET /v1/packs`) exposes them for linguistic auditing, with explicit status flags preventing accidental production release until signed off by qualified linguists.

### 3.3 Degrade-First Speech Orchestration
Text-to-speech models for Cameroonian languages lack production acoustic models. Using English or French voices to synthesize Ewondo or Duala words results in severe phonological distortion and cultural harm. 

LinguaBridge's speech orchestrator refuses cross-lingual substitution, returning an explicit degradation notice (`available: false`, `fallbackLang: null`) rather than generating phonetically compromised audio.
