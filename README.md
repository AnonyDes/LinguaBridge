# LinguaBridge

**SAFINUM Innovate Challenge 2026 | Cameroon | Open-source prototype**

LinguaBridge helps people understand banking, mobile-money and payment interfaces in Cameroonian languages. It is an accessibility layer for **existing** digital financial services, not a bank, payment processor or replacement for the original website.

**[Visit the website](https://anonydes.github.io/LinguaBridge/)** · **[Open the extension portal](https://anonydes.github.io/LinguaBridge/dashboard/)** · **[Desktop installation guide](linguabridge/apps/extension/EDGE_DESKTOP.md)**

## 1. What can people use today?

| Access method | Status | Explanation |
| --- | --- | --- |
| Chrome desktop extension | Prototype / testing | Load an unpacked Manifest V3 extension and translate visible interface text |
| Microsoft Edge desktop extension | Prototype / testing | Same Chromium extension code; see installation guide |
| Direct web access | **Beta / in development** | Planned browser-based access without installing the desktop extension |
| Mobile experience | **Planned** | Not a released mobile extension or app |
| API, JavaScript SDK, React SDK and embeddable widget | Complementary developer tools | Available as source modules; require their own integration and/or backend configuration |

The GitHub Pages website is a **static showcase**. It does not by itself host the translation API. An interactive translation request can fail when no reachable API has been configured; the interface should not fabricate a result.

## 2. Languages and current limitations

The system accepts **French and English** as source languages. The repository contains resources or code paths for the following targets:

| Language | Locale | Repository evidence | Important caveat |
| --- | --- | --- | --- |
| Ewondo | `ewo-CM` | Financial glossary, Apertium lexicon and provider code | Translation quality and linguistic certification need independent verification |
| Fulfulde | `fuv-CM` | Financial glossary and phrase-cache provider | Phrase coverage is limited |
| Haoussa | `hau-CM` | Financial glossary and phrase-cache provider | Phrase coverage is limited |
| Kanuri | `knc-CM` | Financial glossary and phrase-cache provider | Phrase coverage is limited |
| Cameroon Pidgin / Kamtok | `pcm-CM` | Financial glossary and phrase-cache provider | Phrase coverage is limited |
| Basaa, Bulu | `bas-CM`, `bum-CM` | Pack manifests / templates | Not established as fully operational |
| Duala | `dua-CM` | Research corpora, vocabulary guides and experimental translation code | The pack manifest still says `not_installed` and some providers exclude it; do **not** advertise it as production-ready |

**A manifest field such as `production_approved` is a configuration value, not independently verified evidence of linguistic or regulatory certification.** Likewise, a translation that comes from a glossary or cached phrase is not proof that arbitrary sentences are correctly translated. Language coverage must be checked in the actual extension and API.

Language resources live in [`linguabridge/language-packs/`](linguabridge/language-packs/), with research in [`linguabridge/docs/research/`](linguabridge/docs/research/).

## 3. How the extension works

1. The user opens an existing financial website in Chrome or Edge on desktop.
2. The extension reads eligible interface text and offers source and target language choices.
3. Known phrases and terminology are looked up through the configured translation pipeline. The system can use other providers depending on configuration.
4. The financial-domain layer is designed to recognize sensitive values such as amounts, currencies, account references and telephone numbers so they can be checked against the original.
5. Translated text is displayed in the interface. Dynamically inserted content and unsupported phrases need additional testing.

**Safety:** Do not use this prototype to authorize real payments based solely on translated text. Always compare amounts, fees, beneficiary numbers and security messages with the original. Do not enter banking PINs, passwords or real credentials into demonstration forms.

## 4. External technology, open-source work and research

LinguaBridge combines original integration work with external tools and research. These are **dependencies or reference resources**, not features invented by the project.

| Source | How it relates to LinguaBridge | What we must not claim |
| --- | --- | --- |
| **Meta AI NLLB-200** ([research/model](https://ai.meta.com/research/no-language-left-behind/)) | Inspiration and named translation-provider pathway for multilingual translation; the repository includes a provider named `nllb-local` | **The current `nllb-local.provider.ts` uses a predefined financial phrase cache and returns the original text for unknown phrases. It does not itself run Meta neural-model inference.** The existence of this provider is not proof that NLLB weights are loaded or serving translations |
| **Apertium** ([project](https://www.apertium.org/)) | Ewondo/French lexical candidates and research material, see `ewondo-apertium-candidates.json` and the Ewondo lexicon | Lexicon availability does not prove validated financial translations |
| **SIL Cameroon, NACALCO, academic sources** | Referenced linguistic research and provenance metadata in language packs | Attribution and alleged reviewer/certification fields need source-by-source confirmation; do not present unverified institutional endorsements as facts |
| **Next.js / React / TypeScript** | Public website and UI | A static site does not provide a live translation API |
| **Chromium Manifest V3** | Desktop browser-extension architecture | Mobile browser support is not established |
| **Fastify** | API gateway in `apps/api` | Requires running/deploying the API |
| **Supabase / PostgreSQL / Drizzle** | Optional backend persistence infrastructure | Not necessary for simply viewing the public website |
| **OpenRouter / LibreTranslate** | Optional translation-provider integrations | Requires configuration and may send submitted text to external services; privacy depends on deployment and provider |
| **Turborepo / pnpm / Vitest** | Monorepo development, builds and tests | Test results should be measured from the latest run, not copied from old badges |

More detail: [architecture](linguabridge/docs/architecture/overview.md), [license audit](linguabridge/docs/research/license-audit.md), [source inventory](linguabridge/docs/research/duala-source-inventory.json), [reference repositories](linguabridge/docs/research/reference-repositories.md).

### Why the distinction about Meta matters

The repository currently has a `NllbLocalProvider` class labeled “Meta NLLB-200 Sovereign Local Provider”. Inspection of its implementation shows **a lookup table of prepared translations**, not a neural model loader or inference call. It may be useful for offline known phrases, but should be documented as **NLLB-inspired / cache-backed prototype functionality** until real model inference is wired and verified. The exact model checkpoint, weights license, deployment, language coverage and evaluation must be recorded before claiming that Meta NLLB is running in production.

## 5. Repository structure

```text
linguabridge/
  apps/
    extension/          Chromium desktop extension
    web/                Next.js landing page and extension access portal
    api/                Fastify translation API
  packages/
    translation-engine/ Translation pipeline and providers
    financial-domain/   Financial entity extraction and checks
    language-registry/  Language pack registry and validation
    shared-types/       Shared API types
    sdk-js/             JavaScript client
    sdk-react/          React integration
    widget/             Embeddable integration
    speech-engine/      Speech-related modules
    database/           Database schema/integration
  language-packs/       Language resources and manifests
  docs/
    architecture/       Design decisions and architecture
    research/           Corpora, licensing and linguistic research
    deployment/         Deployment notes
```

## 6. Run and test locally

Prerequisites: Node.js, pnpm and Git. Run these commands **from the `linguabridge/` folder**:

```bash
pnpm install
pnpm --filter @linguabridge/translation-engine build
pnpm --filter @linguabridge/extension build
```

Load `linguabridge/apps/extension/dist/` through **chrome://extensions** or **edge://extensions**, enable Developer mode, then **Load unpacked**. For Edge-specific build instructions use [EDGE_DESKTOP.md](linguabridge/apps/extension/EDGE_DESKTOP.md).

For developers who also need the API or website:

```bash
pnpm turbo dev
pnpm turbo test
```

Development endpoints and required environment variables depend on the individual app. The web showcase is distinct from the backend. Avoid putting secret API keys into client-side environment variables.

## 7. Financial data protection and privacy

The design includes a financial entity guard and checks intended to prevent translated text from silently changing amounts, fees, currencies and reference values. **Do not describe this as a mathematically guaranteed zero-error translation system without current end-to-end test evidence.**

Before any production use, validate: exact preservation of financial values, handling of dynamic page content, language quality with native speakers, extension permissions, data retention, third-party API disclosure, and behavior when translation is unavailable.

## 8. SAFINUM alignment and roadmap

The hackathon challenge asks for an interoperable language-accessibility layer for existing financial services. LinguaBridge prioritizes:

1. **Integration without rewriting bank websites**, starting with the desktop extension.
2. **French/English into Cameroonian languages**, with clear distinctions between research, test coverage and validated support.
3. **Financial safety and user trust**, including transparent failure states.
4. **Broader access on mobile and via the web**, planned rather than falsely presented as complete.
5. **Complementary integration tools** for fintech teams that want to embed accessibility directly.

## 9. Credits, licenses and contributions

Code, third-party packages, dictionaries and research corpora may carry **different licenses**. Check [LICENSE](LICENSE), individual package licenses, language-pack manifests and [license audit](linguabridge/docs/research/license-audit.md). Do not assume every linguistic dataset is freely redistributable or suitable for commercial use.

Contributions are welcome, especially native-speaker review of financial vocabulary, reproducible language benchmarks, extension accessibility tests and provenance/license corrections.

**Status note:** This document describes the inspected repository architecture and its limitations, not an independently certified banking product.
