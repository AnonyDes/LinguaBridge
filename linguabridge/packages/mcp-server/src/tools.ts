import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  FinancialEntityExtractor,
  computeEntityFingerprint,
} from '@linguabridge/financial-domain';
import {
  TranslationPipeline,
  FixtureProvider,
  type CacheStore,
} from '@linguabridge/translation-engine';
import { loadGlossaryForLang, loadSupportedLanguages } from './pack-loader';
import type {
  TranslateToolInput,
  TranslateToolOutput,
  VerifyToolInput,
  VerifyToolOutput,
  GlossaryToolInput,
  GlossaryToolOutput,
  LanguagesToolInput,
  LanguagesToolOutput,
  McpServerConfig,
} from './types';

const MAX_PAYLOAD_CHARS = 50_000;

class InMemoryCacheStore implements CacheStore {
  private map = new Map<string, string>();
  async get(key: string): Promise<string | null> {
    return this.map.get(key) ?? null;
  }
  async set(key: string, value: string): Promise<void> {
    this.map.set(key, value);
  }
}

function normalizeSearchStr(str: unknown): string {
  if (typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

const SUPPORTED_SOVEREIGN_LANGUAGES = new Set([
  'ewo-cm', 'ewo',
  'fuv-cm', 'fuv', 'fub-cm', 'fub',
  'hau-cm', 'hau',
  'knc-cm', 'knc',
  'pcm-cm', 'pcm',
  'en', 'fr',
]);

export function registerTools(server: McpServer, config?: McpServerConfig): void {
  const extractor = new FinancialEntityExtractor();
  const pipeline = new TranslationPipeline({
    providers: [new FixtureProvider()],
    cache: new InMemoryCacheStore(),
  });

  // Tool 1: translate_financial_text
  server.tool(
    'translate_financial_text',
    'Translate fintech text with mandatory financial zero-drift AST validation and SHA-256 entity fingerprinting',
    {
      text: z.string().describe('Fintech text to translate (e.g. "Solde disponible: 75 000 FCFA")'),
      targetLang: z.string().describe('Target language code (e.g. "ewo-CM", "fuv-CM", "hau-CM", "knc-CM", "pcm-CM")'),
      sourceLang: z.string().optional().describe('Source language code (default "fr")'),
      domain: z.string().optional().describe('Domain context (default "financial")'),
    },
    async (args: TranslateToolInput) => {
      try {
        if (!args || typeof args !== 'object') {
          return {
            isError: true,
            content: [{ type: 'text' as const, text: JSON.stringify({ isError: true, error: 'Invalid tool arguments' }, null, 2) }],
          };
        }

        const rawText = typeof args.text === 'string' ? args.text : '';
        const text = rawText.trim();
        const targetLang = typeof args.targetLang === 'string' ? args.targetLang.trim() : '';
        const sourceLang = typeof args.sourceLang === 'string' && args.sourceLang.trim() ? args.sourceLang.trim() : 'fr';
        const domain = typeof args.domain === 'string' && args.domain.trim() ? args.domain.trim() : 'financial';

        // Adversarial Defense 1: Empty input check
        if (!text) {
          const errOutput: TranslateToolOutput = {
            sourceText: '',
            translatedText: '',
            sourceLang,
            targetLang,
            safe: false,
            status: 'failed',
            sourceFingerprint: '0000000000000000000000000000000000000000000000000000000000000000',
            translatedFingerprint: '0000000000000000000000000000000000000000000000000000000000000000',
            entities: [],
            translatedEntities: [],
            violations: ['Empty input text'],
            error: 'Input text is required',
          };
          return {
            isError: true,
            content: [{ type: 'text' as const, text: JSON.stringify(errOutput, null, 2) }],
          };
        }

        // Adversarial Defense 2: Max payload limit (> 50,000 characters)
        if (text.length > MAX_PAYLOAD_CHARS) {
          const errOutput: TranslateToolOutput = {
            sourceText: text.slice(0, 100) + '...',
            translatedText: '',
            sourceLang,
            targetLang,
            safe: false,
            status: 'failed',
            sourceFingerprint: '0000000000000000000000000000000000000000000000000000000000000000',
            translatedFingerprint: '0000000000000000000000000000000000000000000000000000000000000000',
            entities: [],
            translatedEntities: [],
            violations: [`Input text exceeds maximum size limit (${MAX_PAYLOAD_CHARS} characters)`],
            error: `Input text length (${text.length}) exceeds maximum allowable size (${MAX_PAYLOAD_CHARS} chars)`,
          };
          return {
            isError: true,
            content: [{ type: 'text' as const, text: JSON.stringify(errOutput, null, 2) }],
          };
        }

        // Adversarial Defense 3: Target language required
        if (!targetLang) {
          const errOutput: TranslateToolOutput = {
            sourceText: text,
            translatedText: '',
            sourceLang,
            targetLang: '',
            safe: false,
            status: 'failed',
            sourceFingerprint: '0000000000000000000000000000000000000000000000000000000000000000',
            translatedFingerprint: '0000000000000000000000000000000000000000000000000000000000000000',
            entities: [],
            translatedEntities: [],
            violations: ['Target language is required'],
            error: 'Target language code is required (e.g. ewo-CM, fuv-CM, hau-CM, knc-CM, pcm-CM)',
          };
          return {
            isError: true,
            content: [{ type: 'text' as const, text: JSON.stringify(errOutput, null, 2) }],
          };
        }

        const normTarget = targetLang.toLowerCase().replace(/_/g, '-');

        // Adversarial Defense 4: Duala quarantine enforcement
        if (normTarget === 'dua-cm' || normTarget === 'dua' || normTarget === 'duala') {
          const errOutput: TranslateToolOutput = {
            sourceText: text,
            translatedText: '',
            sourceLang,
            targetLang,
            safe: false,
            status: 'failed',
            sourceFingerprint: '0000000000000000000000000000000000000000000000000000000000000000',
            translatedFingerprint: '0000000000000000000000000000000000000000000000000000000000000000',
            entities: [],
            translatedEntities: [],
            violations: ['Duala (dua-CM) language pack is in quarantine: unverified for financial transactions'],
            error: 'Duala is currently in quarantine pending verified academic banking consensus. Production translation is blocked.',
          };
          return {
            isError: true,
            content: [{ type: 'text' as const, text: JSON.stringify(errOutput, null, 2) }],
          };
        }

        // Adversarial Defense 5: Unknown language validation
        if (!SUPPORTED_SOVEREIGN_LANGUAGES.has(normTarget)) {
          const errOutput: TranslateToolOutput = {
            sourceText: text,
            translatedText: '',
            sourceLang,
            targetLang,
            safe: false,
            status: 'failed',
            sourceFingerprint: '0000000000000000000000000000000000000000000000000000000000000000',
            translatedFingerprint: '0000000000000000000000000000000000000000000000000000000000000000',
            entities: [],
            translatedEntities: [],
            violations: [`Unsupported or unverified target language: "${targetLang}"`],
            error: `Target language "${targetLang}" is not certified. Active sovereign languages: ewo-CM, fuv-CM, hau-CM, knc-CM, pcm-CM.`,
          };
          return {
            isError: true,
            content: [{ type: 'text' as const, text: JSON.stringify(errOutput, null, 2) }],
          };
        }

        // Extract entities from source text
        const sourceEntities = extractor.extract(text);
        const sourceFingerprint = computeEntityFingerprint(sourceEntities);

        // Run through translation pipeline with FinancialGuardStage
        const result = await pipeline.process({
          id: randomUUID(),
          sourceText: text,
          sourceLang,
          targetLang,
          domain: (domain as any) || 'financial',
        });

        // Extract entities from translated text
        const translatedEntities = extractor.extract(result.translatedText);
        const translatedFingerprint = computeEntityFingerprint(translatedEntities);

        // Perform AST zero-drift comparison
        const guard = extractor.compare(sourceEntities, translatedEntities);
        const violations = guard.violations.map((v) => v.issue);

        const safe = guard.safe && result.status !== 'unsafe';
        const status: TranslateToolOutput['status'] = safe ? 'completed' : 'unsafe';

        const output: TranslateToolOutput = {
          sourceText: text,
          translatedText: result.translatedText,
          sourceLang,
          targetLang,
          safe,
          status,
          sourceFingerprint,
          translatedFingerprint,
          entities: sourceEntities,
          translatedEntities,
          violations,
          phonetic: result.phonetic,
        };

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(output, null, 2),
            },
          ],
        };
      } catch (err: any) {
        const message = err instanceof Error ? err.message : String(err);
        const errorOutput: TranslateToolOutput = {
          sourceText: args?.text || '',
          translatedText: args?.text || '',
          sourceLang: args?.sourceLang || 'fr',
          targetLang: args?.targetLang || 'ewo-CM',
          safe: false,
          status: 'failed',
          sourceFingerprint: '0000000000000000000000000000000000000000000000000000000000000000',
          translatedFingerprint: '0000000000000000000000000000000000000000000000000000000000000000',
          entities: [],
          translatedEntities: [],
          violations: [message],
          error: message,
        };
        return {
          isError: true,
          content: [{ type: 'text' as const, text: JSON.stringify(errorOutput, null, 2) }],
        };
      }
    }
  );

  // Tool 2: verify_zero_drift
  server.tool(
    'verify_zero_drift',
    'Check if translated text preserves exact amounts, currencies, account numbers, and transaction IDs',
    {
      sourceText: z.string().describe('Original source financial text'),
      translatedText: z.string().describe('Translated financial text to verify'),
    },
    async (args: VerifyToolInput) => {
      try {
        if (!args || typeof args !== 'object') {
          return {
            isError: true,
            content: [{ type: 'text' as const, text: JSON.stringify({ safe: false, match: false, error: 'Invalid arguments' }, null, 2) }],
          };
        }

        const sourceText = typeof args.sourceText === 'string' ? args.sourceText : '';
        const translatedText = typeof args.translatedText === 'string' ? args.translatedText : '';

        // Adversarial Defense: Empty payload verification
        if (!sourceText && !translatedText) {
          return {
            isError: true,
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify(
                  {
                    safe: false,
                    match: false,
                    sourceFingerprint: '0000000000000000000000000000000000000000000000000000000000000000',
                    translatedFingerprint: '0000000000000000000000000000000000000000000000000000000000000000',
                    violations: ['Source text and translated text are required for verification'],
                    error: 'Both sourceText and translatedText must be provided',
                    sourceEntities: [],
                    translatedEntities: [],
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        // Adversarial Defense: Maximum size limit
        if (sourceText.length > MAX_PAYLOAD_CHARS || translatedText.length > MAX_PAYLOAD_CHARS) {
          return {
            isError: true,
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify(
                  {
                    safe: false,
                    match: false,
                    sourceFingerprint: '0000000000000000000000000000000000000000000000000000000000000000',
                    translatedFingerprint: '0000000000000000000000000000000000000000000000000000000000000000',
                    violations: [`Payload exceeds maximum allowable size (${MAX_PAYLOAD_CHARS} characters)`],
                    error: 'Text length exceeds maximum allowed limit',
                    sourceEntities: [],
                    translatedEntities: [],
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        const sourceEntities = extractor.extract(sourceText);
        const translatedEntities = extractor.extract(translatedText);

        const sourceFingerprint = computeEntityFingerprint(sourceEntities);
        const translatedFingerprint = computeEntityFingerprint(translatedEntities);

        const guard = extractor.compare(sourceEntities, translatedEntities);
        const violations = guard.violations.map((v) => v.issue);

        const safe = guard.safe;
        const match = sourceFingerprint === translatedFingerprint && safe;

        const output: VerifyToolOutput = {
          safe,
          match,
          sourceFingerprint,
          translatedFingerprint,
          violations,
          sourceEntities,
          translatedEntities,
        };

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(output, null, 2),
            },
          ],
        };
      } catch (err: any) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          isError: true,
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  safe: false,
                  match: false,
                  sourceFingerprint: '0000000000000000000000000000000000000000000000000000000000000000',
                  translatedFingerprint: '0000000000000000000000000000000000000000000000000000000000000000',
                  violations: [message],
                  error: message,
                  sourceEntities: [],
                  translatedEntities: [],
                },
                null,
                2
              ),
            },
          ],
        };
      }
    }
  );

  // Tool 3: lookup_glossary
  server.tool(
    'lookup_glossary',
    'Query official NACALCO/academic consensus terms in certified language packs (e.g. Ewondo ewo-CM, Fulfulde fuv-CM, Haoussa hau-CM, Kanuri knc-CM, Pidgin pcm-CM)',
    {
      term: z.string().describe('Financial terminology term or keyword to look up (e.g. "solde disponible", "transfert")'),
      lang: z.string().optional().describe('Language code (default "ewo-CM")'),
    },
    async (args: GlossaryToolInput) => {
      try {
        if (!args || typeof args !== 'object') {
          return {
            isError: true,
            content: [{ type: 'text' as const, text: JSON.stringify({ query: '', lang: 'ewo-CM', matches: [], total: 0, error: 'Invalid arguments' }, null, 2) }],
          };
        }

        const rawTerm = typeof args.term === 'string' ? args.term : '';
        const query = rawTerm.trim();
        const lang = typeof args.lang === 'string' && args.lang.trim() ? args.lang.trim() : 'ewo-CM';

        // Adversarial Defense 1: Empty term check
        if (!query) {
          return {
            isError: true,
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify(
                  {
                    query: '',
                    lang,
                    matches: [],
                    total: 0,
                    error: 'Search term is required',
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        // Adversarial Defense 2: Max length check
        if (query.length > MAX_PAYLOAD_CHARS) {
          return {
            isError: true,
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify(
                  {
                    query: query.slice(0, 50) + '...',
                    lang,
                    matches: [],
                    total: 0,
                    error: `Search term exceeds maximum allowable length (${MAX_PAYLOAD_CHARS} chars)`,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        // Adversarial Defense 3: Duala quarantine check
        const normLang = lang.toLowerCase().replace(/_/g, '-');
        if (normLang === 'dua-cm' || normLang === 'dua' || normLang === 'duala') {
          return {
            isError: true,
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify(
                  {
                    query,
                    lang: 'dua-CM',
                    matches: [],
                    total: 0,
                    error: 'Language dua-CM is quarantined (unverified linguistic data)',
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        // Adversarial Defense 4: Path traversal & invalid code check
        if (!/^[a-zA-Z0-9_-]{2,15}$/.test(lang)) {
          return {
            isError: true,
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify(
                  {
                    query,
                    lang,
                    matches: [],
                    total: 0,
                    error: 'Invalid language code format',
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        const { terms } = loadGlossaryForLang(lang, config?.packsDir);
        const normQuery = normalizeSearchStr(query);

        // Score and match terms safely
        const matches = terms.filter((entry) => {
          const normKey = normalizeSearchStr(entry.key);
          const normFr = normalizeSearchStr(entry.fr);
          const normEn = normalizeSearchStr(entry.en);
          const normEwo = normalizeSearchStr(entry.ewo);
          const normFuv = normalizeSearchStr(entry.fuv);
          const normHau = normalizeSearchStr(entry.hau);
          const normKnc = normalizeSearchStr(entry.knc);
          const normPcm = normalizeSearchStr(entry.pcm);
          const normTarget = normalizeSearchStr(entry.target);
          const normDef = entry.definition ? normalizeSearchStr(entry.definition) : '';

          // Exact or substring matches
          if (
            normKey === normQuery ||
            normFr === normQuery ||
            normEn === normQuery ||
            normEwo === normQuery ||
            normFuv === normQuery ||
            normHau === normQuery ||
            normKnc === normQuery ||
            normPcm === normQuery ||
            normTarget === normQuery
          ) {
            return true;
          }

          if (
            normKey.includes(normQuery) ||
            normFr.includes(normQuery) ||
            normEn.includes(normQuery) ||
            normEwo.includes(normQuery) ||
            normFuv.includes(normQuery) ||
            normHau.includes(normQuery) ||
            normKnc.includes(normQuery) ||
            normPcm.includes(normQuery) ||
            normTarget.includes(normQuery) ||
            normDef.includes(normQuery)
          ) {
            return true;
          }

          // Individual words match
          const queryWords = normQuery.split(/\s+/).filter(Boolean);
          if (
            queryWords.length > 1 &&
            queryWords.every(
              (w) =>
                normKey.includes(w) ||
                normFr.includes(w) ||
                normEn.includes(w) ||
                normEwo.includes(w) ||
                normFuv.includes(w) ||
                normHau.includes(w) ||
                normKnc.includes(w) ||
                normPcm.includes(w) ||
                normTarget.includes(w)
            )
          ) {
            return true;
          }

          return false;
        });

        const output: GlossaryToolOutput = {
          query,
          lang,
          matches,
          total: matches.length,
        };

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(output, null, 2),
            },
          ],
        };
      } catch (err: any) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          isError: true,
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  query: args?.term || '',
                  lang: args?.lang || 'ewo-CM',
                  matches: [],
                  total: 0,
                  error: message,
                },
                null,
                2
              ),
            },
          ],
        };
      }
    }
  );

  // Common language listing handler for list_supported_languages and list_languages
  const handleListLanguages = async (args: { includeQuarantined?: boolean }) => {
    try {
      const includeQuarantined = Boolean(args?.includeQuarantined);
      const languages = loadSupportedLanguages(includeQuarantined, config?.packsDir);

      const approvedCount = languages.filter((l) => l.status === 'production_approved').length;
      const quarantinedCount = languages.filter((l) => l.status !== 'production_approved').length;

      const output: LanguagesToolOutput = {
        languages,
        total: languages.length,
        approvedCount,
        quarantinedCount,
      };

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(output, null, 2),
          },
        ],
      };
    } catch (err: any) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                languages: [],
                total: 0,
                approvedCount: 0,
                quarantinedCount: 0,
                error: message,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  };

  // Tool 4: list_supported_languages
  server.tool(
    'list_supported_languages',
    'Enumerate installed and quarantined language packs with status and capabilities',
    {
      includeQuarantined: z
        .boolean()
        .optional()
        .describe('Whether to include unapproved/quarantined template packs (default false)'),
    },
    handleListLanguages
  );

  // Tool 5 (Alias): list_languages
  server.tool(
    'list_languages',
    'Enumerate active sovereign Cameroonian languages and packs',
    {
      includeQuarantined: z
        .boolean()
        .optional()
        .describe('Whether to include unapproved/quarantined template packs (default false)'),
    },
    handleListLanguages
  );
}
