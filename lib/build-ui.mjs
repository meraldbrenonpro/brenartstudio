import { build, transform } from 'esbuild';
import { compile } from '@tailwindcss/node';
import { Scanner } from '@tailwindcss/oxide';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export async function buildLiquidButtons(html, root) {
  // A temporary local bundle lets Node execute the typed React component.
  // React stays external here and never becomes a client-side dependency.
  const temporary = mkdtempSync(join(root, '.liquid-build-'));
  try {
    const bundle = join(temporary, 'render.mjs');
    await build({
      entryPoints: [join(root, 'components/render-liquid-buttons.tsx')],
      outfile: bundle, bundle: true, platform: 'node', format: 'esm',
      packages: 'external', target: 'es2020', tsconfig: join(root, 'tsconfig.json'),
    });
    const { renderLiquidButtons } = await import(pathToFileURL(bundle).href);
    const rendered = renderLiquidButtons(html);
    const compiler = await compile(readFileSync(join(root, 'styles/liquid-glass.css'), 'utf8'), {
      base: join(root, 'styles'), onDependency() {},
    });
    // Utilities only come from our small React surface, never the legacy HTML.
    const scanner = new Scanner({ sources: [
      { base: root, pattern: 'components/**/*.{ts,tsx}', negated: false },
    ] });
    const candidates = scanner.scan();
    const css = compiler.build(candidates);
    const minified = await transform(css, { loader: 'css', minify: true });
    writeFileSync(join(root, 'assets/liquid-glass.css'), minified.code);
    return rendered;
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
}
