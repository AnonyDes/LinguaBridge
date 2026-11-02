# ADR-004: Degrade-First Speech Orchestration for Indigenous Languages

## Status
**Accepted**

## Date
2026-11-01

## Context
Voice accessibility is critical for illiterate or visually impaired citizens in rural Cameroon who rely on mobile money for livelihood and remittances.

However, standard web and operating system Text-to-Speech (TTS) engines (e.g., Web Speech API) only provide acoustic voice models for major global languages (French, English, German, Spanish). When an application requests speech synthesis for an unsupported locale (such as `ewo-CM` or `dua-CM`), standard TTS engines either:
1. Fail silently without notifying the calling code.
2. Substitute the voice with the system default (French or English), attempting to read out tone-marked Bantu text phonetically as if it were European words.

Because Bantu languages like Ewondo and Duala rely on phonemic pitch/tone to distinguish vocabulary and verb tenses, cross-lingual voice substitution results in grotesque auditory distortion and unintelligible gibberish that confuses vulnerable users.

## Decision
We mandate a **Degrade-First Speech Orchestration Architecture** (`@linguabridge/speech-engine`):
1. **No Silent Fallback**: The speech engine strictly rejects cross-lingual audio fallback. `fallbackLang` is statically locked to `null`.
2. **Explicit Capability Detection**: Before attempting synthesis, the orchestrator verifies whether a validated, native acoustic model exists for the target language.
3. **Explicit Degradation Contract**: If a language lacks an approved acoustic model (e.g., all unverified Cameroonian language packs), the engine returns:
   ```json
   {
     "available": false,
     "lang": "ewo-CM",
     "unavailableReason": "Audio synthesis is currently unavailable for Ewondo (ewo-CM). Acoustic models are pending qualified native phonetic certification. Silent fallback to another language is prevented by safety policy.",
     "fallbackLang": null
   }
   ```
4. **UI Degradation Notice**: Client applications and widgets render an explicit explanation instead of playing distorted audio.

## Consequences
- **Positive**: Protects the phonological and cultural integrity of indigenous African languages.
- **Positive**: Prevents catastrophic auditory confusion in financial confirmation dialogs (e.g. hearing distorted amounts).
- **Positive**: Provides clear, transparent feedback to developers and end users about speech capability status.
