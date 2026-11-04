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

class InMemoryCacheStore implements CacheStore {
  private map = new Map<string, string>();
  async get(key: string): Promise<string | null> {
    return this.map.get(key) ?? null;
  }
  async set(key: string, value: string): Promise<void> {
    this.map.set(key, value);
  }
}

function normalizeSearchStr(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

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
      text: z.string().describe('Fintech text to translate (e.g. "Solde disponible: 50 000 FCFA")'),
      targetLang: z.string().describe('Target language code (e.g. "ewo-CM", "en")'),
      sourceLang: z.string().optional().describe('Source language code (default "fr")'),
      domain: z.string().optional().describe('Domain context (default "financial")'),
    },
    async (args: TranslateToolInput) => {
      try {
        const text = args.text?.trim() ?? '';
        const targetLang = args.targetLang?.trim() ?? '';
        const sourceLang = args.sourceLang?.trim() || 'fr';
        const domain = args.domain?.trim() || 'financial';

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
            content: [{ type: 'text', text: JSON.stringify(errOutput, null, 2) }],
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
              type: 'text',
              text: JSON.stringify(output, null, 2),
            },
          ],
        };
      } catch (err: any) {
        const message = err instanceof Error ? err.message : String(err);
        const errorOutput: TranslateToolOutput = {
          sourceText: args.text || '',
          translatedText: args.text || '',
          sourceLang: args.sourceLang || 'fr',
          targetLang: args.targetLang || 'ewo-CM',
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
          content: [{ type: 'text', text: JSON.stringify(errorOutput, null, 2) }],
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
        const sourceText = args.sourceText ?? '';
        const translatedText = args.translatedText ?? '';

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
              type: 'text',
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
              type: 'text',
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
    'Query official NACALCO/academic consensus terms in certified language packs (e.g. Ewondo ewo-CM)',
    {
      term: z.string().describe('Financial terminology term or keyword to look up (e.g. "solde disponible")'),
      lang: z.string().optional().describe('Language code (default "ewo-CM")'),
    },
    async (args: GlossaryToolInput) => {
      try {
        const query = args.term?.trim() ?? '';
        const lang = args.lang?.trim() || 'ewo-CM';

        const { terms } = loadGlossaryForLang(lang, config?.packsDir);
        const normQuery = normalizeSearchStr(query);

        // Score and match terms
        const matches = terms.filter((entry) => {
          const normKey = normalizeSearchStr(entry.key);
          const normFr = normalizeSearchStr(entry.fr);
          const normEn = normalizeSearchStr(entry.en);
          const normEwo = normalizeSearchStr(entry.ewo);
          const normDef = entry.definition ? normalizeSearchStr(entry.definition) : '';

          // Exact or substring matches
          if (
            normKey === normQuery ||
            normFr === normQuery ||
            normEn === normQuery ||
            normEwo === normQuery
          ) {
            return true;
          }

          if (
            normKey.includes(normQuery) ||
            normFr.includes(normQuery) ||
            normEn.includes(normQuery) ||
            normEwo.includes(normQuery) ||
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
                normEwo.includes(w)
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
              type: 'text',
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
              type: 'text',
              text: JSON.stringify(
                {
                  query: args.term || '',
                  lang: args.lang || 'ewo-CM',
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
    async (args: LanguagesToolInput) => {
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
              type: 'text',
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
              type: 'text',
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
    }
  );
}
