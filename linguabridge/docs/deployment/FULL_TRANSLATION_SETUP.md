# Full-page translation setup and release checklist

## Current capability

The extension translates text nodes, common text attributes, dynamic DOM changes, and accessible open shadow roots on the page the user visits. It offers five target languages: Ewondo (`ewo-CM`), Fulfulde (`fuv-CM`), Hausa (`hau-CM`), Kanuri (`knc-CM`), and Cameroon Pidgin (`pcm-CM`). It detects French or English as the source at document level. Its offline dictionaries provide partial coverage; the optional API requests model translations for original page segments in batches of 20. The popup measures the current page and estimates linked page count, but does not crawl or translate an entire site automatically.

Do not describe this as complete translation of every site or verified linguistic coverage. The financial guard checks recognized amounts and identifiers, not meaning or grammatical quality. Model output can still leave source-language words or make semantic errors. Closed shadow roots, canvas, image text, PDFs, video, browser-internal pages, and inaccessible frames need separate handling.

## What an operator needs

1. **Runtime:** Node.js, pnpm 11.25.0, a Chromium browser, and a reachable LinguaBridge API. Run commands below from the `linguabridge` directory. The API runs as a Fastify process in a Railway Docker service. The repository's `vercel.json` builds the static Next.js web app; it does not deploy the API or Python voice service.
2. **OpenRouter:** Create an OpenRouter API key with a spending limit. Put it only in the API's environment, never in an extension or Git commit. Choose a primary model after testing each target language. `OPENROUTER_FALLBACK_MODELS` accepts comma-separated model IDs for provider errors; OpenRouter fallback does not judge translation quality. Costs and language capability depend on the selected models.
3. **API access:** Set a unique `API_KEY` for administration, `NODE_ENV=production`, `REQUIRE_API_KEY=true`, and `CORS_ORIGINS` for trusted web clients. Provision a separate key with only `translate:batch` (and `translate:read` if needed) for an extension user. Extension keys are visible to that user and should have a strict quota. Do not use the administration key in the extension. Key and quota state is currently process-local: multi-instance/serverless production requires durable key storage and quota enforcement first.
4. **Hosting:** The API is deployed on Railway with a Dockerfile and a Railway HTTPS domain. The static Next.js web app is deployed separately on Vercel. Set the API's `OPENROUTER_MODEL=openai/gpt-6-luna` and keep the OpenRouter, admin, and scoped extension keys in Railway service variables. The optional Python voice model service needs downloaded, licensed, language-matched checkpoints and a persistent inference host; set `VOICE_SERVICE_URL` on the API to its reachable address. Text translation works without voice.
5. **Quality evidence:** Obtain a licensed, native-reviewed corpus for every target language and variety, including financial terms, realistic web pages, forms, and long text. Benchmark each configured model on held-out sentences. Review untranslated spans and meaning, inline markup, numbers, names, dialect and spelling. Native speakers must sign off before claiming full or production-ready coverage. Review the voice model licenses separately before hosting speech commercially.

## Hosted pilot

- Web: `https://linguabridge-web.vercel.app` (static export on Vercel).
- API: `https://api-production-72bac574.up.railway.app` (Fastify Docker service on Railway).
- Model: `openai/gpt-6-luna` through OpenRouter. The provider key is configured only on Railway and in the ignored local API environment.
- Extension: enter the Railway API origin and the limited `EXTENSION_API_KEY` from the ignored local API `.env` in its server settings, then enable enhanced translation. Never enter the administrator `API_KEY` in a browser.
- Android APK: the pilot uses the bundled offline lexicon for five target languages and sends eligible unknown visible phrases to the Railway API when the user configures a scoped key. All five targets can request long-press hosted speech; Ewondo, Kanuri, and Cameroon Pidgin are experimental and unreviewed.
- Voice: set `ENABLE_OPENROUTER_SPEECH=true` on Railway for Hausa and Fulfulde TTS. Set `ENABLE_EXPERIMENTAL_SPEECH=true` to enable audio attempts for Ewondo, Kanuri, and Cameroon Pidgin text. These extra requests produced waveforms in probes, without evidence of accurate pronunciation or variety. This uses a separate Gemini TTS model; GPT-6 Luna remains the text translation model. The five fixed local research samples are published at `/voices`. See [voice model audit](../architecture/VOICE_MODEL_AUDIT.md).

Railway is configured with a separate extension key, `REQUIRE_API_KEY=true`, a production environment, and CORS restricted to the web origin. The quota counters are process-local. A public multi-instance release needs durable key and quota storage, cost controls, and native-speaker validation. The web API console accepts a user's scoped key for protected routes and reports real HTTP failures. The page widget stays hidden in production unless a public key or safer web proxy is deliberately configured.

## Local setup

```powershell
cd C:\Projects\LinguaBridge\linguabridge
pnpm install
Copy-Item apps/api/.env.example apps/api/.env
```

In `apps/api/.env`, set at least:

```dotenv
API_PORT=3001
OPENROUTER_API_KEY=<private OpenRouter key>
OPENROUTER_MODEL=openai/gpt-6-luna
OPENROUTER_FALLBACK_MODELS=<optional tested fallback IDs, comma separated>
ENABLE_LLM_TRANSLATION=true
```

For a local development session, `NODE_ENV` may remain unset and anonymous translation is allowed by the API. For any public endpoint, use the production settings above and a scoped key. Start the API and build the extension in separate terminals:

```powershell
pnpm --filter @linguabridge/api dev
pnpm --filter @linguabridge/extension build
```

On a single-instance pilot API, set `EXTENSION_API_KEY` to a distinct random secret in Railway. It is available after restarts with translation and speech scopes, but its quota counters remain process-local. Alternatively, an administrator can issue a scoped key with `POST /v1/keys`; dynamically issued keys are lost on restart until key storage becomes durable. Neither key strategy is ready for a multi-instance public rollout.

Open `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and select `C:\Projects\LinguaBridge\linguabridge\apps\extension\dist`. In the popup, set the API URL to `http://localhost:3001`, save it, enable **Traduction approfondie**, choose a language, and activate page translation. Refresh an already-open site tab if needed. When using a hosted API, enter its HTTPS origin and the scoped LinguaBridge API key in the popup; the extension asks Chrome for that origin's permission. The OpenRouter key belongs only on the API server.

Check API health and one translated sentence, then test a long live page with dynamic content, forms, inline links and each of the five targets. Count unchanged and partial segments and review them with a native speaker; a transport response marked `success` is not proof of correct translation. The extension currently does not show a verified coverage percentage.

## Extension releases

Pushing this repository to GitHub does **not** update an unpacked extension. Rebuild `apps/extension/dist`, click **Reload** for LinguaBridge in `chrome://extensions`, then refresh the target tab. For automatic updates to users, publish a versioned ZIP through the Chrome Web Store: increment `manifest.json`'s version, build, upload the package, submit it, and publish the approved version. Chrome then checks for published updates. Keep a release checklist for browser permissions, target languages, QA results, and rollback. A source push or pull request alone is not a browser release.

## Remaining engineering for broad coverage

- Per-segment language detection and support for source languages beyond French and English.
- A measured coverage report with translated, partial, unchanged, unsafe, skipped and inaccessible segments, plus a visible progress counter for large pages.
- Incremental local traversal to avoid blocking on large DOMs; robust handling for difficult frames and page navigation.
- OCR and separate PDF, image and caption workflows for content outside readable DOM text.
- A permitted, opt-in crawler for site-wide discovery and translation of pages the user has not opened, with URL limits, robots handling, rate limits and authentication boundaries.
- Durable authentication, quotas, observability and cost controls for a hosted model gateway.
- Per-language native review and model selection; external-model fallback only handles errors, not incorrect or incomplete translations.

See [the architecture audit](../architecture/translation-coverage-audit.md) and [voice model audit](../architecture/VOICE_MODEL_AUDIT.md) for confirmed limits.
