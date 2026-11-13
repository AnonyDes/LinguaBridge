package org.linguabridge.browser;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.res.ColorStateList;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Typeface;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.GradientDrawable;
import android.graphics.drawable.RippleDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.text.InputType;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.inputmethod.EditorInfo;
import android.view.inputmethod.InputMethodManager;
import android.webkit.CookieManager;
import android.webkit.PermissionRequest;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.window.OnBackInvokedDispatcher;
import android.widget.Button;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.PopupMenu;
import android.widget.ProgressBar;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.webkit.JavaScriptReplyProxy;
import androidx.webkit.WebMessageCompat;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.Locale;

public final class BrowserActivity extends Activity {
    private static final int INK = 0xff0a0a0a;
    private static final int GREEN = 0xff08751a;
    private static final int BRIGHT = 0xff12b82a;
    private static final int SOFT = 0xfff3f6f3;
    private static final int PALE = 0xffe9f9ec;
    private static final int LINE = 0xffd9e0d9;
    private static final int MUTED = 0xff4c574e;
    private static final int WHITE = Color.WHITE;
    private static final String DEMO = "https://appassets.androidplatform.net/assets/demo.html";
    private static final String BRIDGE = "linguaBridgeNative";

    private SharedPreferences preferences;
    private WebView web;
    private FrameLayout content;
    private ScrollView home;
    private EditText address;
    private TextView status;
    private Button original;
    private Button translate;
    private BrowserIcon back;
    private BrowserIcon forward;
    private BrowserIcon reload;
    private ProgressBar progress;
    private boolean translationSupported;
    private boolean committed;
    private boolean pageFailed;
    private boolean showingOriginal;
    private boolean activityVisible = true;
    private String currentSite;
    private String documentId;
    private JavaScriptReplyProxy reply;
    private String sourceLanguage;
    private boolean autoTranslate;

    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        preferences = getSharedPreferences("browser", MODE_PRIVATE);
        autoTranslate = preferences.getBoolean("autoTranslate", false);
        sourceLanguage = preferences.getString("sourceLanguage", "auto");
        buildChrome();
        createWebView();
        if (Build.VERSION.SDK_INT >= 33) {
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(
                OnBackInvokedDispatcher.PRIORITY_DEFAULT, this::navigateBack);
        }
        Bundle history = savedInstanceState == null ? null : savedInstanceState.getBundle("history");
        if (history == null || web.restoreState(history) == null) showHome();
        else {
            showPage();
            if (web.getUrl() != null) address.setText(displayUrl(web.getUrl()));
        }
    }

    private void buildChrome() {
        getWindow().setStatusBarColor(SOFT);
        getWindow().setNavigationBarColor(WHITE);
        int appearance = View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
        if (Build.VERSION.SDK_INT >= 26) appearance |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
        else getWindow().setNavigationBarColor(INK);
        getWindow().getDecorView().setSystemUiVisibility(appearance);

        LinearLayout root = column(WHITE);
        if (Build.VERSION.SDK_INT >= 35) {
            root.setOnApplyWindowInsetsListener((view, insets) -> {
                var bars = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
                var keyboard = insets.getInsets(WindowInsets.Type.ime());
                view.setPadding(bars.left, bars.top, bars.right, Math.max(bars.bottom, keyboard.bottom));
                WindowInsetsController controller = getWindow().getInsetsController();
                if (controller != null) controller.setSystemBarsAppearance(
                    WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS,
                    WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS);
                return insets;
            });
        }
        setContentView(root);

        LinearLayout top = row();
        top.setPadding(dp(12), dp(7), dp(10), dp(7));
        top.setBackgroundColor(SOFT);
        ImageView brand = new ImageView(this);
        brand.setImageResource(R.drawable.ic_bridge);
        brand.setScaleType(ImageView.ScaleType.CENTER_INSIDE);
        brand.setContentDescription("LinguaBridge home");
        brand.setBackground(touchSurface(SOFT, 8));
        brand.setFocusable(true);
        brand.setOnClickListener(v -> showHome());
        top.addView(brand, new LinearLayout.LayoutParams(dp(48), dp(48)));

        address = new EditText(this);
        address.setId(View.generateViewId());
        address.setSingleLine();
        address.setTextSize(15);
        address.setTextColor(INK);
        address.setHintTextColor(MUTED);
        address.setHint("Search or enter address");
        address.setContentDescription("Search or enter address");
        address.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_URI);
        address.setImeOptions(EditorInfo.IME_ACTION_GO | EditorInfo.IME_FLAG_NO_EXTRACT_UI);
        address.setSelectAllOnFocus(true);
        address.setPadding(dp(12), 0, dp(10), 0);
        address.setBackground(border(WHITE, 8));
        LinearLayout.LayoutParams addressParams = new LinearLayout.LayoutParams(0, dp(48), 1);
        addressParams.setMargins(dp(8), 0, 0, 0);
        top.addView(address, addressParams);
        address.setOnEditorActionListener((v, action, event) -> {
            if (action == EditorInfo.IME_ACTION_GO ||
                (event != null && event.getKeyCode() == KeyEvent.KEYCODE_ENTER && event.getAction() == KeyEvent.ACTION_DOWN)) {
                openAddress(address.getText().toString());
                return true;
            }
            return false;
        });
        root.addView(top);
        root.addView(divider());

        progress = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progress.setMax(100);
        progress.setProgressTintList(ColorStateList.valueOf(BRIGHT));
        progress.setVisibility(View.GONE);
        root.addView(progress, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(3)));

        content = new FrameLayout(this);
        root.addView(content, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1));
        home = buildHome();
        content.addView(home, new FrameLayout.LayoutParams(-1, -1));

        root.addView(divider());
        LinearLayout translationRow = row();
        translationRow.setPadding(dp(16), 0, dp(8), 0);
        translationRow.setBackgroundColor(PALE);
        status = text("", 13, GREEN, false);
        status.setAccessibilityLiveRegion(View.ACCESSIBILITY_LIVE_REGION_POLITE);
        status.setPadding(0, dp(8), 0, dp(8));
        translationRow.addView(status, new LinearLayout.LayoutParams(0, -2, 1));
        original = action("Show original", GREEN, PALE);
        original.setOnClickListener(v -> {
            showingOriginal = !showingOriginal;
            if (!showingOriginal) updateStatus("translating");
            sendSettings();
        });
        translationRow.addView(original, new LinearLayout.LayoutParams(-2, dp(48)));
        root.addView(translationRow, new LinearLayout.LayoutParams(-1, -2));

        LinearLayout bottom = row();
        bottom.setPadding(dp(9), dp(3), dp(9), dp(3));
        back = new BrowserIcon("back", "Go back", v -> navigateBack());
        forward = new BrowserIcon("forward", "Go forward", v -> {
            showPage();
            if (web.canGoForward()) web.goForward();
        });
        reload = new BrowserIcon("reload", "Reload page", v -> {
            if (pageFailed && web.getUrl() != null) openUrl(web.getUrl());
            else web.reload();
        });
        bottom.addView(back, new LinearLayout.LayoutParams(dp(48), dp(48)));
        bottom.addView(forward, new LinearLayout.LayoutParams(dp(48), dp(48)));
        bottom.addView(reload, new LinearLayout.LayoutParams(dp(48), dp(48)));
        bottom.addView(new View(this), new LinearLayout.LayoutParams(0, dp(1), 1));
        translate = action("Translate", WHITE, INK);
        translate.setOnClickListener(this::showTranslationMenu);
        bottom.addView(translate, new LinearLayout.LayoutParams(-2, dp(48)));
        BrowserIcon more = new BrowserIcon("more", "Browser options", this::showBrowserMenu);
        bottom.addView(more, new LinearLayout.LayoutParams(dp(48), dp(48)));
        root.addView(bottom, new LinearLayout.LayoutParams(-1, -2));
    }

    private ScrollView buildHome() {
        ScrollView scroll = new ScrollView(this);
        scroll.setFillViewport(true);
        scroll.setBackgroundColor(SOFT);
        LinearLayout body = column(SOFT);
        body.setPadding(dp(24), dp(34), dp(24), dp(26));
        scroll.addView(body, new ScrollView.LayoutParams(-1, -2));
        View line = new View(this);
        line.setBackgroundColor(BRIGHT);
        body.addView(line, new LinearLayout.LayoutParams(dp(44), dp(4)));

        TextView name = text("LINGUABRIDGE BROWSER", 12, GREEN, true);
        name.setLetterSpacing(.12f);
        addSpaced(body, name, 20);
        TextView title = text("Browse in your language.", 38, INK, true);
        title.setLetterSpacing(-.045f);
        if (Build.VERSION.SDK_INT >= 28) title.setAccessibilityHeading(true);
        addSpaced(body, title, 14);
        addSpaced(body, text("Open a website above, or try automatic translation on a sample page.", 16, MUTED, false), 13);

        Button demo = action("Open translation demo", WHITE, GREEN);
        demo.setOnClickListener(v -> openUrl(DEMO));
        LinearLayout.LayoutParams demoParams = new LinearLayout.LayoutParams(-1, -2);
        demoParams.topMargin = dp(26);
        body.addView(demo, demoParams);

        LinearLayout detail = column(WHITE);
        detail.setBackground(border(WHITE, 8));
        detail.setPadding(dp(16), dp(15), dp(16), dp(15));
        addSpaced(body, detail, 28);
        detail.addView(text("French / English → Ewondo", 17, INK, true));
        addSpaced(detail, text("Supported phrases translate on your device. You can always show the original page.", 14, MUTED, false), 6);
        return scroll;
    }

    private void createWebView() {
        web = new WebView(this);
        content.addView(web, 0, new FrameLayout.LayoutParams(-1, -1));
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setSupportMultipleWindows(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setBuiltInZoomControls(true);
        settings.setDisplayZoomControls(false);
        if (Build.VERSION.SDK_INT >= 26) settings.setSafeBrowsingEnabled(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(web, false);

        WebViewAssetLoader assets = new WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
            .build();
        web.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri url = request.getUrl();
                if (!"appassets.androidplatform.net".equals(url.getHost())) return null;
                if (DEMO.equals(url.toString())) return assets.shouldInterceptRequest(url);
                return new WebResourceResponse("text/plain", "UTF-8", 404, "Not Found", Collections.emptyMap(), null);
            }

            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                if (!request.isForMainFrame()) return false;
                Uri target = request.getUrl();
                if (isHttps(target)) return false;
                if (request.hasGesture() && ("mailto".equals(target.getScheme()) || "tel".equals(target.getScheme()))) {
                    try { startActivity(new Intent(Intent.ACTION_VIEW, target)); }
                    catch (android.content.ActivityNotFoundException ignored) { message("No app can open this link."); }
                } else message("LinguaBridge opens HTTPS websites.");
                return true;
            }

            @Override public void onPageStarted(WebView view, String url, android.graphics.Bitmap icon) {
                if (view != web) return;
                committed = false;
                pageFailed = false;
                reply = null;
                documentId = null;
                currentSite = siteOf(url);
                showingOriginal = false;
                address.setText(displayUrl(url));
                showPage();
                updateStatus(autoTranslate ? "loading" : "original");
            }

            @Override public void onPageCommitVisible(WebView view, String url) { commit(view, url); }
            @Override public void onPageFinished(WebView view, String url) { commit(view, url); }

            @Override public void doUpdateVisitedHistory(WebView view, String url, boolean isReload) {
                if (view == web && !address.hasFocus()) address.setText(displayUrl(url));
                updateNavigation();
            }

            @Override public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (view == web && request.isForMainFrame()) {
                    committed = false;
                    pageFailed = true;
                    reply = null;
                    updateStatus("error");
                }
            }

            @Override public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
                if (view != web) return true;
                content.removeView(view);
                view.destroy();
                reply = null;
                committed = false;
                documentId = null;
                createWebView();
                showHome();
                message("The page closed unexpectedly. You can reopen it.");
                return true;
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override public void onProgressChanged(WebView view, int value) {
                if (view != web || home.getVisibility() == View.VISIBLE) return;
                progress.setProgress(value);
                progress.setVisibility(value < 100 ? View.VISIBLE : View.GONE);
            }

            @Override public void onPermissionRequest(PermissionRequest request) { request.deny(); }
        });
        web.setDownloadListener((url, agent, disposition, mime, length) ->
            message("Downloads are unavailable in this version."));
        installTranslator();
    }

    private void installTranslator() {
        translationSupported = false;
        if (!WebViewFeature.isFeatureSupported(WebViewFeature.JS_INJECTION_IN_FRAME_AND_WORLD) ||
            !WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) return;
        try {
            String script = readTranslator();
            var world = WebViewCompat.getExecutionWorld(web, "LinguaBridge");
            // AndroidX accepts "*" for arbitrary websites. This binding exists only inside the
            // isolated world and the receiver checks the main frame and committed HTTPS origin.
            var origins = Collections.singleton("*");
            WebViewCompat.addWebMessageListener(web, BRIDGE, origins, world, this::receive);
            WebViewCompat.addJavaScriptOnEvent(web, script, WebViewCompat.INJECTION_EVENT_DOCUMENT_END, origins, world);
            translationSupported = true;
        } catch (IOException | RuntimeException ignored) {
            translationSupported = false;
        }
    }

    private String readTranslator() throws IOException {
        try (InputStream input = getAssets().open("page-translator.js");
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[8192];
            for (int size; (size = input.read(buffer)) != -1;) output.write(buffer, 0, size);
            return new String(output.toByteArray(), StandardCharsets.UTF_8);
        }
    }

    private void commit(WebView view, String url) {
        if (view != web || pageFailed || url == null || !url.equals(view.getUrl())) return;
        currentSite = siteOf(url);
        committed = currentSite != null;
        if (!address.hasFocus()) address.setText(displayUrl(url));
        if (reply == null && committed) {
            updateStatus(shouldTranslate() ? "translating" : "original");
            view.postDelayed(() -> {
                if (view == web && committed && reply == null && shouldTranslate() && url.equals(view.getUrl())) {
                    updateStatus("unavailable");
                }
            }, 4000);
        }
        updateNavigation();
    }

    private void receive(WebView view, WebMessageCompat message, Uri origin, boolean mainFrame, JavaScriptReplyProxy sender) {
        if (!translationSupported || view != web || !mainFrame || !committed ||
            currentSite == null || !currentSite.equals(siteOf(origin.toString())) ||
            !currentSite.equals(siteOf(view.getUrl())) || message.getType() != WebMessageCompat.TYPE_STRING) return;
        String payload = message.getData();
        if (payload == null || payload.length() > 256) return;
        try {
            JSONObject event = new JSONObject(payload);
            String id = event.optString("documentId");
            if (!id.matches("[a-f0-9]{32}")) return;
            String type = event.optString("type");
            if ("ready".equals(type)) {
                if (documentId != null && !documentId.equals(id)) return;
                documentId = id;
                reply = sender;
                sendSettings();
            } else if ("status".equals(type) && id.equals(documentId)) {
                updateStatus(event.optString("status"));
            }
        } catch (JSONException ignored) {
            // Messages are limited to the browser translation status protocol.
        }
    }

    private void sendSettings() {
        if (reply == null || !committed || !WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) return;
        try {
            JSONObject message = new JSONObject();
            message.put("documentId", documentId);
            message.put("enabled", shouldTranslate());
            message.put("source", sourceLanguage);
            reply.postMessage(message.toString());
        } catch (JSONException | IllegalStateException ignored) {
            reply = null;
        }
    }

    private boolean shouldTranslate() {
        return translationSupported && autoTranslate && activityVisible && !showingOriginal && currentSite != null &&
            !preferences.getBoolean("paused:" + currentSite, false) && home.getVisibility() != View.VISIBLE;
    }

    private void updateStatus(String state) {
        boolean browsing = home.getVisibility() != View.VISIBLE;
        if ("error".equals(state)) status.setText("Page couldn’t load");
        else if (!translationSupported) status.setText("Update Android System WebView to translate");
        else if (!autoTranslate) status.setText("Auto-translate off");
        else if (!browsing) status.setText("Auto-translate on · Ewondo");
        else if (currentSite != null && preferences.getBoolean("paused:" + currentSite, false)) status.setText("Translation paused for this site");
        else if (showingOriginal) status.setText("Showing original page");
        else switch (state) {
            case "loading", "translating" -> status.setText("Translating to Ewondo…");
            case "translated" -> status.setText("Translated to Ewondo");
            case "partial" -> status.setText("Some text translated · Ewondo");
            case "protected" -> status.setText("Original · Protected page");
            case "unavailable" -> status.setText("No supported phrases found");
            default -> status.setText("Auto-translate on · Ewondo");
        }
        boolean showAction = browsing && !pageFailed && translationSupported && autoTranslate &&
            (showingOriginal || "translated".equals(state) || "partial".equals(state));
        original.setVisibility(showAction ? View.VISIBLE : View.GONE);
        original.setText(showingOriginal ? "Translate again" : "Show original");
        translate.setEnabled(translationSupported);
    }

    private void showTranslationMenu(View anchor) {
        PopupMenu menu = new PopupMenu(this, anchor);
        menu.getMenu().add(autoTranslate ? "Turn off auto-translate" : "Turn on auto-translate").setOnMenuItemClickListener(item -> {
            if (autoTranslate) setAutoTranslate(false);
            else new AlertDialog.Builder(this).setTitle("Automatically translate to Ewondo?")
                .setMessage("LinguaBridge translates supported French and English phrases on your device. You can pause translation for any site.")
                .setNegativeButton("Cancel", null)
                .setPositiveButton("Turn on", (dialog, which) -> setAutoTranslate(true)).show();
            return true;
        });
        menu.getMenu().add("Source language").setOnMenuItemClickListener(item -> {
            String[] values = {"auto", "fr", "en"};
            int selected = "fr".equals(sourceLanguage) ? 1 : "en".equals(sourceLanguage) ? 2 : 0;
            new AlertDialog.Builder(this).setTitle("Source language")
                .setSingleChoiceItems(new String[]{"Automatic", "French", "English"}, selected, (dialog, index) -> {
                    sourceLanguage = values[index];
                    preferences.edit().putString("sourceLanguage", sourceLanguage).apply();
                    showingOriginal = false;
                    sendSettings();
                    dialog.dismiss();
                }).setNegativeButton("Cancel", null).show();
            return true;
        });
        if (currentSite != null && home.getVisibility() != View.VISIBLE) {
            String key = "paused:" + currentSite;
            boolean paused = preferences.getBoolean(key, false);
            menu.getMenu().add(paused ? "Resume for this site" : "Pause for this site").setOnMenuItemClickListener(item -> {
                preferences.edit().putBoolean(key, !paused).apply();
                showingOriginal = false;
                updateStatus(shouldTranslate() ? "translating" : "original");
                sendSettings();
                return true;
            });
        }
        menu.show();
    }

    private void setAutoTranslate(boolean enabled) {
        autoTranslate = enabled;
        showingOriginal = false;
        preferences.edit().putBoolean("autoTranslate", enabled).apply();
        updateStatus(shouldTranslate() ? "translating" : "original");
        sendSettings();
    }

    private void showBrowserMenu(View anchor) {
        PopupMenu menu = new PopupMenu(this, anchor);
        menu.getMenu().add("Home").setOnMenuItemClickListener(item -> { showHome(); return true; });
        menu.getMenu().add("Translation demo").setOnMenuItemClickListener(item -> { openUrl(DEMO); return true; });
        menu.show();
    }

    private void navigateBack() {
        if (home.getVisibility() == View.VISIBLE && web.getUrl() != null) {
            showPage();
            updateStatus("original");
            sendSettings();
        } else if (web.canGoBack()) web.goBack();
        else if (home.getVisibility() != View.VISIBLE) showHome();
        else finish();
    }

    @android.annotation.SuppressLint("GestureBackNavigation")
    @SuppressWarnings("deprecation")
    @Override public void onBackPressed() { navigateBack(); }

    private void showHome() {
        home.setVisibility(View.VISIBLE);
        web.setVisibility(View.INVISIBLE);
        address.clearFocus();
        address.setText("");
        progress.setVisibility(View.GONE);
        sendSettings();
        updateStatus("original");
        updateNavigation();
    }

    private void showPage() {
        home.setVisibility(View.GONE);
        web.setVisibility(View.VISIBLE);
        updateNavigation();
    }

    private void updateNavigation() {
        if (web == null) return;
        boolean onPage = home.getVisibility() != View.VISIBLE;
        back.setEnabled(onPage || web.getUrl() != null);
        forward.setEnabled(onPage && web.canGoForward());
        reload.setEnabled(onPage && web.getUrl() != null);
    }

    private void openAddress(String entry) {
        String input = entry.trim();
        if (input.isEmpty()) return;
        if (input.matches("(?i)^[a-z][a-z0-9+.-]*://.*") || input.startsWith("https:") || input.startsWith("http:")) {
            Uri parsed = Uri.parse(input);
            if (!isHttps(parsed)) { message("Enter an HTTPS address."); return; }
            openUrl(input);
        } else if (!input.contains(" ") && input.matches("[^/]+\\.[^/]+(?:/.*)?")) {
            openUrl("https://" + input);
        } else {
            openUrl("https://www.google.com/search?q=" + Uri.encode(input));
        }
    }

    private void openUrl(String url) {
        if (!isHttps(Uri.parse(url))) { message("Enter an HTTPS address."); return; }
        ((InputMethodManager) getSystemService(INPUT_METHOD_SERVICE)).hideSoftInputFromWindow(address.getWindowToken(), 0);
        address.clearFocus();
        address.setText(displayUrl(url));
        showPage();
        web.loadUrl(url);
    }

    private String displayUrl(String url) { return DEMO.equals(url) ? "Translation demo" : url; }
    private static boolean isHttps(Uri url) {
        return "https".equalsIgnoreCase(url.getScheme()) && url.getHost() != null && !url.getHost().isEmpty() &&
            url.getUserInfo() == null;
    }
    private static String siteOf(String url) {
        if (url == null) return null;
        Uri parsed = Uri.parse(url);
        if (!isHttps(parsed)) return null;
        int port = parsed.getPort();
        return "https://" + parsed.getHost().toLowerCase(Locale.ROOT) + (port == -1 || port == 443 ? "" : ":" + port);
    }

    private void message(String value) { Toast.makeText(this, value, Toast.LENGTH_SHORT).show(); }

    @Override protected void onStart() {
        super.onStart();
        activityVisible = true;
        sendSettings();
    }

    @Override protected void onStop() {
        activityVisible = false;
        sendSettings();
        super.onStop();
    }

    @Override protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        Bundle history = new Bundle();
        if (web.saveState(history) != null) out.putBundle("history", history);
    }

    @Override protected void onDestroy() {
        committed = false;
        reply = null;
        content.removeView(web);
        web.destroy();
        super.onDestroy();
    }

    private int dp(float value) { return Math.round(value * getResources().getDisplayMetrics().density); }

    private LinearLayout column(int color) {
        LinearLayout view = new LinearLayout(this);
        view.setOrientation(LinearLayout.VERTICAL);
        view.setBackgroundColor(color);
        return view;
    }

    private LinearLayout row() {
        LinearLayout view = new LinearLayout(this);
        view.setGravity(Gravity.CENTER_VERTICAL);
        return view;
    }

    private void addSpaced(LinearLayout parent, View child, int top) {
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(-1, -2);
        params.topMargin = dp(top);
        parent.addView(child, params);
    }

    private View divider() {
        View line = new View(this);
        line.setBackgroundColor(LINE);
        line.setLayoutParams(new LinearLayout.LayoutParams(-1, dp(1)));
        return line;
    }

    private TextView text(String value, int size, int color, boolean bold) {
        TextView label = new TextView(this);
        label.setText(value);
        label.setTextSize(size);
        label.setTextColor(color);
        if (bold) label.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        return label;
    }

    private Button action(String title, int color, int fill) {
        Button button = new Button(this);
        button.setAllCaps(false);
        button.setText(title);
        button.setTextColor(color);
        button.setTextSize(14);
        button.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        button.setMinHeight(dp(48));
        button.setMinimumHeight(dp(48));
        button.setMinWidth(0);
        button.setMinimumWidth(0);
        button.setPadding(dp(14), dp(8), dp(14), dp(8));
        button.setBackground(touchSurface(fill, 7));
        return button;
    }

    private Drawable border(int fill, int radius) {
        GradientDrawable shape = new GradientDrawable();
        shape.setColor(fill);
        shape.setCornerRadius(dp(radius));
        shape.setStroke(dp(1), LINE);
        return shape;
    }

    private Drawable touchSurface(int fill, int radius) {
        GradientDrawable shape = new GradientDrawable();
        shape.setColor(fill);
        shape.setCornerRadius(dp(radius));
        return new RippleDrawable(ColorStateList.valueOf(0x3312b82a), shape, null);
    }

    private final class BrowserIcon extends View {
        private final String icon;
        private final Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);

        BrowserIcon(String icon, String label, OnClickListener action) {
            super(BrowserActivity.this);
            this.icon = icon;
            setContentDescription(label);
            setFocusable(true);
            setBackground(touchSurface(WHITE, 8));
            setOnClickListener(action);
        }

        @Override public CharSequence getAccessibilityClassName() { return Button.class.getName(); }

        @Override protected void onDraw(Canvas canvas) {
            super.onDraw(canvas);
            float scale = dp(22) / 24f;
            canvas.save();
            canvas.translate((getWidth() - 24 * scale) / 2, (getHeight() - 24 * scale) / 2);
            canvas.scale(scale, scale);
            paint.setColor(isEnabled() ? INK : 0xff869187);
            paint.setStrokeWidth(1.9f);
            paint.setStrokeCap(Paint.Cap.ROUND);
            paint.setStyle(Paint.Style.STROKE);
            switch (icon) {
                case "back", "forward" -> {
                    if ("forward".equals(icon)) { canvas.translate(24, 0); canvas.scale(-1, 1); }
                    canvas.drawLine(5, 12, 20, 12, paint);
                    canvas.drawLine(5, 12, 11, 6, paint);
                    canvas.drawLine(5, 12, 11, 18, paint);
                }
                case "reload" -> {
                    canvas.drawArc(4, 4, 20, 20, -38, 312, false, paint);
                    canvas.drawLine(20, 5, 20, 10, paint);
                    canvas.drawLine(20, 10, 15, 10, paint);
                }
                default -> {
                    paint.setStyle(Paint.Style.FILL);
                    canvas.drawCircle(5, 12, 1.6f, paint);
                    canvas.drawCircle(12, 12, 1.6f, paint);
                    canvas.drawCircle(19, 12, 1.6f, paint);
                }
            }
            canvas.restore();
        }
    }
}
