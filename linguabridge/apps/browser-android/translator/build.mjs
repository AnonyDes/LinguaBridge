import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const requireFromEngine = createRequire(new URL('../../../packages/translation-engine/package.json', import.meta.url));
const requireFromTsup = createRequire(requireFromEngine.resolve('tsup/package.json'));
const { build } = requireFromTsup('esbuild');
const destination = process.argv[2];
if (!destination) throw new Error('An output path is required.');

await build({
  entryPoints: [fileURLToPath(new URL('./entry.ts', import.meta.url))],
  outfile: resolve(destination),
  alias: {
    '@linguabridge/financial-domain': fileURLToPath(new URL('../../../packages/financial-domain/src/index.ts', import.meta.url)),
  },
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: 'es2022',
  minify: true,
  legalComments: 'eof',
});
