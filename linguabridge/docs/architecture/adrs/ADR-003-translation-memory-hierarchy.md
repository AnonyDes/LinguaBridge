# ADR-003: Multi-Tier Translation Memory (TM) Architecture

## Status
**Accepted**

## Date
2026-11-01

## Context
In retail banking, mobile money, and digital financial flows in Cameroon, user interface text is highly repetitive. Over 85% of queries consist of standard UI labels (e.g., *« Solde de votre compte »*, *« Confirmer le transfert »*, *« Retrait d'espèces »*, *« Code secret »*).

Invoking remote neural machine translation engines (e.g., Meta NLLB or DeepL) for every repeated user request introduces significant network latency (150-400ms), external API consumption costs, and probabilistic drift on previously approved terminology.

## Decision
We implement a **Multi-Tier Translation Memory (TM) Cache Hierarchy**:
1. **L1 In-Memory Translation Memory Cache** (`@linguabridge/translation-engine`):
   - Fast, in-memory cache keyed by cryptographic hash: `SHA256(sourceLang:targetLang:domain:normalizedText)`.
   - Delivers sub-millisecond response latency (< 2ms) for repeated phrases.
2. **L2 Persistent Translation Memory** (`@linguabridge/database`):
   - Backed by persistent relational storage with normalized indexes across source, target, domain, and tenant.
   - Supports pre-approved financial glossaries certified by regulatory authorities.
3. **Cache Policy**:
   - Every incoming translation request queries L1 first.
   - On cache hit, the verified translation is returned immediately with `cacheStatus: 'hit'`, bypassing external neural inference.
   - Newly validated translations are stored in memory and synchronized to persistent storage.

## Consequences
- **Positive**: Sub-millisecond latency for typical mobile money interactions.
- **Positive**: 85%+ reduction in external neural inference costs and network bandwidth consumption.
- **Positive**: 100% terminological consistency across user sessions.
