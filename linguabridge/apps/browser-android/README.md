# LinguaBridge Browser for Android

The Android pilot opens HTTPS websites and translates eligible French or English text into Ewondo with the bundled LinguaBridge lexicon. After turning on auto-translate once, open a page normally. The toolbar reports when some text was translated and lets you switch back to the original. The browser also remembers the source-language override and site pauses.

Use **Translate → Turn on auto-translate**, then **Open translation demo**. The demo is bundled with the app and works offline. Scroll to **Afficher** and tap it to add new text to the page. Use **Show original** to restore the French text. The FCFA amounts stay in the original form throughout.

The shared translator matches whole phrases, works through visible text as you scroll and observes changes within the main document. Unknown phrases and numeric text stay in the source language. It leaves editable controls, protected routes, password forms and cross-origin frames alone. Page text stays in the isolated script. The native message channel carries configuration and status only.

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

The target is fixed to Ewondo. Lexicon coverage varies, and language quality still needs native-speaker review. The prototype includes one browsing view with back, forward, reload and a home screen. Downloads, default-browser registration, iOS and cloud translation are outside this build. [AndroidX WebKit](https://developer.android.com/reference/androidx/webkit/WebViewCompat)
