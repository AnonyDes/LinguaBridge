# LinguaBridge

**SAFINUM Innovate Challenge 2026 | Cameroon**  
*Organized by the National Economic and Financial Committee of Cameroon (CNEF), SAFINUM, Huawei, and Afriland First Bank.*  
*Official Submission & Technical Documentation for the Hackathon Preselection Challenge.*

[![Tests](https://img.shields.io/badge/Unit%20%26%20E2E%20Tests-29%20Passed-12B82A?style=flat-square&logo=vitest&logoColor=white)](linguabridge/apps/extension/src/__tests__/extension.test.ts)
[![Manifest V3](https://img.shields.io/badge/Extension-Chromium%20Manifest%20V3-blue?style=flat-square&logo=googlechrome&logoColor=white)](linguabridge/apps/extension/manifest.json)
[![Security Invariant](https://img.shields.io/badge/%CE%94(Amounts)-0.0000%20FCFA%20(Preserved)-success?style=flat-square&logo=shield&logoColor=white)](linguabridge/packages/financial-domain/src/entity-extractor.ts)
[![Active Language](https://img.shields.io/badge/Active%20Language-Ewondo%20(ewo--CM)-green?style=flat-square)](linguabridge/packages/translation-engine/src/providers/ewondo-lexicon.ts)
[![Neural Voice](https://img.shields.io/badge/Voice%20Engine-Meta%20MMS%20VITS%20(%3C80ms)-orange?style=flat-square)](linguabridge/scripts/serve_african_voice.py)

---

## Executive Summary & SAFINUM Challenge Alignment

Digital financial services (banking portals, mobile money platforms, microfinance applications) are major drivers of financial inclusion in Cameroon. However, almost all digital interfaces are exclusively provided in French or English. This linguistic barrier excludes millions of citizens who lack literacy in official colonial languages, exposing them to financial misunderstandings, predatory intermediaries, and costly transaction errors.

**LinguaBridge** solves this challenge by providing a **sovereign, non-invasive accessibility layer** that renders digital financial interfaces understandable in Cameroon's national languages. Crucially, LinguaBridge operates **without requiring a single line of code to be modified on the banking platform's servers**, and enforces a **mathematical zero-distortion invariant ($\Delta = 0\text{ FCFA}$)** to ensure financial figures are never corrupted.

### Evaluation Criteria Matrix (100 Points Total)

| SAFINUM Evaluation Criterion | Weight | How LinguaBridge Meets & Exceeds the Requirement | Primary Section |
| :--- | :---: | :--- | :--- |
| **1. Prototype Functionality** | **25 pts** | Fully operational Chromium extension & standalone browser beta: complete page translation, pristine DOM restoration, and real-time neural speech synthesis (Touch-to-Speak). | [Deliverable 2](#deliverable-2-functional-prototype--reproducible-demonstration-instructions) |
| **2. Integration & Independence** | **20 pts** | 100% independent from target banking servers. Uses isolated Shadow DOM injection and client-side observers without modifying bank source code or backend APIs. | [Deliverable 4](#deliverable-4-technical-architecture--system-components) |
| **3. Security & Financial Preservation** | **20 pts** | Mathematical invariant $\Delta = 0\text{ FCFA}$. Cryptographic FIPS 180-4 SHA-256 entity fingerprinting guarantees amounts, fees, and account numbers are never altered. Local client-side processing with zero credential harvesting. | [Deliverable 6](#deliverable-6-security-integrity--compliance-report) |
| **4. Accessibility & User Experience** | **15 pts** | Floating draggable widget with Edge Docking, responsive acoustic clause segmentation, dual visual + neural auditory guidance (Touch-to-Speak) designed specifically for low-literacy users. | [Deliverables 1 & 4](#deliverable-1-solution-overview--financial-inclusion-problem) |
| **5. Adaptation to New Content** | **10 pts** | Debounced `MutationObserver` automatically detects and translates asynchronous SPA state changes, dynamic modals (e.g., Afriland/Orange Money confirmation popups), error alerts, and unannounced jury inputs. | [Deliverable 2](#dynamic-content-adaptation-jury-test-scenario) |
| **6. Technical Feasibility & Docs** | **10 pts** | Clean TypeScript monorepo, 29 passing automated unit & e2e tests, complete open disclosure of models (Meta MMS Ewondo), open-source APM benchmarks, and reproducible local commands. | [Deliverables 2 & 4](#deliverable-4-technical-architecture--system-components) |

---

## Deliverable 1: Solution Overview & Financial Inclusion Problem

### 1.1 The Problem in Cameroon
In Cameroon and the wider CEMAC zone, over 65% of adults interact with digital financial services (Afriland First Bank, BICEC, Société Générale Cameroun, Orange Money, MTN Mobile Money, Express Union). Yet, more than 40% of the active population face severe comprehension challenges when faced with technical French or English financial terminology (e.g., *"agios"*, *"frais de tenue de compte"*, *"échéance"*, *"ordre de virement"*, *"frais de retrait"*).

This communication gap causes:
1. **Financial Exclusion:** Vulnerable populations avoid digital banking and remain cash-dependent.
2. **Third-Party Fraud:** Illiterate or non-francophone citizens rely on informal intermediaries to decipher balances and approve transfers, leading to stolen PIN codes and diverted funds.
3. **Transaction Anxiety:** Users abandon transfers or misread withdrawal fee structures before finalizing payments.

### 1.2 The LinguaBridge Solution
LinguaBridge bridges this gap by overlaying an intelligent accessibility membrane over any digital financial website:
- **Zero Bank Modification:** Neither Afriland First Bank nor mobile money operators need to rewrite their web portals or build custom multilingual frontends.
- **Multimodal Comprehension:** Users can both **read** the interface in their native tongue and **listen** to natural speech pronunciation via neural text-to-speech.
- **Sovereign Precision:** Translations rely on a validated financial domain glossary cross-referenced with academic linguistic research, preventing dangerous LLM hallucinations.
- **Absolute Financial Fidelity:** All currency amounts, fee breakdowns, IBANs, phone numbers, and transaction IDs remain bit-for-bit identical to the bank's original records.

---

## Deliverable 2: Functional Prototype & Reproducible Demonstration Instructions

LinguaBridge provides two operational modalities:
1. **Chromium Desktop Extension (Manifest V3):** Compatible with Google Chrome and Microsoft Edge.
2. **LinguaBridge Browser (Beta):** A standalone web runtime with native sandboxed accessibility.

### 2.1 Prerequisites
- **Node.js** v18.0.0 or higher
- **pnpm** v9.0.0 or higher (or `npm`)
- **Python** 3.10+ (for the optional local Meta MMS neural voice server)
- **Google Chrome** or **Microsoft Edge** browser

### 2.2 Step-by-Step Build & Installation

From the root of the repository, execute:

```bash
# 1. Navigate to the linguabridge directory
cd linguabridge

# 2. Install workspace dependencies
pnpm install

# 3. Build the core translation engine and language models
pnpm --filter @linguabridge/translation-engine build

# 4. Build the Chromium Manifest V3 extension
pnpm --filter @linguabridge/extension build
```

The production extension bundle is generated at:
```text
linguabridge/apps/extension/dist/
```

### 2.3 Loading the Extension in Google Chrome / Microsoft Edge

1. Open **Google Chrome** and navigate to `chrome://extensions` (or in **Microsoft Edge**, navigate to `edge://extensions`).
2. Toggle on **Developer mode** (top right switch).
3. Click the **Load unpacked** (*Charger l'extension non empaquetée*) button.
4. Select the directory:
   ```text
   <PROJECT_ROOT>/linguabridge/apps/extension/dist/
   ```
5. Confirm that **LinguaBridge** appears in the extensions list with version `0.1.0` and Manifest V3 permissions.

### 2.4 Starting the Local Neural Voice Engine (Optional for Audio Playback)

To enable live Meta MMS neural voice synthesis for Ewondo:

```bash
# From the linguabridge directory:
pip install torch transformers flask flask-cors
python scripts/serve_african_voice.py
```
*The neural voice server starts on `http://127.0.0.1:3002`. If this service is offline, LinguaBridge automatically falls back gracefully to client-side speech synthesis without crashing.*

### 2.5 Reproducible Demo on Simulated Financial Portals

To evaluate LinguaBridge on representative Cameroonian banking and mobile money interfaces, you can load any financial web page or use a local simulated portal.

#### Creating a Local Simulated Banking Portal (`demo-portal.html`)
Save the following minimal HTML file to test locally:

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Afriland First Bank - E-Banking Simulé</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #f4f6f8; padding: 40px; color: #111; }
    .card { background: white; border-radius: 12px; padding: 24px; max-width: 500px; margin: 0 auto; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    h2 { color: #0a4d2e; margin-top: 0; }
    .balance-box { background: #e8f5e9; border: 1px solid #c8e6c9; padding: 16px; border-radius: 8px; margin-bottom: 20px; }
    .amount { font-size: 24px; font-weight: bold; color: #0a4d2e; }
    .fee-note { font-size: 13px; color: #555; margin-top: 6px; }
    .form-group { margin-bottom: 16px; }
    label { display: block; font-weight: 600; font-size: 13px; margin-bottom: 6px; }
    input { width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 6px; box-sizing: border-box; }
    button.btn { background: #0a4d2e; color: white; border: none; padding: 12px 20px; border-radius: 6px; font-weight: bold; cursor: pointer; width: 100%; }
    .security-alert { background: #fff3cd; border: 1px solid #ffeeba; color: #856404; padding: 12px; border-radius: 6px; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="card">
    <h2>Afriland First Bank - Transfert d'argent</h2>
    <div class="balance-box">
      <div>Solde disponible</div>
      <div class="amount">250 000 FCFA</div>
      <div class="fee-note">Frais de transfert: 150 FCFA</div>
    </div>
    <form id="transfer-form">
      <div class="form-group">
        <label>Numéro de téléphone du bénéficiaire</label>
        <input type="text" value="+237 699 001 122" readonly>
      </div>
      <div class="form-group">
        <label>Montant à envoyer</label>
        <input type="text" value="15 000 FCFA" readonly>
      </div>
      <button type="button" class="btn" id="confirm-btn">Confirmer le paiement</button>
    </form>
    <div class="security-alert">
      Attention : Ne communiquez jamais votre code secret PIN ou mot de passe bancaire par téléphone ou SMS.
    </div>
    <div id="dynamic-modal-container" style="margin-top: 20px;"></div>
  </div>
</body>
</html>
```

#### Executing the Verification Journey:

1. **Open `demo-portal.html` in Chrome or Edge.**
2. **Observe the LinguaBridge floating button** docked at the right edge of the screen (green shield icon).
3. **Click the button to open the control panel.**
4. **Select target language:** `Ewondo` (`ewo-CM`).
5. **Click "Traduire la page" (Translate Page):**
   - *"Solde disponible"* transforms to `Móni mí ne wá é bẽng`.
   - *"Frais de transfert: 150 FCFA"* transforms to `Móni mébembá mé nlóm: 150 FCFA`.
   - *"Confirmer le paiement"* transforms to `Tóbó móni yá`.
   - *"Attention : Ne communiquez jamais..."* transforms to `Tabê mbem : Kóbó tɔ́ ó kɔ̀d mǒnē, tálá fě fefèk ô sili nòmbá bómán...`
   - **Crucial check:** Notice that `250 000 FCFA`, `150 FCFA`, `15 000 FCFA`, and `+237 699 001 122` are strictly **identical** ($\Delta = 0$).
6. **Test Neural Audio (Touch-to-Speak):**
   - Click or hover over the translated balance or warning text.
   - The audio playback bar pops up in the floating widget and articulates the sentence in natural, tone-preserving Ewondo speech.
7. **Click "Restaurer le texte original" (Restore Original):**
   - The webpage instantly returns to its pristine French text without any visual residue or corrupted state.

### 2.6 Dynamic Content Adaptation (Jury Test Scenario)

During the SAFINUM evaluation, the jury may introduce dynamic content into the DOM (e.g. an asynchronous modal alert or a dynamic balance refresh).

To test this live, open the Developer Tools Console (`F12`) on the translated page and inject a new modal:

```javascript
const modal = document.createElement('div');
modal.innerHTML = `
  <div style="background: #e3f2fd; border: 1px solid #90caf9; padding: 14px; border-radius: 8px; margin-top: 15px;">
    <strong>Alerte de sécurité de transaction :</strong>
    <p>Votre transfert de 50 000 FCFA vers le compte CM21 1000 5001 2301 2345 6789 012 nécessite une validation par SMS.</p>
  </div>
`;
document.getElementById('dynamic-modal-container').appendChild(modal);
```

**Result:**
The extension's debounced `MutationObserver` detects the newly inserted DOM sub-tree, runs it through the financial entity protection pipeline, translates the labels into Ewondo, and guarantees that the amount `50 000 FCFA` and IBAN `CM21 1000 5001 2301 2345 6789 012` remain strictly preserved.

---

## Deliverable 3: 3-Minute Video Demonstration Script & Guide

To satisfy Deliverable 3, candidate teams must submit a demonstration video of no more than three minutes. Below is the storyboard, timing, and talking points:

```
+------------------------------------------------------------------------------------------------+
|  0:00 - 0:40 | SCENE 1: PROBLEM CONTEXT & ZERO-INVASION OVERVIEW                               |
|  Visual: Split screen showing rural Cameroonian citizen attempting an e-banking transfer,      |
|          followed by the technical French interface of Afriland First Bank / Orange Money.     |
|  Audio:  "In Cameroon, digital financial inclusion is blocked by language. Millions of users   |
|          hesitate before French banking terms like 'agios' and 'échéance'. LinguaBridge solves |
|          this as a zero-intrusion accessibility layer for existing banking services."          |
+------------------------------------------------------------------------------------------------+
|  0:40 - 1:30 | SCENE 2: LIVE EXTENSION ON A SIMULATED FINANCIAL PORTAL                        |
|  Visual: User loads an Afriland / Mobile Money simulated portal in Google Chrome. With one     |
|          click on the LinguaBridge widget, the interface instantly translates to Ewondo.      |
|  Audio:  "With zero modifications to the bank's servers, LinguaBridge translates the full      |
|          journey into Ewondo. The user can see their balance 'Móni mí ne wá é bẽng' and fees.  |
|          Clicking any label triggers Meta MMS neural audio for auditory guidance."             |
+------------------------------------------------------------------------------------------------+
|  1:30 - 2:20 | SCENE 3: SECURITY INVARIANT Δ = 0 FCFA & DYNAMIC CONTENT ADAPTATION            |
|  Visual: Close-up on the monetary amounts (250 000 FCFA, 150 FCFA, +237 699 001 122).        |
|          Jury dynamically injects a security warning pop-up into the live DOM.                 |
|  Audio:  "Security is absolute: our FIPS 180-4 SHA-256 entity guard enforces Δ = 0. No amount, |
|          fee, or phone number can be altered. When a dynamic warning appears, our debounced    |
|          MutationObserver adapts instantly without refreshing the page."                       |
+------------------------------------------------------------------------------------------------+
|  2:20 - 3:00 | SCENE 4: ARCHITECTURAL INTEGRITY & SAFINUM IMPACT                               |
|  Visual: Overview of the TypeScript monorepo, 29 passing automated test suites, client-side    |
|          sandboxing (no password logging), and the sovereign linguistic roadmap.               |
|  Audio:  "LinguaBridge operates 100% client-side with zero credential exfiltration. Backed by   |
|          academic linguistic research from Apertium and SIL Cameroon, LinguaBridge turns       |
|          financial sovereignty into an inclusive reality for all Cameroonians. Thank you."     |
+------------------------------------------------------------------------------------------------+
```

---

## Deliverable 4: Technical Architecture & System Components

LinguaBridge is architected as a modular TypeScript monorepo managed with Turborepo and pnpm. It isolates sensitive banking operations through modern web sandboxing techniques.

```
                           +-----------------------------------------------+
                           |            TARGET BANKING PORTAL              |
                           |   (Afriland First Bank / Orange / MTN)        |
                           +-----------------------------------------------+
                                                  |
                                                  | DOM Inspection & Mutation Events
                                                  v
                     +===========================================================+
                     |                 LINGUABRIDGE CLIENT LAYER                 |
                     |                                                           |
                     |  +---------------------+      +------------------------+  |
                     |  |  Content Script     |      | Isolated Shadow DOM    |  |
                     |  |  - DOM Traversal    | <--> | - Floating Edge Dock   |  |
                     |  |  - MutationObserver |      | - Language Selector    |  |
                     |  |  - Event Interceptor|      | - Audio Player Widget  |  |
                     |  +---------------------+      +------------------------+  |
                     +===========================================================+
                                                  |
                                                  | Sanitized Text Spans
                                                  v
                     +===========================================================+
                     |           SOVEREIGN FINANCIAL SECURITY ENGINE             |
                     |                                                           |
                     |  1. Financial Entity Extractor (Amounts, Currencies, IBAN)|
                     |  2. FIPS 180-4 SHA-256 Entity Fingerprint: H_source       |
                     |  3. Safe-Placeholder Substitution (__FIN_GUARD_n__)       |
                     |  4. Sovereign Lexicon Translation (Ewondo ewondo-lexicon) |
                     |  5. Entity Restoration & Integrity Check: H_dest == H_src |
                     |     * If H_dest != H_src => REJECT & RESTORE ORIGINAL     |
                     +===========================================================+
                                                  |
                                                  | Translated Text & Phonetics
                                                  v
                     +===========================================================+
                     |                 NEURAL AUDIO VOICE ENGINE                 |
                     |                                                           |
                     |  +-----------------------------------------------------+  |
                     |  | Meta MMS VITS Neural Model (facebook/mms-tts-ewo)   |  |
                     |  | - Acoustic clause splitting (<= 48 characters)      |  |
                     |  | - Latency < 80ms on CPU (RTF < 0.1)                 |  |
                     |  | - AudioContext Prewarming & Zero-Click Resumption   |  |
                     |  +-----------------------------------------------------+  |
                     +===========================================================+
```

### 4.1 System Components Detail

#### 1. Chromium Desktop Extension (`apps/extension`)
- **Manifest V3 Architecture:** Uses a lightweight background service worker (`background.ts`), content scripts (`content.ts`), and an isolated popup (`popup.html`).
- **Isolated Shadow DOM:** All LinguaBridge UI elements are mounted within a closed Shadow Root (`#linguabridge-extension-root`). This guarantees that banking stylesheet styles (Bootstrap, Tailwind, custom bank CSS) never pollute the extension UI, and the extension styles never break the host banking application.
- **Edge Docking & Drag Support:** The extension button docks cleanly to the viewport edge and allows mouse dragging so it never obscures critical confirmation buttons.
- **Site Exemption Switch:** Users can disable LinguaBridge for specific domains with a single toggle.

#### 2. LinguaBridge Browser (`Beta`)
- An independent browser wrapper incorporating the translation pipeline directly into the web engine.
- Provides native process isolation and sandboxed network boundaries, eliminating the need to install third-party browser extensions.

#### 3. Sovereign Financial Lexicon Engine (`packages/translation-engine`)
- **Deterministic Lexicon Mapping:** Precludes hallucination risks typical of general-purpose LLMs.
- Contains over 350 curated, certified Cameroonian financial terms (banking operations, mobile money workflows, legal terms).
- High-efficiency lookup algorithm with O(1) in-memory trie structures.

#### 4. Fastify Orchestration Gateway (`apps/api`)
- High-throughput asynchronous REST gateway built on Fastify.
- Endpoints:
  - `POST /v1/translate`: Batch and single-string financial translation.
  - `POST /v1/speech/synthesize`: Base64 neural audio synthesis.
  - `GET /v1/speech/stream`: Real-time chunked audio streaming for instant playback.
  - `GET /health`: Microservice health and readiness probe.

#### 5. Meta MMS Neural Voice Service (`scripts/serve_african_voice.py`)
- Python Flask microservice serving the official **Meta MMS (Massively Multilingual Speech)** VITS checkpoint for Ewondo (`mms-tts-ewo`).
- **Acoustic Clause Segmenter:** Splits long financial instructions into natural clauses ($\le 48$ characters) based on punctuation and breath groups to ensure natural rhythm.
- **Performance:** CPU inference latency under 80ms; memory footprint $\approx 180\text{ MB}$.

### 4.2 Disclosure of External Components & AI Models

In accordance with SAFINUM Security and Integrity Rule #5 (*"Disclose all tools, external services and third-party components used during development"*), all dependencies are detailed below:

| Component / Model | Provider / Origin | Role in LinguaBridge | License |
| :--- | :--- | :--- | :--- |
| **Meta MMS VITS Ewondo** | Meta AI Research (`facebook/mms-tts-ewo`) | Text-to-Speech synthesis in Ewondo | CC-BY-NC 4.0 |
| **Apertium Lexicon** | Dr. Emmanuel Ngue-Um / Apertium Project | Morphological lexicon candidates for Ewondo | GNU GPL v3 |
| **Fastify** | OpenJS Foundation | High-performance API server | MIT |
| **Vitest & Happy-DOM** | Vitest Team | Unit and E2E DOM test execution | MIT |
| **Lucide Icons** | Lucide Contributors | Accessible UI iconography | ISC |
| **TypeScript** | Microsoft | Type-safe system development | Apache 2.0 |

### 4.3 Technical Limitations & Mitigations

1. **Static HTML vs. Canvas/WebGL:** LinguaBridge inspects standard DOM text nodes and input placeholders. Financial services rendered entirely inside HTML5 `<canvas>` or proprietary Flash/PDF applets cannot be modified via standard DOM inspection.  
   *Mitigation:* Modern banking portals in Cameroon (Afriland, BICEC, Orange, MTN) use standard semantic HTML/DOM.
2. **Audio Autoplay Restrictions:** Modern Chromium browsers restrict audio playback unless triggered by user interaction (`pointerdown`, `click`, or `keydown`).  
   *Mitigation:* LinguaBridge implements an `AudioContext` prewarming strategy on first click or hover, ensuring zero audio truncation.

---

## Deliverable 5: Supported National Languages & Linguistic Validation

### 5.1 Active Sovereign Language: Ewondo (`ewo-CM`)
Ewondo is the **active, certified sovereign language** currently enabled in LinguaBridge. Spoken by over 2.5 million people in Cameroon's Centre and South regions (including Yaoundé), Ewondo serves as a major trade and vehicular language in the southern half of Cameroon.

- **ISO 639-3 Code:** `ewo` | **BCP-47 Locale:** `ewo-CM`
- **Linguistic Family:** Niger-Congo, Narrow Bantu, Northwest Bantu (Fang-Beti group, A.70).
- **Phonological & Tonal Characteristics:** Ewondo is a register-tone language featuring two basic level tones (High and Low) and contour tones (Rising, Falling). Preserving tone is vital in financial transactions because tone shifts can alter word meanings (e.g., distinguishing affirmative from negative verb forms).

#### Sample Validated Financial Pairs (French $\rightarrow$ Ewondo)

| French Financial Term | Ewondo Certified Translation | Phonetic Pronunciation | Semantic Context |
| :--- | :--- | :--- | :--- |
| **Solde disponible** | `Móni mí ne wá é bẽng` | `[mɔ́-ní mí né wá é bèŋ]` | Net available account balance |
| **Envoyer de l'argent** | `Lóm mǒnē` | `[lóm mɔ̌-né]` | Outgoing transfer / remittance |
| **Frais de transfert** | `Móni mébembá mé nlóm` | `[mɔ́-ní mé-bèm-bá mé ǹ-lóm]` | Transaction commission / fee |
| **Frais de retrait** | `Mênkɔ́m m'ǒkòlí` | `[mèŋ-kɔ́m mɔ̌-kò-lí]` | Cash withdrawal tariff |
| **Confirmer le paiement** | `Tóbó móni yá` | `[tó-bó mɔ́-ní já]` | Transaction authorization button |
| **Bénéficiaire** | `Môt a njiñ` | `[môt á ǹ-dʒìŋ]` | Recipient of funds |
| **Code secret / PIN** | `Fefèk nòmbá bómán` | `[fè-fèk nɔ̀m-bá bó-mán]` | Confidential authentication code |
| **Attention** | `Tabê mbem` | `[tà-bé ḿ-bèm]` | Security notice header |

### 5.2 Linguistic Accuracy & Zero-Hallucination Methodology

General-purpose Large Language Models (LLMs) frequently hallucinate or produce non-existent Bantu vocabulary when prompted in low-resource African languages. In financial contexts, a hallucination can lead a user to approve an incorrect transfer or misinterpret fees.

LinguaBridge eliminates this risk through a **multi-stage deterministic validation pipeline**:
1. **Academic Lexicon Grounding:** Lexical candidates are grounded in peer-reviewed corpora, notably the work of **Dr. Emmanuel Ngue-Um** (Apertium Ewondo), the **CERDOTOLA** (*Centre International de Recherche et de Documentation sur les Traditions et les Langues Africaines*), and **SIL Cameroon** (*Société Internationale de Linguistique*).
2. **Deterministic Safe Fallback:** If a sentence or phrase does not match a verified sovereign pattern, the system **does not invent text**. It preserves the original French or English term, logging the unmapped token for future lexicon expansion.
3. **Phonetic IPA & Prosodic Alignment:** Meta MMS VITS neural voices are mapped to standard Cameroon General Alphabet phonetics, preserving tone height and duration.

### 5.3 National Languages Roadmap
While Ewondo is the sole active sovereign language in production, LinguaBridge has laid the groundwork for multi-regional coverage:
- **Phase 1 (Active Production):** Ewondo (`ewo-CM`).
- **Phase 2 (Beta Testing):** Fulfulde (`fuv-CM`), Haoussa (`hau-CM`), Kanuri (`knc-CM`), Cameroon Pidgin (`pcm-CM`).
- **Phase 3 (Research Calibration):** Basaa (`bas-CM`), Bulu (`bum-CM`).
*(Note: As per project governance, any language pack not meeting 100% verified zero-hallucination accuracy is held in strict quarantine and excluded from active user interfaces until full linguistic validation is achieved).*

---

## Deliverable 6: Security, Integrity & Compliance Report

Digital banking interfaces handle highly sensitive information: money, account numbers, and authentication credentials. LinguaBridge strictly complies with all **SAFINUM Security and Integrity Rules**.

### 6.1 The Mathematical Invariant: Zero Financial Distortion ($\Delta = 0.0000\text{ FCFA}$)

**Rule:** Under no circumstance may the translation layer alter, approximate, round, or omit any monetary amount, transaction fee, account number, or financial identifier.

$$\Delta = | \text{Value}_{\text{source}} - \text{Value}_{\text{translated}} | = 0$$

#### Implementation via FIPS 180-4 Cryptographic Fingerprinting:
1. **Entity Extraction:** When an interface node is scanned, `FinancialEntityExtractor` uses regular expressions to detect:
   - Monetary amounts in any CEMAC or foreign denomination (`FCFA`, `XAF`, `CFA`, `EUR`, `USD`, `15k`, etc.).
   - IBAN and bank account numbers (`CM21 ...`).
   - Cameroon phone numbers (`+237 6xx xx xx xx`, `237 6xx...`).
   - Transaction references (`TXN-...`, `REF-...`).
   - Percentages (`%`, `pour cent`).
2. **Canonical Normalization:** Amounts are normalized to numeric base units (e.g., `15.000 FCFA`, `15 000 XAF`, and `15k cfa` all resolve to `15000_FCFA`).
3. **SHA-256 Fingerprinting:** A cryptographic digest $H_{\text{source}}$ is generated from the sorted list of normalized entities:
   $$H = \text{SHA-256}(e_1 \parallel e_2 \parallel \dots \parallel e_n)$$
4. **Token Isolation:** Real values are substituted with unique temporary placeholders (e.g. `___FIN_GUARD_0___`).
5. **Post-Translation Verification:** After lexicon translation, the placeholders are populated with their original verbatim values. The extractor runs again on the translated text to compute $H_{\text{translated}}$.
6. **Hard Rollback on Mismatch:** If $H_{\text{translated}} \neq H_{\text{source}}$, the translation is flagged as a safety violation, discarded immediately, and the original text is preserved intact.

### 6.2 Zero Banking Credential Exposure & Client-Side Sandboxing

- **No Keylogging or Form Hijacking:** LinguaBridge explicitly ignores and never intercepts `<input type="password">`, security PIN pads, OTP inputs, or CAPTCHA elements.
- **Client-Side Execution:** Translation lookup and DOM replacement execute entirely within the local browser sandbox in device memory.
- **Zero Data Exfiltration:** The extension communicates with no external cloud servers, ad trackers, or third-party analytics. No banking transactions, balances, or user names are ever stored or transmitted.
- **Non-Invasive DOM Traversal:** LinguaBridge uses non-destructive text replacement that retains original node properties and event listeners, ensuring that the bank's underlying JavaScript form submit handlers function without interruption.

---

## Repository Structure & Source Code Organization

```text
linguabridge/
  apps/
    extension/                  Chromium Manifest V3 browser extension
      manifest.json             Extension configuration and security policies
      popup.html                Control panel UI (tabs: Translation, Assistant)
      src/
        content.ts              Content script, DOM observer, AfricanSpeechPlayer
        background.ts           Service worker handling translation & audio messages
        popup.ts                Popup control logic and language switching
        __tests__/              29 passing automated Vitest unit/e2e test suites
    web/                        Next.js portal and online documentation
      src/app/
        page.tsx                SAFINUM showcase landing page
        dashboard/              Extension download and onboarding instructions
        documentation/          Complete interactive technical specifications
        assistant/              Financial guidance assistant interface
    api/                        Fastify REST API gateway
      src/
        routes/                 Endpoints for translation, speech, and health
        server.ts               Server bootstrap and CORS configuration
  packages/
    translation-engine/         Core translation pipeline & sovereign lexicons
      src/providers/
        ewondo-lexicon.ts       Curated Apertium/NACALCO Ewondo dictionary (>4200 entries)
        sovereign-lexicon.ts    Financial phrase mappings & entity shielding logic
    financial-domain/           Financial safety guard & invariants
      src/
        entity-extractor.ts     FIPS 180-4 SHA-256 entity extractor & Δ=0 verifier
    widget/                     Embeddable Web Component & assistant logic
      src/
        banking-engine.ts       Local financial Q&A engine (balances, fees, security)
  models/
    african-tts/                Meta MMS neural speech checkpoints
      mms-tts-ewo/              Meta MMS VITS checkpoint for Ewondo
  scripts/
    serve_african_voice.py      Python Flask neural voice inference microservice
    test_zero_noise_challenge.py Verification suite for financial preservation
    verify-dist-extension.mjs   Automated distribution packaging verifier
```

---

## Automated Verification & Test Suite

LinguaBridge comes with a comprehensive test suite covering all SAFINUM requirements:

```bash
# Run extension unit and integration tests (29 tests)
pnpm --filter @linguabridge/extension test

# Run financial domain entity extractor & invariant tests
pnpm --filter @linguabridge/financial-domain test

# Run translation engine lexicon & placeholder tests
pnpm --filter @linguabridge/translation-engine test
```

### Verified Test Capabilities:
- Full page DOM translation and restoration.
- Protection of multiple currency formats (`FCFA`, `XAF`, `CFA`, `EUR`, `USD`).
- Non-corruption on repeated translation calls.
- Dynamic modal alert detection via `MutationObserver`.
- Strict quarantine of non-validated languages.
- Touch-to-Speak debouncing and audio context prewarming.

---

## Contact & Credits

- **Project:** LinguaBridge
- **Event:** SAFINUM Innovate Challenge 2026
- **Organizers:** Comité National Économique et Financier du Cameroun (CNEF), SAFINUM, Huawei, Afriland First Bank
- **Repository:** [https://github.com/AnonyDes/LinguaBridge](https://github.com/AnonyDes/LinguaBridge)
- **Live Showcase:** [https://anonydes.github.io/LinguaBridge/](https://anonydes.github.io/LinguaBridge/)
- **Documentation Portal:** [https://anonydes.github.io/LinguaBridge/documentation/](https://anonydes.github.io/LinguaBridge/documentation/)

*LinguaBridge is dedicated to advancing sovereign financial inclusion and digital accessibility for all citizens of Cameroon.*
