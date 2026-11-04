import { describe, it, expect } from 'vitest';
import { runAudit } from '../commands/audit';

describe('lb audit command', () => {
  it('reports operational status READY with exitCode 0', async () => {
    const report = await runAudit({ exit: false });

    expect(report.status).toBe('READY');
    expect(report.exitCode).toBe(0);
    expect(report.engineReadiness.healthy).toBe(true);
    expect(report.engineReadiness.testTranslation.safe).toBe(true);
    expect(report.engineReadiness.testTranslation.sourceFingerprint).toMatch(/^[a-f0-9]{64}$/);
    expect(report.runtime.nodeVersion).toBeTruthy();
    expect(report.languagePacks.totalPacks).toBeGreaterThanOrEqual(1);
    expect(report.languagePacks.certifiedPacks).toBeGreaterThanOrEqual(1);

    const ewondoPack = report.languagePacks.packs.find((p) => p.id === 'ewondo');
    expect(ewondoPack).toBeDefined();
    expect(ewondoPack?.isCertified).toBe(true);
  });

  it('supports JSON output format', async () => {
    const report = await runAudit({ json: true, exit: false });

    expect(report).toHaveProperty('status');
    expect(report).toHaveProperty('runtime');
    expect(report).toHaveProperty('environment');
    expect(report).toHaveProperty('languagePacks');
    expect(report).toHaveProperty('engineReadiness');
  });
});
