# LinguaBridge Language Packs

Language packs define linguistic resources, dictionaries, phonetic models, and parallel corpora for language support in LinguaBridge.

## Safety & Ethics Policy for African and Cameroonian Languages

To protect users against harmful mistranslations—particularly in high-stakes domains such as banking, healthcare, and civil services—**unverified language models and raw untrusted data are strictly forbidden from being activated in production**.

### Language Pack Lifecycle
1. `not_installed`: The template/manifest exists, but zero linguistic data has been acquired or verified.
2. `installed_incomplete`: Data files are partially present but incomplete or unindexed.
3. `internal_testing`: Data files are undergoing algorithmic checks and automated alignment verification.
4. `under_review`: Resources are under formal review by certified native-speaker linguists.
5. `approved_limited`: Approved for non-critical informational use cases only.
6. `production_approved`: Fully certified for production translation and speech accessibility.
7. `deprecated`: Superseded by newer packs.
8. `disabled`: Temporarily disabled for maintenance or security issues.

### Current Templates Included
- **Ewondo** (`ewo-CM`, ISO 639-3: `ewo`)
- **Duala** (`dua-CM`, ISO 639-3: `dua`)
- **Basaa** (`bas-CM`, ISO 639-3: `bas`)
- **Fulfulde** (`fub-CM`, ISO 639-3: `fub`)
- **Bulu** (`bum-CM`, ISO 639-3: `bum`)

> **Note**: All 5 packs above are currently in `not_installed` status. They will NOT appear in public `/v1/languages` listings until certified linguistic resources are formally validated.
