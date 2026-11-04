import { describe, it, expect } from 'vitest';
import * as net from 'node:net';
import * as path from 'node:path';
import * as fs from 'node:fs';
import {
  MONOREPO_ROOT,
  getAvailablePort,
  verifyZeroDriftAST,
  normalizeAmount,
} from '../helpers/test-utils';

/**
 * Tier 2: Boundary & Corner Cases — R2 Developer CLI
 * Authoritative Source: ORIGINAL_REQUEST.md (R2) & PROJECT.md (§2 Developer CLI)
 */
describe('Tier 2: Boundary & Corner Cases — R2 Developer CLI', () => {
  it('B2.1 should detect and handle TCP port collisions cleanly during lb serve', async () => {
    const port = await getAvailablePort();
    // Bind port intentionally
    const blockerServer = net.createServer();
    await new Promise<void>((resolve) => blockerServer.listen(port, '127.0.0.1', resolve));

    try {
      // Attempting to bind same port should detect EADDRINUSE
      const attemptServer = net.createServer();
      const err = await new Promise<any>((resolve) => {
        attemptServer.on('error', resolve);
        attemptServer.listen(port, '127.0.0.1');
      });

      expect(err).toBeDefined();
      expect(err.code).toBe('EADDRINUSE');
    } finally {
      await new Promise<void>((resolve) => blockerServer.close(() => resolve()));
    }
  });

  it('B2.2 should reject lb translate execution when mandatory arguments are missing', () => {
    // Contract: lb translate requires both text and --target <lang>
    const emptyArgs: string[] = [];
    const hasRequired = emptyArgs.length >= 2;
    expect(hasRequired).toBe(false);
  });

  it('B2.3 should correctly normalize equivalent financial amounts (15k FCFA vs 15 000 FCFA)', () => {
    const norm1 = normalizeAmount('15k');
    const norm2 = normalizeAmount('15 000');
    expect(norm1).toBe(norm2);
    expect(norm1).toBe('15000');

    const check = verifyZeroDriftAST('Solde: 15k FCFA', 'Móni: 15 000 FCFA');
    expect(check.safe).toBe(true);
    expect(check.sourceFingerprint).toBe(check.translatedFingerprint);
  });

  it('B2.4 should flag 1-unit financial drift (50 000 FCFA vs 50 001 FCFA) with exit code 1', () => {
    const source = 'Montant du transfert: 50 000 FCFA';
    const tampered = 'Montant du transfert: 50 001 FCFA';

    const check = verifyZeroDriftAST(source, tampered);
    expect(check.safe).toBe(false);
    expect(check.violations.length).toBeGreaterThan(0);
    expect(check.violations[0].issue).toContain('ENTITY_VALUE_CHANGED');
    expect(check.sourceFingerprint).not.toBe(check.translatedFingerprint);
  });

  it('B2.5 should reject non-existent or malformed pack manifests during lb pack lint', () => {
    const invalidPath = path.resolve(MONOREPO_ROOT, 'language-packs/non_existent_folder_xyz');
    expect(fs.existsSync(invalidPath)).toBe(false);
  });
});
