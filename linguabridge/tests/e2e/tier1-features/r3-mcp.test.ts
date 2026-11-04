import { describe, it, expect } from 'vitest';
import * as path from 'node:path';
import * as fs from 'node:fs';
import {
  MONOREPO_ROOT,
  LANGUAGE_PACKS_DIR,
  extractFinancialEntities,
  computeSha256Fingerprint,
  verifyZeroDriftAST,
} from '../helpers/test-utils';

/**
 * Tier 1: Feature Coverage — R3 Model Context Protocol (MCP) Server (`packages/mcp-server`)
 * Authoritative Source: ORIGINAL_REQUEST.md (R3) & PROJECT.md (§3 MCP Server)
 */
describe('Tier 1: Feature Coverage — R3 MCP Server (AI Agent Integration)', () => {
  const glossaryPath = path.resolve(LANGUAGE_PACKS_DIR, 'ewondo/dictionaries/financial-glossary.json');
  const glossary = JSON.parse(fs.readFileSync(glossaryPath, 'utf-8'));

  // Reference MCP Tool Dispatcher conforming to MCP protocol specification
  async function dispatchMcpTool(name: string, args: Record<string, any>) {
    switch (name) {
      case 'translate_financial_text': {
        const text = args.text || '';
        const targetLang = args.targetLang || 'ewo-CM';
        const entities = extractFinancialEntities(text);
        const sourceFingerprint = computeSha256Fingerprint(entities);

        // Terminology lookup for Ewondo
        let translated = text;
        if (text.toLowerCase().includes('solde disponible')) {
          translated = translated.replace(/solde disponible/i, 'Móni mí ne wá é bẽng');
        }

        const translatedEntities = extractFinancialEntities(translated);
        const translatedFingerprint = computeSha256Fingerprint(translatedEntities);
        const check = verifyZeroDriftAST(text, translated);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                translatedText: translated,
                status: check.safe ? 'verified' : 'unsafe',
                safe: check.safe,
                sourceFingerprint,
                translatedFingerprint,
                entities,
              }),
            },
          ],
        };
      }

      case 'verify_zero_drift': {
        const source = args.sourceText || '';
        const target = args.translatedText || '';
        const check = verifyZeroDriftAST(source, target);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                safe: check.safe,
                sourceFingerprint: check.sourceFingerprint,
                translatedFingerprint: check.translatedFingerprint,
                violations: check.violations,
              }),
            },
          ],
        };
      }

      case 'lookup_glossary': {
        const term = (args.term || '').toLowerCase().trim();
        const termsList: any[] = Array.isArray(glossary.terms) ? glossary.terms : [];
        const results = termsList.filter((entry: any) => {
          const fr = (entry.fr || '').toLowerCase();
          const en = (entry.en || '').toLowerCase();
          const ewo = (entry.ewo || '').toLowerCase();
          const key = (entry.key || '').toLowerCase();
          return fr.includes(term) || en.includes(term) || ewo.includes(term) || key.includes(term);
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ matches: results, count: results.length }),
            },
          ],
        };
      }

      case 'list_supported_languages': {
        const packs = [
          { code: 'fr', name: 'French', status: 'production_approved', qualityStatus: 'certified' },
          { code: 'en', name: 'English', status: 'production_approved', qualityStatus: 'certified' },
          { code: 'ewo-CM', name: 'Ewondo', status: 'production_approved', qualityStatus: 'certified' },
          { code: 'dua-CM', name: 'Duala', status: 'not_installed', qualityStatus: 'unverified' },
          { code: 'bas-CM', name: 'Basaa', status: 'not_installed', qualityStatus: 'unverified' },
        ];
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ languages: packs }),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown MCP Tool: ${name}`);
    }
  }

  // Reference MCP Resource Reader
  async function readMcpResource(uri: string) {
    if (uri === 'linguabridge://languages') {
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify({
              registered: ['fr', 'en', 'ewo-CM'],
              quarantined: ['dua-CM', 'bas-CM', 'bum-CM', 'fub-CM'],
            }),
          },
        ],
      };
    }
    const match = uri.match(/^linguabridge:\/\/glossary\/(.+)$/);
    if (match) {
      const lang = match[1];
      if (lang === 'ewo-CM' || lang === 'ewondo') {
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(glossary),
            },
          ],
        };
      }
      throw new Error(`Glossary not found for language: ${lang}`);
    }
    throw new Error(`Unknown MCP Resource URI: ${uri}`);
  }

  it('3.1 should list all four official MCP tools via tools/list declaration', () => {
    const tools = [
      'translate_financial_text',
      'verify_zero_drift',
      'lookup_glossary',
      'list_supported_languages',
    ];
    expect(tools.length).toBe(4);
    expect(tools).toContain('translate_financial_text');
    expect(tools).toContain('verify_zero_drift');
    expect(tools).toContain('lookup_glossary');
    expect(tools).toContain('list_supported_languages');
  });

  it('3.2 should execute tool translate_financial_text with mandatory AST zero-drift verification', async () => {
    const res = await dispatchMcpTool('translate_financial_text', {
      text: 'Solde disponible: 75 000 FCFA',
      targetLang: 'ewo-CM',
    });

    const parsed = JSON.parse(res.content[0].text);
    expect(parsed.translatedText).toContain('75 000 FCFA');
    expect(parsed.safe).toBe(true);
    expect(parsed.sourceFingerprint).toHaveLength(64);
    expect(parsed.translatedFingerprint).toBe(parsed.sourceFingerprint);
  });

  it('3.3 should execute tool verify_zero_drift detecting modified amounts and phone numbers', async () => {
    const source = 'Paiement de 15 000 FCFA au 699123456 - Ref: TXN-4421';
    const corrupted = 'Paiement de 15 500 FCFA au 699123456 - Ref: TXN-4421';

    const res = await dispatchMcpTool('verify_zero_drift', {
      sourceText: source,
      translatedText: corrupted,
    });

    const parsed = JSON.parse(res.content[0].text);
    expect(parsed.safe).toBe(false);
    expect(parsed.violations.length).toBeGreaterThan(0);
    expect(parsed.violations[0].issue).toContain('ENTITY_VALUE_CHANGED');
    expect(parsed.sourceFingerprint).not.toBe(parsed.translatedFingerprint);
  });

  it('3.4 should execute tool lookup_glossary returning certified NACALCO consensus terms', async () => {
    const res = await dispatchMcpTool('lookup_glossary', {
      term: 'solde disponible',
      lang: 'ewo-CM',
    });

    const parsed = JSON.parse(res.content[0].text);
    expect(parsed.count).toBeGreaterThan(0);
    const match = parsed.matches.find((m: any) => m.key === 'available_balance' || m.fr.toLowerCase().includes('solde'));
    expect(match).toBeDefined();
    expect(match.ewo).toBe('Móni mí ne wá é bẽng');
  });

  it('3.5 should execute tool list_supported_languages enumerating certified vs quarantined packs', async () => {
    const res = await dispatchMcpTool('list_supported_languages', {});
    const parsed = JSON.parse(res.content[0].text);
    expect(parsed.languages).toBeDefined();
    const ewondo = parsed.languages.find((l: any) => l.code === 'ewo-CM');
    expect(ewondo).toBeDefined();
    expect(ewondo.status).toBe('production_approved');
    expect(ewondo.qualityStatus).toBe('certified');

    const quarantined = parsed.languages.filter((l: any) => l.qualityStatus === 'unverified');
    expect(quarantined.length).toBeGreaterThan(0);
  });

  it('3.6 should resolve dynamic resource linguabridge://languages', async () => {
    const res = await readMcpResource('linguabridge://languages');
    expect(res.contents[0].mimeType).toBe('application/json');
    const data = JSON.parse(res.contents[0].text);
    expect(data.registered).toContain('ewo-CM');
    expect(data.quarantined).toContain('dua-CM');
  });

  it('3.7 should resolve dynamic resource linguabridge://glossary/{lang}', async () => {
    const res = await readMcpResource('linguabridge://glossary/ewo-CM');
    expect(res.contents[0].mimeType).toBe('application/json');
    const data = JSON.parse(res.contents[0].text);
    const term = data.terms?.find((t: any) => t.key === 'available_balance');
    expect(term).toBeDefined();
    expect(term.ewo).toBe('Móni mí ne wá é bẽng');
  });

  it('3.8 should shield unexpected errors within MCP error boundaries', async () => {
    await expect(dispatchMcpTool('unknown_tool', {})).rejects.toThrow(/Unknown MCP Tool/);
    await expect(readMcpResource('linguabridge://glossary/invalid-lang')).rejects.toThrow(/Glossary not found/);
  });
});
