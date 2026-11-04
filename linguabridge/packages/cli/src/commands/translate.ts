import { randomUUID } from 'node:crypto';
import { FinancialEntityExtractor } from '@linguabridge/financial-domain';
import { TranslationPipeline, FixtureProvider, type CacheStore } from '@linguabridge/translation-engine';
import type { TranslationDomain, TranslationResult, FinancialEntity } from '@linguabridge/shared-types';
import { printJson, printError } from '../utils/output';

export interface TranslateOptions {
  target: string;
  source?: string;
  domain?: string;
  json?: boolean;
  exit?: boolean;
}

export interface CliTranslateResult {
  result: TranslationResult;
  safe: boolean;
  exitCode: number;
  sourceFingerprint: string;
  translatedFingerprint: string;
  sourceEntities: FinancialEntity[];
  translatedEntities: FinancialEntity[];
}

// In-memory cache for CLI pipeline execution
const memoryCacheStore = new Map<string, string>();
const memoryCache: CacheStore = {
  get: async (key: string) => memoryCacheStore.get(key) ?? null,
  set: async (key: string, value: string) => {
    memoryCacheStore.set(key, value);
  },
};

export async function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => {
      resolve(data.trim());
    });
    process.stdin.on('error', (err) => {
      reject(err);
    });
  });
}

export async function runTranslate(
  inputText: string | undefined,
  options: TranslateOptions
): Promise<CliTranslateResult> {
  let text = inputText?.trim();

  // Handle stdin piping if text is missing or '-'
  if (text === '-' || (!text && !process.stdin.isTTY && !process.env.VITEST)) {
    text = await readStdin();
  }

  if (!text) {
    printError('No text provided to translate. Please specify text as argument or pipe via stdin.');
    process.exitCode = 1;
    if (options.exit !== false && !process.env.VITEST) {
      process.exit(1);
    }
    throw new Error('No text provided to translate.');
  }

  if (!options.target) {
    printError('Target language is required (--target <lang>).');
    process.exitCode = 1;
    if (options.exit !== false && !process.env.VITEST) {
      process.exit(1);
    }
    throw new Error('Target language is required.');
  }

  const extractor = new FinancialEntityExtractor();
  const sourceEntities = extractor.extract(text);

  const pipeline = new TranslationPipeline({
    providers: [new FixtureProvider()],
    cache: memoryCache,
  });

  const sourceLang = options.source || 'fr';
  const targetLang = options.target;
  const domain = (options.domain as TranslationDomain) || 'financial';

  const result = await pipeline.process({
    id: randomUUID(),
    sourceText: text,
    sourceLang,
    targetLang,
    domain,
  });

  const translatedEntities = extractor.extract(result.translatedText);
  const comparison = extractor.compare(sourceEntities, translatedEntities);
  const safe = result.status !== 'unsafe' && comparison.safe;
  const exitCode = safe ? 0 : 1;

  const cliResult: CliTranslateResult = {
    result,
    safe,
    exitCode,
    sourceFingerprint: comparison.sourceFingerprint,
    translatedFingerprint: comparison.translatedFingerprint,
    sourceEntities,
    translatedEntities,
  };

  if (options.json) {
    printJson({
      id: result.id,
      sourceText: text,
      translatedText: result.translatedText,
      sourceLang: result.sourceLang,
      targetLang: result.targetLang,
      domain,
      provider: result.provider,
      status: result.status,
      safe,
      sourceFingerprint: comparison.sourceFingerprint,
      translatedFingerprint: comparison.translatedFingerprint,
      phonetic: result.phonetic,
      entities: sourceEntities,
      translatedEntities,
      warnings: result.warnings,
      latencyMs: result.latencyMs,
    });
  } else {
    console.log('\n--- LinguaBridge Translation ---');
    console.log(`Source [${result.sourceLang}]:       "${text}"`);
    console.log(`Translation [${result.targetLang}]:  "${result.translatedText}"`);
    if (result.phonetic) {
      console.log(`Phonetic:           "${result.phonetic}"`);
    }
    console.log(`Status:             ${result.status === 'success' ? '\x1b[32msuccess\x1b[0m' : result.status}`);
    console.log(`Zero-Drift AST:     ${safe ? '\x1b[32mSAFE (Verified)\x1b[0m' : '\x1b[31mUNSAFE (Entity drift)\x1b[0m'}`);
    console.log(`Fingerprint:        ${comparison.sourceFingerprint}`);

    console.log('\n[Live Financial Entity Detection]');
    if (sourceEntities.length === 0) {
      console.log('  No financial entities detected.');
    } else {
      for (const e of sourceEntities) {
        console.log(`  - [${e.type}] "${e.raw}" => normalized: "${e.normalized}"`);
      }
    }

    if (result.warnings.length > 0) {
      console.log('\n[Warnings]');
      for (const w of result.warnings) {
        console.log(`  ⚠ ${w}`);
      }
    }
    console.log('--------------------------------\n');
  }

  process.exitCode = exitCode;
  if (options.exit !== false && !process.env.VITEST) {
    process.exit(exitCode);
  }

  return cliResult;
}
