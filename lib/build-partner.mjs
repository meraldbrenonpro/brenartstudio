import { build } from 'esbuild';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

let renderMarkup;

/** Share React/Motion across optional islands; never apply React to the surrounding site. */
export async function buildPartner(root) {
  const temporary = mkdtempSync(join(root, '.partner-build-'));
  try {
    const renderOutput = join(temporary, 'render.mjs');
    await build({
      entryPoints: [join(root, 'components/partner-render.tsx')], outfile: renderOutput,
      bundle: true, platform: 'node', format: 'esm', packages: 'external', target: ['node20'],
      tsconfig: join(root, 'tsconfig.json'), legalComments: 'none',
    });
    renderMarkup = (await import(pathToFileURL(renderOutput).href)).renderPartnerConfigurator;

    const output = join(root, 'assets/partner-configurator.js');
    await build({
      entryPoints: [join(root, 'components/studio-islands.ts')], outfile: output,
      bundle: true, minify: true, format: 'esm', target: ['es2020'],
      tsconfig: join(root, 'tsconfig.json'), define: { 'process.env.NODE_ENV': '"production"' },
      legalComments: 'eof',
    });
    const bundle = readFileSync(output);
    const version = createHash('sha256').update(bundle).digest('hex').slice(0, 16);
    const loaderOutput = join(root, 'assets/partner.js');
    await build({
      entryPoints: [join(root, 'components/partner-loader.ts')], outfile: loaderOutput,
      bundle: true, minify: true, format: 'iife', target: ['es2020'], external: ['/assets/*'],
      define: { __PARTNER_MODULE__: JSON.stringify(`/assets/partner-configurator.js?v=${version}`) },
      legalComments: 'none',
    });
    return { version, loaderBytes: readFileSync(loaderOutput).length, configuratorBytes: bundle.length };
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
}

/** Call after buildPartner; ids must be unique in the static x-dc document. */
export function renderPartnerConfigurator(options) {
  if (!renderMarkup) throw new Error('Call buildPartner before rendering a partner configurator');
  return renderMarkup(options);
}
