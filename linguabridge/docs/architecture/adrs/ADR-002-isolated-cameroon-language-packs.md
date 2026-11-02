# ADR-002: Strict Quarantine and Governance for Cameroonian Language Packs

## Status
**Accepted**

## Date
2026-11-01

## Context
Cameroon has over 250 national languages. The five primary indigenous trading languages identified for this initiative are **Ewondo** (`ewo`), **Duala** (`dua`), **Basaa** (`bas`), **Fulfulde** (`fuv`), and **Bulu** (`bum`).

Unlike high-resource languages (French and English), these languages have limited digitized parallel text and lack standardized corporate dictionaries for contemporary financial terms (e.g., "overdraft protection", "two-factor authentication"). Deploying unverified or automatically scraped language packs into active banking applications introduces severe misinformation risks, brand reputation damage, and potential legal non-compliance.

## Decision
We enforce a **strict quarantine policy** for all newly initialized Cameroonian language packs:
1. **Isolated Repository Structure**: Packs reside in `language-packs/{pack-name}/` as template manifests and dictionaries.
2. **Default Quarantine State**: All initial templates are assigned `status: "not_installed"` and `qualityStatus: "unverified"`.
3. **Public Discovery Exclusion**: The public language registry API (`GET /v1/languages` and `GET /v1/languages/:code`) strictly queries packs with `status === "production_approved"`. Unreviewed packs return HTTP 404 to public clients.
4. **Administrative Verification Barrier**: Packs can only be audited through administrative routes (`GET /v1/packs`). The status transition machine explicitly throws an error if an attempt is made to transition unreviewed Cameroonian packs to `production_approved` without qualified native linguist sign-off.

## Consequences
- **Positive**: Zero risk of exposing hallucinated or low-quality translations in production microfinance apps.
- **Positive**: Provides a structured, auditable workflow for accredited linguistic bodies (e.g., NACALCO, SIL Cameroon, University of Yaoundé I) to review and certify terminology.
- **Trade-off**: Production rollout of indigenous languages requires community review cycles and cannot be automated overnight.
