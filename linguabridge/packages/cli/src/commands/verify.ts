import { FinancialEntityExtractor } from '@linguabridge/financial-domain';
import { printJson } from '../utils/output';

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
  const extractor = new FinancialEntityExtractor();
  const sourceEntities = extractor.extract(text);
  const translatedEntities = extractor.extract(translation);
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
    console.log(`Source text:       "${text}"`);
    console.log(`Translation:       "${translation}"`);
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
