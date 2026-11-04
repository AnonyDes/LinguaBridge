import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { FinancialEntityExtractor } from '@linguabridge/financial-domain';
import { FixtureProvider } from '@linguabridge/translation-engine';
import { resolveLanguagePacksDir } from '../utils/pack-locator';
import { printJson, printSuccess, printError } from '../utils/output';

export interface AuditOptions {
  json?: boolean;
  exit?: boolean;
}

export interface PackAuditInfo {
  id: string;
  name: string;
  locale: string;
  status: string;
  qualityStatus: string;
  isCertified: boolean;
  termCount?: number;
}

export interface AuditReport {
  status: 'READY' | 'DEGRADED' | 'FAILED';
  exitCode: number;
  runtime: {
    nodeVersion: string;
    platform: string;
    arch: string;
    pid: number;
  };
  environment: {
    nodeEnv: string;
    openRouterConfigured: boolean;
    libreTranslateConfigured: boolean;
    offlineMode: boolean;
    packsDir: string | null;
  };
  languagePacks: {
    totalPacks: number;
    certifiedPacks: number;
    quarantinedPacks: number;
    packs: PackAuditInfo[];
  };
  engineReadiness: {
    healthy: boolean;
    provider: string;
    testTranslation: {
      source: string;
      translated: string;
      safe: boolean;
      sourceFingerprint: string;
      translatedFingerprint: string;
    };
  };
}

export async function runAudit(options: AuditOptions = {}): Promise<AuditReport> {
  const packsDir = resolveLanguagePacksDir();
  const packsList: PackAuditInfo[] = [];

  let certifiedCount = 0;
  let quarantinedCount = 0;

  if (packsDir && existsSync(packsDir)) {
    try {
      const entries = readdirSync(packsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('_') && !entry.name.startsWith('.')) {
          const manifestFile = join(packsDir, entry.name, 'manifest.json');
          if (existsSync(manifestFile)) {
            try {
              const manifest = JSON.parse(readFileSync(manifestFile, 'utf8'));
              const isCertified = manifest.qualityStatus === 'certified';

              let termCount = 0;
              const glossaryFile = join(packsDir, entry.name, 'dictionaries', 'financial-glossary.json');
              if (existsSync(glossaryFile)) {
                try {
                  const glossary = JSON.parse(readFileSync(glossaryFile, 'utf8'));
                  if (Array.isArray(glossary.terms)) {
                    termCount = glossary.terms.length;
                  }
                } catch {
                  // ignore
                }
              }

              if (isCertified) {
                certifiedCount++;
              } else {
                quarantinedCount++;
              }

              packsList.push({
                id: manifest.id || entry.name,
                name: manifest.name || entry.name,
                locale: manifest.locale || 'unknown',
                status: manifest.status || 'unknown',
                qualityStatus: manifest.qualityStatus || 'unknown',
                isCertified,
                termCount: termCount > 0 ? termCount : undefined,
              });
            } catch {
              // ignore
            }
          }
        }
      }
    } catch {
      // ignore
    }
  }

  // Engine Readiness Test
  const provider = new FixtureProvider();
  const extractor = new FinancialEntityExtractor();

  const testSource = 'Solde: 15 000 FCFA';
  let testTranslated = '';
  let engineHealthy = false;
  let safe = false;
  let sourceFingerprint = '';
  let translatedFingerprint = '';

  try {
    const translationResult = await provider.translate({
      id: 'audit-test-id',
      sourceText: testSource,
      sourceLang: 'fr',
      targetLang: 'ewo-CM',
      domain: 'financial',
    });

    testTranslated = translationResult.translatedText;
    const sourceEntities = extractor.extract(testSource);
    const translatedEntities = extractor.extract(testTranslated);
    const comparison = extractor.compare(sourceEntities, translatedEntities);

    sourceFingerprint = comparison.sourceFingerprint;
    translatedFingerprint = comparison.translatedFingerprint;
    safe = comparison.safe;
    engineHealthy = safe && translationResult.status === 'success';
  } catch {
    engineHealthy = false;
  }

  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const libreTranslateUrl = process.env.LIBRETRANSLATE_URL;
  const isReady = engineHealthy && certifiedCount > 0;
  const overallStatus: AuditReport['status'] = isReady ? 'READY' : 'DEGRADED';
  const exitCode = isReady ? 0 : 1;

  const report: AuditReport = {
    status: overallStatus,
    exitCode,
    runtime: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
    },
    environment: {
      nodeEnv: process.env.NODE_ENV || 'development',
      openRouterConfigured: Boolean(openRouterKey && openRouterKey.length > 5),
      libreTranslateConfigured: Boolean(libreTranslateUrl && libreTranslateUrl.length > 5),
      offlineMode: !openRouterKey && !libreTranslateUrl,
      packsDir,
    },
    languagePacks: {
      totalPacks: packsList.length,
      certifiedPacks: certifiedCount,
      quarantinedPacks: quarantinedCount,
      packs: packsList,
    },
    engineReadiness: {
      healthy: engineHealthy,
      provider: provider.name,
      testTranslation: {
        source: testSource,
        translated: testTranslated,
        safe,
        sourceFingerprint,
        translatedFingerprint,
      },
    },
  };

  if (options.json) {
    printJson(report);
  } else {
    console.log('\n======================================================');
    console.log('       LinguaBridge Local System Sanity Audit         ');
    console.log('======================================================');
    console.log(`Status:              ${overallStatus === 'READY' ? '\x1b[32mREADY\x1b[0m' : '\x1b[31m' + overallStatus + '\x1b[0m'}`);
    console.log(`Node Runtime:        ${report.runtime.nodeVersion} (${report.runtime.platform} ${report.runtime.arch})`);
    console.log(`Environment:         ${report.environment.nodeEnv}`);
    console.log(`Offline Mode:        ${report.environment.offlineMode ? 'Active (using local lexicon)' : 'Hybrid'}`);
    console.log(`OpenRouter API Key:  ${report.environment.openRouterConfigured ? 'Configured' : 'Not set (offline fallback)'}`);
    console.log(`LibreTranslate:      ${report.environment.libreTranslateConfigured ? 'Configured' : 'Not set'}`);
    console.log(`Packs Directory:     ${report.environment.packsDir || 'Not resolved'}`);

    console.log('\n[National Language Packs]');
    console.log(`Total detected:      ${report.languagePacks.totalPacks}`);
    console.log(`Certified active:    ${report.languagePacks.certifiedPacks}`);
    console.log(`Quarantined:         ${report.languagePacks.quarantinedPacks}`);

    for (const p of report.languagePacks.packs) {
      const badge = p.isCertified ? '\x1b[32m[CERTIFIED]\x1b[0m' : '\x1b[33m[QUARANTINED]\x1b[0m';
      const terms = p.termCount ? ` (${p.termCount} terms)` : '';
      console.log(`  - ${badge} ${p.name} (${p.locale}) - status: ${p.status}${terms}`);
    }

    console.log('\n[Core Translation & Zero-Drift Engine]');
    console.log(`Provider:            ${report.engineReadiness.provider}`);
    console.log(`Test Source:         "${report.engineReadiness.testTranslation.source}"`);
    console.log(`Test Output:         "${report.engineReadiness.testTranslation.translated}"`);
    console.log(`Zero-Drift Status:   ${report.engineReadiness.testTranslation.safe ? '\x1b[32mSAFE (Verified)\x1b[0m' : '\x1b[31mUNSAFE\x1b[0m'}`);
    console.log(`SHA-256 Hash:        ${report.engineReadiness.testTranslation.sourceFingerprint}`);
    console.log('======================================================');

    if (isReady) {
      printSuccess('LinguaBridge engine is operational and ready for deployment.');
    } else {
      printError('LinguaBridge reported degraded engine readiness or missing certified packs.');
    }
    console.log('');
  }

  process.exitCode = exitCode;
  if (options.exit !== false && !process.env.VITEST) {
    process.exit(exitCode);
  }

  return report;
}
