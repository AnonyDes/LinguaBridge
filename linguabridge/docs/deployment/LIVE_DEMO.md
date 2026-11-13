# Live demonstration on your machine

This is a runbook for the team recording the project, not a rendered video.

## Desktop extension

1. Build the extension with `pnpm --filter @linguabridge/extension build` from `C:\Projects\LinguaBridge\linguabridge`.
2. Open `chrome://extensions`, find the unpacked LinguaBridge extension, click **Reload**, then refresh the website tab. A GitHub push does not update the installed extension.
3. In the extension popup, save `https://api-production-72bac574.up.railway.app` and paste the limited `EXTENSION_API_KEY` from the ignored local `apps/api/.env` file. Never enter the OpenRouter or administrator key into Chrome. Allow Chrome's permission request for that exact Railway origin.
4. Choose **Hausa**, enable **Traduction approfondie**, enable audio, and translate a French or English page. Click the page once to unlock browser audio if Chrome requests a gesture. Hover a translated section and wait briefly. The floating bar should show the phrase while the hosted AI voice plays. Try **Rejouer** and **Arrêter**.
5. For Fulfulde, repeat with that target. The hosted TTS model lists Nigerian Fulfulde; ask a native speaker to assess the accent before describing it as Cameroonian Fulfulde. Ewondo, Kanuri and Cameroon Pidgin now request an experimental hosted voice. It generated audio in a probe, but pronunciation and variety are unreviewed. Play the fixed research samples at `https://linguabridge-web.vercel.app/voices` to compare; these samples do not synthesize arbitrary page text.

## Android browser

1. Install the latest `app-debug.apk` from `apps/browser-android/app/build/outputs/apk/debug` or the GitHub Actions artifact. Update Android System WebView if the toolbar says isolated translation is unavailable.
2. In **Translate**, select a target and enable auto-translate. Open **Translation demo** to show offline translation and **Show original** to show restoration.
3. To show broader cloud translation, set the same scoped LinguaBridge key in **Translate → Set cloud translation key**, open an HTTPS page, and scroll. The app sends only eligible short visible text batches through Railway; protected pages and editable fields are excluded.
4. For audio, select a target, turn on long-press speech, and long press a translated paragraph. The Android app requests hosted WAV audio and plays it locally. Ewondo, Kanuri and Cameroon Pidgin are labeled experimental. A missing key, unsupported target, or unavailable API produces a message rather than simulated speech.

## Claims to avoid in the recording

- “Every page is fully translated”: inaccessible frames, images, PDFs, closed shadow roots, unsupported source languages, and model errors remain.
- “All five voices are validated”: audio has been generated for five target texts, but three live voices are experimental and none has passed native-speaker evaluation. See [voice model audit](../architecture/VOICE_MODEL_AUDIT.md).
- “The APK updates from GitHub automatically”: the debug APK must be installed again after each build; public distribution needs a signed release channel.
