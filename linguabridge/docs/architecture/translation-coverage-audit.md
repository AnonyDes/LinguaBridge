# Translation and voice deployment audit (13 November 2026)

## What the product can measure

The extension measures the **current document**, including open shadow roots that it can access. It reports text and translatable attribute segment counts and character counts, then processes server requests in batches of 20. Each matching frame runs the content script separately. The popup also reads same-origin sitemaps with a bounded request and byte budget. If no sitemap is available, it shows the number of same-origin links found on the current page as a lower bound. A domain's total page count cannot be inferred exactly from one visited page or an incomplete sitemap. A site-wide count requires a separate, opt-in crawler that follows permitted links, obeys robots rules and rate limits, and reports pages it could not access.

## Confirmed issues and current state

| Issue | State | Consequence |
| --- | --- | --- |
| Local dictionaries change only known words and phrases; a changed segment can still contain untranslated words | Open | Full page translation requires a real model or human-reviewed corpus for each language. The audit script reports changed versus unchanged segments, not translation quality. |
| API stopped at its first provider even when it returned unchanged or unverified text | Fixed | The pipeline now tries later eligible providers, respects the request's privacy policy, and marks an unchanged final result unverified. |
| Extension page translation never requested model output | Fixed with opt-in | The enhanced mode sends original page segments to the configured API in batches and applies successful model output. Offline dictionary translation remains available. |
| Extension API address was fixed to localhost | Fixed for enhanced translation | The popup accepts an HTTPS API origin and requests permission for that origin. Production API authentication and CORS still need deployment configuration. |
| Page and site size were not measured | Partially fixed | The popup shows current-page segment and character counts plus a bounded sitemap or link estimate. Exact whole-site discovery remains separate. |
| Source language detection only handles English and French, with one language assumed for the whole document | Open | Other source languages and mixed-language pages require per-segment detection and validated translation pairs. |
| Local DOM translation still runs synchronously on the entire document | Open | Very large pages can pause the UI. The measured workload should drive incremental local traversal and a visible progress counter in a later pass. |
| Closed shadow roots, canvas, text embedded in images, PDFs, video captions, and inaccessible frames cannot be read as ordinary DOM text | Open | OCR, document translation, caption support, and host-specific integrations are separate features. Sites can also block injection. |
| Remote output can be inaccurate even when its provider returns `success` | Open | The financial guard preserves detected amounts and identifiers, but linguistic accuracy requires native-speaker evaluation. Inline markers are validated before applying a model result. |
| Voice model downloader wrote to a directory different from the server and used the wrong Fulfulde checkpoint ID | Fixed | Downloads now use `models/african-tts` and `facebook/mms-tts-ful`. Missing models return unavailable rather than another language's voice. |
| Voice availability and language variety were overstated | Open | Current workspace has no voice model files. The linked `facebook/mms-tts-pcm` checkpoint is **Nigerian Pidgin**, so it must not be treated as verified Cameroon Pidgin speech without a review. Kanuri and Ewondo need matching, validated checkpoints or new recordings. |
| Speech language endpoint marked every language `verified` even with no model installed | Fixed | It now checks the voice service's installed model list and reports unavailable or installed but unverified. The test-mode silent WAV is not a speech quality test. |
| The provider named `NllbLocalProvider` is a phrase cache, not an NLLB inference runtime | Open | It cannot supply open-domain coverage; rename or replace it before claiming neural translation. |
| Pack manifests claim production approval and parallel corpora, while this checkout contains dictionaries but no matching parallel corpora or evaluation set | Open | Treat the registry labels as unsubstantiated until provenance, licensing, and native-speaker benchmarks are assembled. |

## Deployment shape

1. Deploy the Fastify API as a thin authenticated gateway. Vercel is possible for that layer. Set `OPENROUTER_API_KEY`, `ENABLE_LLM_TRANSLATION=true`, and a tested `OPENROUTER_MODEL` for enhanced text translation. Configure `CORS_ORIGINS` for the extension origin and issue scoped user API credentials. Do not place a provider secret in the extension.
2. Run the voice model service in a persistent container or managed inference endpoint. Set the API's `VOICE_SERVICE_URL` to its private HTTPS address. The API already exposes `/v1/speech/synthesize`; the extension now uses that route when configured for a remote HTTPS API.
3. Benchmark each target language separately with a held-out, native-reviewed page corpus. Report exact, partial, untranslated, and unsafe segments. Do not mark a language production-ready from dictionary changes or an LLM `success` field alone.
4. Build a separate opt-in site map service if whole-site translation is required. It should discover sitemaps and links with a strict page budget, respect site policies, queue pages by URL, and translate each visited page progressively. The browser extension alone translates pages a user opens.

## Why the Python voice service is not a simple Vercel Function

Vercel supports Python functions, but its Python bundle limit is 500 MB uncompressed and function instances are ephemeral. A single official MMS Hausa checkpoint is about 145 MB; four checkpoints plus PyTorch and Transformers are likely to exceed the bundle limit, and loading models on cold starts would increase latency and cost. The existing Flask process also starts a background preload thread and expects persistent local model files. Rework it as a stateless function only after measuring a single-model bundle and latency; a persistent inference service is the practical default. Vercel can still host the gateway and web interface.

The Meta MMS checkpoints inspected here use CC-BY-NC-4.0. Review licensing before any commercial hosted deployment.

## Verification in this checkout

The extension suite covers local translation, dynamic DOM, inline markup, server batch application and restoration, and bounded sitemap estimates. API tests cover financial drift and voice-unavailable behavior. A Chrome DevTools MCP run on `example.com` confirmed that the popup measures the loaded page after dynamic content appears (7 segments, 906 characters), sends an enhanced batch to a temporary local test API, translates newly added text, and restores the source. The temporary API returned labeled test strings; it was not a linguistic quality test. No production translation model, reviewed page corpus, or voice checkpoint is configured in this checkout.

References: [Vercel Python runtime](https://vercel.com/docs/functions/runtimes/python), [Vercel function limits](https://vercel.com/docs/functions/limitations), [MMS Hausa files](https://huggingface.co/facebook/mms-tts-hau/tree/main), [MMS Nigerian Pidgin model card](https://huggingface.co/facebook/mms-tts-pcm), [MMS Fulah model card](https://huggingface.co/facebook/mms-tts-ful).
