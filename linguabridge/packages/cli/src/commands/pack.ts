import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { ManifestValidator } from '@linguabridge/language-registry';
import type { LanguagePackManifest } from '@linguabridge/shared-types';
import { printJson, printError, printSuccess } from '../utils/output';

export interface PackLintOptions {
  strict?: boolean;
  json?: boolean;
  exit?: boolean;
}

export interface PackLintResult {
  valid: boolean;
  exitCode: number;
  packId?: string;
  packName?: string;
  locale?: string;
  qualityStatus?: string;
  status?: string;
  checks: Array<{
    name: string;
    passed: boolean;
    message?: string;
  }>;
  errors: string[];
  warnings: string[];
}

export async function runPackLint(
  targetPath: string,
  options: PackLintOptions = {}
): Promise<PackLintResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const checks: PackLintResult['checks'] = [];

  const resolved = resolve(process.cwd(), targetPath);

  if (!existsSync(resolved)) {
    const msg = `Target path does not exist: "${targetPath}"`;
    errors.push(msg);
    checks.push({ name: 'Path existence', passed: false, message: msg });

    const result: PackLintResult = {
      valid: false,
      exitCode: 1,
      checks,
      errors,
      warnings,
    };

    if (options.json) {
      printJson(result);
    } else {
      printError(msg);
    }

    process.exitCode = 1;
    if (options.exit !== false && !process.env.VITEST) {
      process.exit(1);
    }
    return result;
  }

  let packDir: string;
  let manifestPath: string;

  const isDirectory = statSync(resolved).isDirectory();
  if (isDirectory) {
    packDir = resolved;
    manifestPath = join(resolved, 'manifest.json');
  } else {
    manifestPath = resolved;
    packDir = dirname(resolved);
  }

  if (!existsSync(manifestPath)) {
    const msg = `manifest.json not found in "${packDir}"`;
    errors.push(msg);
    checks.push({ name: 'Manifest presence', passed: false, message: msg });

    const result: PackLintResult = {
      valid: false,
      exitCode: 1,
      checks,
      errors,
      warnings,
    };

    if (options.json) {
      printJson(result);
    } else {
      printError(msg);
    }

    process.exitCode = 1;
    if (options.exit !== false && !process.env.VITEST) {
      process.exit(1);
    }
    return result;
  }

  checks.push({ name: 'Manifest presence', passed: true });

  let rawManifest: unknown;
  try {
    const content = readFileSync(manifestPath, 'utf8');
    rawManifest = JSON.parse(content);
    checks.push({ name: 'Manifest JSON syntax', passed: true });
  } catch (err) {
    const msg = `Invalid JSON in manifest.json: ${(err as Error).message}`;
    errors.push(msg);
    checks.push({ name: 'Manifest JSON syntax', passed: false, message: msg });

    const result: PackLintResult = {
      valid: false,
      exitCode: 1,
      checks,
      errors,
      warnings,
    };

    if (options.json) {
      printJson(result);
    } else {
      printError(msg);
    }

    process.exitCode = 1;
    if (options.exit !== false && !process.env.VITEST) {
      process.exit(1);
    }
    return result;
  }

  // Schema validation
  const validation = ManifestValidator.safeParse(rawManifest);
  if (!validation.success) {
    for (const issue of validation.error.issues) {
      const field = issue.path.join('.');
      errors.push(`Schema error at "${field}": ${issue.message}`);
    }
    checks.push({
      name: 'Schema validation',
      passed: false,
      message: `${validation.error.issues.length} schema issues detected`,
    });
  } else {
    checks.push({ name: 'Schema validation', passed: true });
  }

  const manifest = rawManifest as Partial<LanguagePackManifest> & {
    dictionaries?: string[];
  };

  // Isolation Compliance & Certification Check
  // Rule 1: unverified pack CANNOT be marked production_approved
  if (manifest.qualityStatus === 'unverified' && manifest.status === 'production_approved') {
    const msg = 'Isolation compliance failure: Pack with "unverified" quality cannot be marked as "production_approved".';
    errors.push(msg);
    checks.push({ name: 'Isolation compliance', passed: false, message: msg });
  } else {
    checks.push({ name: 'Isolation compliance', passed: true });
  }

  // Rule 2: Rejects uncertified manifests
  if (manifest.qualityStatus !== 'certified' && manifest.qualityStatus !== 'reviewed') {
    const msg = `Certification check failure: Pack qualityStatus is "${manifest.qualityStatus || 'unknown'}". Certified national language pack required.`;
    errors.push(msg);
    checks.push({ name: 'Certification verification', passed: false, message: msg });
  } else {
    checks.push({ name: 'Certification verification', passed: true });
  }

  // Rule 3: Production approved pack must have linguistic capabilities
  if (manifest.status === 'production_approved') {
    const hasGlossary = manifest.capabilities?.hasGlossary;
    const hasDictionary = manifest.capabilities?.hasDictionary;
    if (!hasGlossary && !hasDictionary) {
      const msg = 'Production approved pack must have glossary or dictionary capabilities enabled.';
      errors.push(msg);
      checks.push({ name: 'Linguistic capabilities', passed: false, message: msg });
    } else {
      checks.push({ name: 'Linguistic capabilities', passed: true });
    }
  }

  // Glossary and dictionary validation
  let termCount = 0;
  const dictList = Array.isArray(manifest.dictionaries)
    ? manifest.dictionaries
    : existsSync(join(packDir, 'dictionaries', 'financial-glossary.json'))
      ? ['dictionaries/financial-glossary.json']
      : [];

  if (dictList.length > 0) {
    for (const relPath of dictList) {
      const fullPath = join(packDir, relPath);
      if (!existsSync(fullPath)) {
        const msg = `Referenced dictionary not found: "${relPath}"`;
        errors.push(msg);
        checks.push({ name: `Dictionary file: ${relPath}`, passed: false, message: msg });
      } else {
        try {
          const dictContent = JSON.parse(readFileSync(fullPath, 'utf8'));
          if (Array.isArray(dictContent.terms)) {
            termCount += dictContent.terms.length;
            if (dictContent.terms.length === 0) {
              warnings.push(`Dictionary "${relPath}" contains 0 terms.`);
            }
          }
          checks.push({ name: `Dictionary file: ${relPath}`, passed: true });
        } catch (err) {
          const msg = `Failed to parse dictionary JSON "${relPath}": ${(err as Error).message}`;
          errors.push(msg);
          checks.push({ name: `Dictionary file: ${relPath}`, passed: false, message: msg });
        }
      }
    }
  } else if (manifest.capabilities?.hasGlossary) {
    const msg = 'Pack declares hasGlossary: true, but no dictionaries are referenced or found.';
    errors.push(msg);
    checks.push({ name: 'Glossary presence', passed: false, message: msg });
  }

  const valid = errors.length === 0;
  const exitCode = valid ? 0 : 1;

  const result: PackLintResult = {
    valid,
    exitCode,
    packId: manifest.id,
    packName: manifest.name,
    locale: manifest.locale,
    qualityStatus: manifest.qualityStatus,
    status: manifest.status,
    checks,
    errors,
    warnings,
  };

  if (options.json) {
    printJson(result);
  } else {
    console.log('\n--- LinguaBridge Language Pack Manifest Linter ---');
    console.log(`Pack ID:        ${manifest.id || 'unknown'}`);
    console.log(`Name:           ${manifest.name || 'unknown'}`);
    console.log(`Locale:         ${manifest.locale || 'unknown'}`);
    console.log(`Quality Status: ${manifest.qualityStatus || 'unknown'}`);
    console.log(`Pack Status:    ${manifest.status || 'unknown'}`);
    console.log(`Terms Count:    ${termCount}`);
    console.log('\n[Validation Checks]');
    for (const c of checks) {
      if (c.passed) {
        console.log(`  \x1b[32m✔\x1b[0m ${c.name}`);
      } else {
        console.log(`  \x1b[31m✖\x1b[0m ${c.name}: ${c.message}`);
      }
    }

    if (warnings.length > 0) {
      console.log('\n[Warnings]');
      for (const w of warnings) {
        console.log(`  \x1b[33m⚠\x1b[0m ${w}`);
      }
    }

    console.log('\n--------------------------------------------------');
    if (valid) {
      printSuccess(`Pack "${manifest.id}" successfully passed all lint and isolation checks.`);
    } else {
      printError(`Pack validation failed with ${errors.length} error(s).`);
    }
    console.log('');
  }

  process.exitCode = exitCode;
  if (options.exit !== false && !process.env.VITEST) {
    process.exit(exitCode);
  }

  return result;
}
