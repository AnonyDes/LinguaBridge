import { describe, it, expect } from 'vitest';
import { createCliProgram } from '../index';

describe('Commander CLI Program', () => {
  it('registers all required subcommands and flags', () => {
    const program = createCliProgram({ exitOverride: true });

    const commandNames = program.commands.map((c) => c.name());
    expect(commandNames).toContain('translate');
    expect(commandNames).toContain('verify');
    expect(commandNames).toContain('pack');
    expect(commandNames).toContain('serve');
    expect(commandNames).toContain('audit');

    const packCmd = program.commands.find((c) => c.name() === 'pack');
    expect(packCmd).toBeDefined();
    const packSubcommands = packCmd?.commands.map((c) => c.name());
    expect(packSubcommands).toContain('lint');
  });

  it('prints version information', () => {
    const program = createCliProgram({ exitOverride: true });
    expect(program.version()).toBe('0.1.0');
  });

  it('executes verify via parseAsync successfully', async () => {
    const program = createCliProgram({ exitOverride: true });

    // Should not throw on valid verification
    await expect(
      program.parseAsync([
        'node',
        'lb',
        'verify',
        'Solde: 50 000 FCFA',
        'Móni mí ne: 50 000 FCFA',
      ])
    ).resolves.toBeDefined();
  });
});
