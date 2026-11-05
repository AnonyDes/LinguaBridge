import { FinancialEntityExtractor } from '@linguabridge/financial-domain';
import { printJson, printError } from '../utils/output';

const MAX_PAYLOAD_CHARS = 50_000;

export interface VerifyOptions {
  json?: boolean;
  verbose?: boolean;
  exit?: boolean;
}

export interface VerifyResult {
  safe: boolean;
  exitCode: number;
  sourceFingerprint: string;
  translatedFingerprint: string;
  sourceEntities: ReturnType<FinancialEntityExtractor['extract']>;
  translatedEntities: ReturnType<FinancialEntityExtractor['extract']>;
  violations: Array<{
    issue: string;
    sourceValue: string;
    translatedValue?: string;
  }>;
}

export async function runVerify(
  text: string,
  translation: string,
  options: VerifyOptions = {}
): Promise<VerifyResult> {
  const safeText = typeof text === 'string' ? text : '';
  const safeTranslation = typeof translation === 'string' ? translation : '';

  if (safeText.length > MAX_PAYLOAD_CHARS || safeTranslation.length > MAX_PAYLOAD_CHARS) {
    printError(`Payload exceeds maximum allowed size of ${MAX_PAYLOAD_CHARS} characters.`);
    process.exitCode = 1;
    if (options.exit !== false && !process.env.VITEST) {
      process.exit(1);
    }
    return {
      safe: false,
      exitCode: 1,
      sourceFingerprint: '0000000000000000000000000000000000000000000000000000000000000000',
      translatedFingerprint: '0000000000000000000000000000000000000000000000000000000000000000',
      sourceEntities: [],
      translatedEntities: [],
      violations: [{ issue: 'PAYLOAD_TOO_LARGE', sourceValue: `length: ${safeText.length}` }],
    };
  }

  const extractor = new FinancialEntityExtractor();
  const sourceEntities = extractor.extract(safeText);
  const translatedEntities = extractor.extract(safeTranslation);
  const comparison = extractor.compare(sourceEntities, translatedEntities);

  const safe = comparison.safe;
  const exitCode = safe ? 0 : 1;

  const result: VerifyResult = {
    safe,
    exitCode,
    sourceFingerprint: comparison.sourceFingerprint,
    translatedFingerprint: comparison.translatedFingerprint,
    sourceEntities,
    translatedEntities,
    violations: comparison.violations.map((v) => ({
      issue: v.issue,
      sourceValue: v.sourceValue,
      translatedValue: v.translatedValue,
    })),
  };

  if (options.json) {
    printJson(result);
  } else {
    console.log('\n--- LinguaBridge Zero-Drift AST Verification ---');
    console.log(`Source text:       "${safeText}"`);
    console.log(`Translation:       "${safeTranslation}"`);
    console.log(`Status:            ${safe ? '\x1b[32mSAFE (Zero Drift Verified)\x1b[0m' : '\x1b[31mUNSAFE (Financial Drift Detected!)\x1b[0m'}`);
    console.log(`Source Hash:       ${comparison.sourceFingerprint}`);
    console.log(`Target Hash:       ${comparison.translatedFingerprint}`);
    console.log(`Entities Verified: ${sourceEntities.length} source / ${translatedEntities.length} target`);

    if (options.verbose) {
      console.log('\n[Source Entities]');
      if (sourceEntities.length === 0) {
        console.log('  (none)');
      } else {
        for (const e of sourceEntities) {
          console.log(`  - [${e.type}] "${e.raw}" => normalized: "${e.normalized}"`);
        }
      }

      console.log('\n[Target Entities]');
      if (translatedEntities.length === 0) {
        console.log('  (none)');
      } else {
        for (const e of translatedEntities) {
          console.log(`  - [${e.type}] "${e.raw}" => normalized: "${e.normalized}"`);
        }
      }
    }

    if (!safe) {
      console.log('\n\x1b[31m[Integrity Violations]\x1b[0m');
      for (const v of comparison.violations) {
        console.log(`  ✖ ${v.issue}`);
      }
    }
    console.log('------------------------------------------------\n');
  }

  process.exitCode = exitCode;
  if (options.exit !== false && !process.env.VITEST) {
    process.exit(exitCode);
  }

  return result;
}
