# Research & Reference Repositories

## 1. Executive Summary

LinguaBridge addresses a foundational barrier in Central African financial technology: while mobile money (MTN Mobile Money, Orange Money, Express Union) and digital microfinance are the primary channels of financial inclusion in Cameroon, software interfaces, web banking portals, and customer agreements remain almost exclusively in French or English. 

In a country of over 250 indigenous languages, large segments of the population—especially rural smallholders, market traders, and tontine members—face language-induced financial exclusion. Generic machine translation systems (Google Translate, DeepL) lack adequate parallel data for Cameroonian languages, fail to account for tonal orthography, and introduce unacceptable hallucination risks on numerical quantities and currency amounts.

This research document analyzes key open-source reference repositories, NLP frameworks, and datasets that informed LinguaBridge's architecture.

---

## 2. Key Reference Repositories & Initiatives

### 2.1 Masakhane Research Foundation
- **Repositories**: `masakhane-io/masakhane-mt`, `masakhane-io/afriqa`
- **Relevance**: Pioneer of participatory research for African languages. Developed standard benchmark splits, African language tokenizers, and parallel corpora for sub-Saharan languages.
- **Architectural Takeaway**: Participatory dataset curation with native speakers is mandatory. Unverified scraping or generic synthetic translation introduces severe grammatical and dialectal skew.
- **LinguaBridge Adoption**: Language pack lifecycle requires explicit community and linguist review before activation (`not_installed` -> `under_review` -> `production_approved`).

### 2.2 Meta AI — NLLB-200 (No Language Left Behind)
- **Repository**: `facebookresearch/fairseq/tree/nllb`
- **Relevance**: Evaluated multilingual translation across 200 languages, including Adamawa Fulfulde (`fuv_Latn`) and Lingala (`lin_Latn`).
- **Limitations for Fintech**:
  1. *Numerical Instability*: Generic seq2seq transformers frequently drop digits, misplace decimal separators, or fail to preserve currency designations (e.g. converting `50 000 FCFA` into `500 CFA` or `5000 USD`).
  2. *Tone and Dialectal Misalignment*: Standard Cameroon Bantu languages (Ewondo, Duala, Basaa) exhibit contrastive tonal systems (high, low, falling, rising) that determine grammatical aspect and semantic negation. NLLB lacks tone-annotated models for these variants.
- **LinguaBridge Adoption**: Multi-tier routing where NLLB acts strictly as an unprivileged, sandboxed translation generator whose output is validated against deterministic Abstract Syntax Tree (AST) financial guards before reaching the user.

### 2.3 Mozilla Common Voice & Open-Source Speech Initiatives
- **Repositories**: `common-voice/common-voice`, `coqui-ai/TTS`
- **Relevance**: Crowd-sourced speech dataset initiative.
- **Acoustic Reality in Central Africa**: As of 2026, certified speech synthesis (TTS) models for Ewondo, Duala, and Basaa do not exist in stable production quality. Attempting to pass local Bantu text through French or English text-to-speech acoustic synthesizers yields unintelligible, culturally insensitive phonetic output.
- **LinguaBridge Adoption**: Degrade-First Speech Orchestration (ADR-004). The platform strictly refuses to synthesize audio for unsupported languages, rejecting cross-lingual acoustic substitution.

### 2.4 Apache Fineract & Mojaloop Foundation
- **Repositories**: `apache/fineract`, `mojaloop/mojaloop`
- **Relevance**: Global open-source standards for core banking and interoperable payment switches.
- **Fintech Guard Lessons**: Financial transactions must obey strict transactional idempotency, zero-drift entity preservation, and audit logging. 

---

## 3. Linguistic Breakdown: Target Cameroonian Languages

| Language | ISO 639-3 | Family | Primary Region | Socioeconomic Context |
| :--- | :--- | :--- | :--- | :--- |
| **Ewondo** | `ewo` | Bantu (A70, Beti-Pahuin) | Centre (Yaoundé), South | Major lingua franca for trade, agriculture, and market tontines across the Centre region. |
| **Duala** | `dua` | Bantu (A20, Sawabantu) | Littoral (Douala), South-West | Historical coastal mercantile language; crucial for commercial hubs and maritime trade. |
| **Basaa** | `bas` | Bantu (A40, Mbam-Basaa) | Littoral (Sanaga-Maritime), Centre | Key industrial and agrarian communities along the Douala-Yaoundé economic axis. |
| **Fulfulde** | `fuv` | Senegambian (Niger-Congo) | Far North, North, Adamaoua | Dominant regional trade language across northern Cameroon, cattle markets, and cross-border trade with Chad/Nigeria. |
| **Bulu** | `bum` | Bantu (A70, Beti-Pahuin) | South | Vital for southern agricultural cooperatives, forestry, and border markets with Gabon and Equatorial Guinea. |

---

## 4. Architectural Synthesis

1. **Deterministic Guard vs Probabilistic Model**: Generative AI and neural MT cannot be trusted with monetary values. LinguaBridge decouples translation from numerical preservation using rule-based AST extraction.
2. **Translation Memory Efficiency**: Standard mobile money workflows consist of fixed terminology. Pre-approved TM caching delivers sub-millisecond latencies and eliminates inference cost.
3. **Quarantine of Low-Resource Assets**: Template packs for local languages remain quarantined until validated by accredited linguists.
