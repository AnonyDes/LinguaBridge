# ADR-001: Deterministic Financial Guard for Zero Numerical Drift

## Status
**Accepted**

## Date
2026-11-01

## Context
In digital microfinance and mobile money platforms operating in Cameroon (e.g., Orange Money, MTN MoMo, Express Union), transactions involve precise monetary amounts denominated in Central African CFA francs (FCFA / XAF), phone numbers, account identifiers, and transaction references.

Neural Machine Translation (NMT) and Large Language Models (LLMs) are inherently probabilistic sequence generators. In empirical evaluations, NMT models frequently introduce:
1. **Digit truncation**: e.g., `25 000 FCFA` translated as `2 500 CFA`.
2. **Entity hallucination**: altering account or phone numbers.
3. **Currency mutation**: substituting `FCFA` with `EUR` or `USD` based on statistical co-occurrence.

In financial contexts, a 10x numerical deviation or misdirected funds transfer causes irreparable financial harm to users and violates Bank of Central African States (BEAC) consumer protection regulations.

## Decision
We enforce a **Deterministic Financial Guard** (`@linguabridge/financial-domain`):
1. **Pre-Translation Extraction**: An Abstract Syntax Tree (AST) parser scans input text for monetary amounts, currencies, account IDs, phone numbers, percentages, and dates before passing text to any translation provider.
2. **Post-Translation Corroboration**: The translated text is independently parsed for all extracted entity classes. Every numerical value, currency tag, and account reference must match the source entity exactly in normalized representation.
3. **Strict Invariant Check**: If any numerical value has mutated, drifted, or disappeared, the translation is marked with `status: 'unsafe'`, a descriptive violation warning is recorded, and the original financial entity is preserved.

## Consequences
- **Positive**: Absolute mathematical guarantee that no monetary amount or phone number will be corrupted by a translation model.
- **Positive**: Verifiable compliance with CEMAC / BEAC banking transparency standards.
- **Trade-off**: Requires dedicated regex and AST parsing cycles, adding ~1-3ms per translation request (well within our 50ms latency budget).
