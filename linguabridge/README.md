# 🌍 LinguaBridge — Multilingual Accessibility Platform for Central African Financial Inclusion

> **SAFINUM Innovate Challenge 2026 Submission**  
> *Empowering 10M+ unbanked and informal economic actors across Cameroon & CEMAC with sovereign, zero-drift linguistic infrastructure for Mobile Money and Digital Microfinance.*

[![CI/CD Tests](https://img.shields.io/badge/tests-167%20passed%20(21%20tasks)-brightgreen.svg)](#testing--verification)
[![GitHub Pages](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-success.svg)](https://AnonyDes.github.io/LinguaBridge/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org/)
[![Turborepo](https://img.shields.io/badge/Turborepo-Monorepo-ef4444.svg)](https://turbo.build/)
[![National Language](https://img.shields.io/badge/Language%20Pack-Ewondo%20(ewo--CM)-059669.svg)](#certified-national-language-ewondo)
[![License](https://img.shields.io/badge/License-MIT%20%2F%20CC--BY--NC-purple.svg)](LICENSE)

---

## 📌 Executive Summary

Over 65% of Cameroon's active economic population relies on informal commerce, tontines (*njangi*), and mobile money (Orange Money, MTN MoMo). However, digital financial interfaces operate almost exclusively in standard French and English, excluding millions of national language speakers who understand finances orally or in their native tongue.

**LinguaBridge** provides a production-grade, sovereign multilingual accessibility layer designed specifically for African fintech ecosystems. It guarantees:
1. **0% Financial Distortion Guarantee**: Monetary figures, fees, phone numbers, and transaction IDs are cryptographically anchored and validated via SHA-256 AST extraction before any translation is surfaced.
2. **Sovereign National Language Support**: Commencing with **Ewondo (`ewo-CM`)**, rooted in official linguistic consensus (NACALCO / Université de Yaoundé I) for mobile money terminology.
3. **Turnkey Cloud Readiness**: Deployable in 3 minutes — only Supabase, OpenRouter, and Vercel credentials are required. Works out-of-the-box locally with zero external dependencies.

---

## 🏛 Architecture & Monorepo Structure

Built with **Turborepo** + **pnpm workspaces**:

```
linguabridge/
├── apps/
│   ├── api/             # Fastify API Gateway (:3001) with Hybrid Cache (Supabase/Memory)
│   ├── web/             # Next.js 14 Showcase & CameroPay Demo App (:3000)
│   └── extension/       # Chrome Browser Extension for Web Banking & Fintech Portals
├── packages/
│   ├── shared-types/    # Core TypeScript interfaces & contracts
│   ├── financial-domain/# Financial Entity Extractor, AST parsing, SHA-256 integrity
│   ├── language-registry/# Governance engine & quarantine for unverified language packs
│   ├── translation-engine/# Pipeline, cache stages, fixture, LibreTranslate & OpenRouter
│   ├── speech-engine/   # Audio orchestrator, phonetic guidance, Web Speech integration
│   ├── database/        # Drizzle ORM schema for PostgreSQL / Supabase
│   ├── sdk-js/          # Universal JavaScript / TypeScript client
│   ├── sdk-react/       # React hooks (useTranslation, useFinancialGuard)
│   └── widget/          # Embeddable zero-dependency accessibility widget
├── language-packs/
│   └── ewondo/          # Certified National Pack: Kóbɔ́ Ewondo (ewo-CM)
│       ├── manifest.json
│       └── dictionaries/financial-glossary.json
└── infrastructure/
    └── migrations/
        └── supabase-init.sql # Turnkey Supabase schema with RLS & seed data
```

---

## 🇨🇲 Certified National Language: Ewondo (`ewo-CM`)

Ewondo is the premier national language integrated into LinguaBridge with certified financial consensus:

| Terme Français | English Term | Kóbɔ́ Ewondo (`ewo-CM`) | IPA Transcription |
|---|---|---|---|
| **Solde disponible** | Available balance | **Móni mí ne wá é bẽng** | `[móní mí né wá é bèŋ]` |
| **Transfert d'argent** | Money transfer | **Lóm móni** | `[lóm mó-ní]` |
| **Frais de transfert** | Transfer fees | **Móni mébembá** | `[mó-ní mé-bèm-bá]` |
| **Numéro destinataire** | Recipient number | **Nlambá nyí a nòng móni** | `[n-lá-mbá nyí a nòŋ móní]` |
| **Montant** | Amount | **Abui móni** | `[a-bùí mó-ní]` |
| **Motif / Référence** | Payment reason | **Asu dzé / Nkat** | `[a-sú dzé]` |
| **Tontine mensuelle** | Monthly tontine | **Móni tsɔ́ ngɔ́n** | `[mó-ní tsɔ́ ŋgɔ́n]` |

> **Cameroon Pack Isolation Policy**: Non-certified templates (Duala, Basaa, Fulfulde, Bulu) remain strictly quarantined in `not_installed` state until verified by field linguists, preventing synthetic hallucinations.

---

## 🛡️ Financial Guard & Zero-Drift Protection

Every translated payload passes through the AST-level **Financial Entity Extractor**:
- **CEMAC Formats**: Accurately recognizes `15.000 FCFA`, `15k cfa`, `15000 f`, `15 000,50 XAF`.
- **Phone Numbers**: Full CAMTEL, Orange (+237 69x), MTN (+237 67x/68x) detection.
- **Cryptographic Fingerprint**:
  $$\text{Fingerprint} = \text{SHA-256}\left(\sum \text{canonical}(entity_i)\right)$$
- If an LLM or provider alters a single digit or drops an account number, the pipeline aborts with status `'unsafe'` and falls back to verified human-in-the-loop templates.

---

## 🚀 Quickstart & Local Execution

No external accounts or cloud keys are required to run locally:

```bash
# 1. Install dependencies
pnpm install

# 2. Run all tests (18 test suites across all packages)
pnpm turbo test

# 3. Start development servers
# Starts API Gateway on :3001 and Web on :3000
pnpm turbo dev
```

Visit the interactive apps:
- **CameroPay Demo**: [http://localhost:3000/cameropay](http://localhost:3000/cameropay)
- **Developer Dashboard**: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
- **Interactive Documentation**: [http://localhost:3001/docs](http://localhost:3001/docs)

---

## ☁️ Turnkey Deployment (GitHub Pages or Vercel)

Full details available in [docs/deployment/TURNKEY_DEPLOYMENT.md](docs/deployment/TURNKEY_DEPLOYMENT.md):

### Option A: 100% Free GitHub Pages (Automated via GitHub Actions)
LinguaBridge includes an automated workflow [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) that automatically builds and deploys the showcase on every push:
- **Live URL**: `https://AnonyDes.github.io/LinguaBridge/`
- Zero external accounts or hosting configuration required.

### Option B: Cloud API & Vercel
1. **Supabase PostgreSQL**:
   - Create a project on [supabase.com](https://supabase.com).
   - Paste [`infrastructure/migrations/supabase-init.sql`](infrastructure/migrations/supabase-init.sql) into SQL Editor and click **Run**.
   - Copy URI to `DATABASE_URL`.
2. **OpenRouter**:
   - Create key on [openrouter.ai](https://openrouter.ai) and set `OPENROUTER_API_KEY`.
3. **Vercel**:
   - Import GitHub repository `AnonyDes/LinguaBridge`.
   - Set `NEXT_PUBLIC_API_URL` to your API gateway URL.
   - Deploy!

---

## 🧪 Testing & Verification

```bash
pnpm turbo test
```

- `apps/api`: **15/15 tests passing** (Ewondo translation, entity extraction, cache hits, authentication)
- `apps/web`: **6/6 tests passing** (CameroPay UI, French/English/Ewondo switching, dashboard)
- `packages/financial-domain`: **11/11 tests passing** (CEMAC currencies, decimal localization, SHA-256 fingerprinting)
- `packages/translation-engine`: **7/7 tests passing** (Pipeline execution, cache-lookup, cache-writer)
- `packages/language-registry`: **6/6 tests passing** (Isolation policy, activation, quarantine)
- `packages/speech-engine`: **6/6 tests passing** (Voice orchestrator, language validation)
- `packages/sdk-js`: **5/5 tests passing** (Client requests, timeout, authorization)

---

## 📄 License

- Platform Code & SDKs: **MIT License**
- National Language Dictionaries (Ewondo): **CC-BY-NC 4.0** (Attribution: NACALCO & Université de Yaoundé I)
