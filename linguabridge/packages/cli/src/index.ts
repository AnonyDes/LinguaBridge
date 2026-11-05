import { Command } from 'commander';
import { runTranslate, type TranslateOptions } from './commands/translate';
import { runVerify, type VerifyOptions } from './commands/verify';
import { runPackLint, type PackLintOptions } from './commands/pack';
import { runServe, type ServeOptions } from './commands/serve';
import { runAudit, type AuditOptions } from './commands/audit';
import { runLanguages, type LanguagesOptions } from './commands/languages';

export { runTranslate, type TranslateOptions, type CliTranslateResult } from './commands/translate';
export { runVerify, type VerifyOptions, type VerifyResult } from './commands/verify';
export { runPackLint, type PackLintOptions, type PackLintResult } from './commands/pack';
export { runServe, type ServeOptions } from './commands/serve';
export { runAudit, type AuditOptions, type AuditReport } from './commands/audit';
export { runLanguages, type LanguagesOptions, type LanguagesReport, type LanguageInfo } from './commands/languages';
export { createMockServer, startMockServer, type MockServerInstance } from './server';

export interface CliProgramOptions {
  exitOverride?: boolean;
}

export function createCliProgram(options: CliProgramOptions = {}): Command {
  const program = new Command();

  program
    .name('lb')
    .description('LinguaBridge CLI — Developer Command Line Interface with Cryptographic Zero-Drift Financial Protection')
    .version('0.1.0', '-V, --version', 'Output the current version of @linguabridge/cli');

  if (options.exitOverride) {
    program.exitOverride();
  }

  // 1. lb translate <text> --target <lang> / --to <lang>
  program
    .command('translate [text]')
    .description('Interactive and non-interactive translation with live financial entity detection')
    .option('-t, --target <lang>', 'Target language code (e.g. ewo-CM, fuv-CM, hau-CM, knc-CM, pcm-CM)')
    .option('--to <lang>', 'Target language code alias')
    .option('-s, --source <lang>', 'Source language code (default: fr)', 'fr')
    .option('--from <lang>', 'Source language code alias')
    .option('-d, --domain <domain>', 'Translation domain (financial, healthcare, etc.)', 'financial')
    .option('--json', 'Output translation result and entity AST in JSON format')
    .action(async (text: string | undefined, cmdOptions: TranslateOptions) => {
      const effectiveTarget = cmdOptions.target || cmdOptions.to;
      const effectiveSource = cmdOptions.source || cmdOptions.from || 'fr';
      await runTranslate(text, {
        ...cmdOptions,
        target: effectiveTarget,
        source: effectiveSource,
        exit: !options.exitOverride,
      });
    });

  // 2. lb verify <text> <translation>
  program
    .command('verify <text> <translation>')
    .description('Standalone zero-drift AST verification returning cryptographic SHA-256 fingerprint matching status')
    .option('--json', 'Output verification result and fingerprints in JSON format')
    .option('-v, --verbose', 'Display detailed financial entity breakdown and hash tokens')
    .action(async (text: string, translation: string, cmdOptions: VerifyOptions) => {
      await runVerify(text, translation, {
        ...cmdOptions,
        exit: !options.exitOverride,
      });
    });

  // 3. lb languages
  program
    .command('languages')
    .alias('langs')
    .description('Enumerate active sovereign Cameroonian languages with Duala quarantine protection')
    .option('-a, --all', 'Include quarantined languages (e.g. Duala, Basaa, Bulu)')
    .option('--json', 'Output language report in JSON format')
    .action(async (cmdOptions: LanguagesOptions) => {
      await runLanguages({
        ...cmdOptions,
        exit: !options.exitOverride,
      });
    });

  // 4. lb pack lint <path>
  const packCommand = program
    .command('pack')
    .description('National language pack management and quality validation');

  packCommand
    .command('lint <path>')
    .description('Validation of national language pack manifests, certified glossaries, and isolation compliance')
    .option('--strict', 'Enforce strict certification and isolation rules')
    .option('--json', 'Output validation report in JSON format')
    .action(async (pathArg: string, cmdOptions: PackLintOptions) => {
      await runPackLint(pathArg, {
        ...cmdOptions,
        exit: !options.exitOverride,
      });
    });

  // 5. lb serve --port <port>
  program
    .command('serve')
    .description('Lightweight local mock translation server for offline developer testing without external services')
    .option('-p, --port <port>', 'Port to listen on', '3030')
    .option('-h, --host <host>', 'Host address to bind to', '127.0.0.1')
    .action(async (cmdOptions: ServeOptions) => {
      await runServe({
        ...cmdOptions,
        exit: !options.exitOverride,
      });
    });

  // 6. lb audit
  program
    .command('audit')
    .description('Local sanity check reporting environment keys, certified language packs, and engine readiness')
    .option('--json', 'Output audit report in JSON format')
    .action(async (cmdOptions: AuditOptions) => {
      await runAudit({
        ...cmdOptions,
        exit: !options.exitOverride,
      });
    });

  return program;
}

export async function runCli(argv: string[] = process.argv): Promise<void> {
  const program = createCliProgram();
  await program.parseAsync(argv);
}
