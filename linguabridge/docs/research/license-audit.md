# License & Compliance Audit

## 1. Compliance Mandate

LinguaBridge is developed as a non-commercial, public-good accessibility infrastructure project dedicated to advancing financial inclusion in Cameroon and the CEMAC zone.

Because this initiative is strictly non-commercial and open source, all permissive open-source licenses (MIT, Apache 2.0, BSD-2/3-Clause, ISC) and academic/non-commercial data licenses (CC-BY-NC-4.0, CC-BY-4.0, ODbL) are acceptable for integration and derivative distribution.

---

## 2. Software Dependency Audit

Every package in the LinguaBridge monorepo was audited for license compatibility:

| Component / Package | Declared License | Compatibility Status | Notes |
| :--- | :--- | :--- | :--- |
| **Turborepo** | Apache-2.0 | Fully Compatible | Monorepo build tooling |
| **Fastify** | MIT | Fully Compatible | High-performance API server runtime |
| **Next.js** | MIT | Fully Compatible | Frontend web framework & portal |
| **React / React-DOM** | MIT | Fully Compatible | UI components & SDK integration |
| **Zod** | MIT | Fully Compatible | Schema validation & manifest parsing |
| **Vitest** | MIT | Fully Compatible | Unit & integration test runner |
| **tsup / esbuild** | MIT | Fully Compatible | Zero-config TypeScript bundler |
| **TypeScript** | Apache-2.0 | Fully Compatible | Core language compiler |
| **Pino** | MIT | Fully Compatible | Structured audit logging |
| **@fastify/helmet** | MIT | Fully Compatible | Web security headers |
| **@fastify/cors** | MIT | Fully Compatible | Cross-origin resource sharing |
| **@fastify/rate-limit** | MIT | Fully Compatible | DDOS & brute-force mitigation |

---

## 3. Linguistic Data & Lexicon Licensing

Linguistic packs for Cameroonian languages require careful provenance and IP stewardship:

1. **National Language Dictionaries & Grammars**:
   - Researched from public linguistic works by SIL Cameroon, NACALCO (National Association of Cameroonian Language Committees), and university dissertations.
   - Licensed under Creative Commons Attribution (CC-BY-4.0) or Non-Commercial Attribution (CC-BY-NC-4.0).
   - Fully compatible with the non-commercial deployment of LinguaBridge.

2. **Parallel Financial Glossaries**:
   - Standardized financial terminology for mobile money (FCFA, tontines, savings accounts, transfer fees) is published under CC0 (Public Domain Dedication) to encourage universal fintech adoption without proprietary vendor lock-in.

3. **Attribution & Provenance Governance**:
   - Every language pack manifest (`manifest.json`) explicitly records the fields `license`, `provenance`, `attribution`, and `qualityStatus`.
   - Packs with unreviewed provenance are isolated by policy and prevented from public activation.

---

## 4. Regulatory Alignment (CEMAC & National Compliance)

1. **BEAC (Bank of Central African States) Regulations**:
   - In accordance with BEAC instructions on payment systems and digital financial security, translation layers must never modify, obfuscate, or delay transaction confirmation receipts or legal disclosures. LinguaBridge's AST Financial Guard provides audited proof of zero numeric drift.

2. **Data Sovereignty & Local Processing**:
   - The platform architecture supports entirely on-premises, air-gapped deployment in Cameroonian data centers. Translations, financial amounts, and user identifiers do not need to be transmitted outside the sovereign jurisdiction of the state or cloud region.
