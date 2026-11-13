# LinguaBridge Browser for Android

The Android pilot opens HTTPS websites and translates eligible French or English text into Ewondo, Fulfulde, Hausa, Kanuri, or Cameroon Pidgin. Choose a target from **Translate → Target language**, turn on auto-translate, then open a page normally. The bundled lexicon works offline. To translate unknown visible phrases with GPT-6 Luna, open **Translate → Set cloud translation key** and paste a translation-scoped LinguaBridge API key. The browser calls the Railway API over HTTPS; the OpenRouter key stays on the server. The toolbar reports partial coverage and lets you restore the original text.

Use **Translate → Turn on auto-translate**, then **Open translation demo**. The demo is bundled with the app and works offline. Scroll to **Afficher** and tap it to add new text to the page. Use **Show original** to restore the French text. The FCFA amounts stay in the original form throughout.

The shared translator works through visible text as you scroll and observes changes within the main document. Unknown text stays in the source language when the cloud key is missing or the API cannot translate it. It leaves editable controls, protected routes, password forms and cross-origin frames alone. The isolated script sends short eligible text batches to native Android code, which calls the Railway API. The scoped API key stays in the app's private preferences; never put the OpenRouter key into the app. Cloud coverage and language quality still vary by site and need review.

For a speech demo, select **Hausa** or **Fulfulde**, add the scoped key, and turn on **Translate → Turn on long-press speech**. Long press a translated page section to request AI audio from the Railway API. Hausa and Nigerian Fulfulde are supported by the hosted TTS model; Cameroonian pronunciation still needs native-speaker review. Ewondo, Kanuri, and Cameroon Pidgin speech are unavailable until matching voices are validated. The browser does not claim that a silent response is spoken audio.

## Build and install

Use Node.js with pnpm, JDK 17, Android SDK Platform 36 and build-tools 35.0.0. Set `ANDROID_HOME` to the SDK directory or open this directory in Android Studio.

From the LinguaBridge workspace (`linguabridge/`):

```powershell
pnpm install --frozen-lockfile
Set-Location apps/browser-android
.\gradlew.bat :app:assembleDebug :app:lintDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

The debug APK is also usable for internal installation by opening it on an Android device. The app supports Android 7.0 and up. Automatic translation depends on whether the installed Android System WebView supports isolated script injection. Update Android System WebView if the toolbar says translation is unavailable.

## Pilot scope

Lexicon and cloud coverage vary, and language quality still needs native-speaker review. The prototype includes one browsing view with back, forward, reload and a home screen. Downloads, default-browser registration and iOS are outside this build. The CI debug APK uses a temporary debug signing key, so an installation signed by a different build may need to be uninstalled first. [AndroidX WebKit](https://developer.android.com/reference/androidx/webkit/WebViewCompat)
