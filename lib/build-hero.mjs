import { build } from 'esbuild';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export async function buildHero(root, { bottomNavVersion }) {
  const cursorOutput = join(root, 'assets/magnetic-cursor.js');
  await build({
    entryPoints: [join(root, 'lib/magnetic-cursor.ts')], outfile: cursorOutput,
    bundle: true, minify: true, format: 'esm', target: ['es2020'],
    tsconfig: join(root, 'tsconfig.json'), legalComments: 'eof',
  });
  const cursorVersion = createHash('sha256').update(readFileSync(cursorOutput)).digest('hex').slice(0, 16);
  const output = join(root, 'assets/hero-dot-field.js');
  await build({
    entryPoints: [join(root, 'components/hero-dot-field.tsx')],
    outfile: output, bundle: true, minify: true, format: 'esm', target: ['es2020'],
    tsconfig: join(root, 'tsconfig.json'),
    define: { 'process.env.NODE_ENV': '"production"' },
    legalComments: 'eof',
  });
  const version = createHash('sha256').update(readFileSync(output)).digest('hex').slice(0, 16);
  await build({
    entryPoints: [join(root, 'components/hero-dot-field-loader.ts')],
    outfile: join(root, 'assets/hero-dot-field-loader.js'),
    bundle: true, minify: true, format: 'iife', target: ['es2020'],
    external: ['/assets/*'],
    define: {
      __BOTTOM_NAV_MODULE__: JSON.stringify(`/assets/partner-configurator.js?v=${bottomNavVersion}`),
      __DOT_FIELD_MODULE__: JSON.stringify(`/assets/hero-dot-field.js?v=${version}`),
      __MAGNETIC_CURSOR_MODULE__: JSON.stringify(`/assets/magnetic-cursor.js?v=${cursorVersion}`),
    },
  });
}
