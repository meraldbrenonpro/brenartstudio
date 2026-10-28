// Read-only checks for the explicit case-study boundary. No build or media edit.
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assertProtectedProjects, CREATIVE_PARTIALS, injectCreativeContent,
  namespaceCreativeFilters, pageSection, restoreProjectSections, snapshotProjectSections,
} from '../lib/creative-content.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const source = readFileSync(join(root, 'index.html'), 'utf8');
const buildSource = readFileSync(join(root, 'build-static.mjs'), 'utf8');
// These are trusted, authored object literals already executed by the build.
const literal = (text, pattern) => {
  const match = text.match(pattern);
  assert(match, `Source object not found: ${pattern}`);
  return Function(`return (${match[1]});`)();
};
const metadata = {
  seo: literal(source, /_seo\(page\)\s*\{[\s\S]*?const M = (\{[\s\S]*?\n    \});/),
  pageMeta: literal(buildSource, /const PAGE_META = (\{[\s\S]*?\n\});/),
  routes: literal(buildSource, /const PAGE_TO_PATH = (\{[\s\S]*?\n\});/),
};
const manifest = assertProtectedProjects(root, source, metadata);
const snapshots = snapshotProjectSections(source);

// This explicitly withdrawn project must never reappear in a build or in a
// frozen document reached directly from an old bookmark.
const withdrawn = 'icc-ejp-toulouse';
assert.equal(existsSync(join(root, 'portfolio', withdrawn, 'index.html')), false);
const publicFiles = [
  'index.html', 'portfolio/index.html', 'services/index.html', 'a-propos/index.html',
  'contact/index.html', 'content/home.html', 'sitemap.xml', 'llms.txt',
  ...['ineeva', 'acasa', 'koryaa', 'laure-fagbohoun'].map(name => `portfolio/${name}/index.html`),
];
for (const file of publicFiles) {
  assert(!readFileSync(join(root, file), 'utf8').includes('icc-ejp'), `${file} must not publish the withdrawn project`);
}
assert.equal((pageSection(source, 'portfolio').html.match(/data-project-card=/g) || []).length, 5);
for (const slug of ['koryaa', 'acasa', 'ineeva', 'laure-fagbohoun', 'ejp-le-mag']) {
  assert(pageSection(source, 'portfolio').html.includes(`/portfolio/${slug}`));
}
assert(!pageSection(source, 'accueil').html.includes('data-studio-video'));
assert(pageSection(source, 'portfolio-ejp-le-mag').html.includes('ejp-le-mag-cover-1600.webp'));
assert(!Object.values(metadata.routes).some(route => route.includes(withdrawn)));


// Case studies are now explicitly editable; media and metadata stay protected.
for (const slug of ['ineeva', 'acasa', 'koryaa', 'laure-fagbohoun']) {
  assert(CREATIVE_PARTIALS[`portfolio-${slug}`]);
  assert(pageSection(readFileSync(join(root, `content/case-${slug}.html`), 'utf8'), `portfolio-${slug}`));
}
for (const key of ['seo', 'pageMeta', 'routes']) {
  const changed = structuredClone(metadata);
  changed[key]['portfolio-acasa'] = 'Changed';
  assert.throws(() => assertProtectedProjects(root, source, changed), new RegExp(`${key}\\.portfolio-acasa`));
}

// Exercise partial replacement independently of the current editorial content.
const temporary = mkdtempSync(join(tmpdir(), 'brenart-content-'));
try {
  mkdirSync(join(temporary, 'content'));
  for (const [page, file] of Object.entries(CREATIVE_PARTIALS)) {
    writeFileSync(join(temporary, 'content', `${file}.html`), `<section data-page="${page}"><section><p>Updated ${page}</p></section></section>\n`);
  }
  const injected = injectCreativeContent(source, temporary);
  for (const page of Object.keys(CREATIVE_PARTIALS)) assert(pageSection(injected, page).html.includes(`Updated ${page}`));
  assert.deepEqual(snapshotProjectSections(injected), snapshots);

  // Mimic the sequential renumbering done by LiquidButton, then restore work.
  const rendered = namespaceCreativeFilters(injected.replace(/liquid-glass-(?:creative-)?site-\d+/g, 'liquid-glass-site-5'));
  const restored = restoreProjectSections(rendered, snapshots);
  assert.deepEqual(snapshotProjectSections(restored), snapshots);
  assert(restored.includes('liquid-glass-creative-site-5'));
  assertProtectedProjects(root, restored, metadata);

  writeFileSync(join(temporary, 'content/home.html'), '<section data-page="accueil">Unclosed');
  assert.throws(() => injectCreativeContent(source, temporary), /non fermée/);
} finally {
  rmSync(temporary, { recursive: true, force: true });
}

assert.match(buildSource, /if \(PROTECTED_PROJECT_PAGES\.includes\(page\)\) continue;/);
console.log(`PASS: ${Object.keys(manifest.sections).length} exact project sections, ${Object.keys(manifest.files).length} protected files, SEO/routes/CreativeWork metadata, partial isolation and stable project filter IDs.`);
