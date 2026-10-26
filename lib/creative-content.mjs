import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const CREATIVE_PARTIALS = {
  accueil: 'home', services: 'services', about: 'about', contact: 'contact',
  portfolio: 'portfolio', 'portfolio-ejp-le-mag': 'ejp-le-mag',
};

// The gallery was released for redesign on 2026-10-26 at the user’s request.
// These four screens contain the existing work. Keep their authored
// markup, media, URLs and SEO intact while the surrounding studio evolves.
export const PROTECTED_PROJECT_PAGES = [
  'portfolio-ineeva', 'portfolio-acasa', 'portfolio-koryaa',
  'portfolio-laure-fagbohoun',
];

export function contentHash(value) {
  return createHash('sha256').update(value).digest('hex');
}

export function pageSection(html, page) {
  const openings = [...html.matchAll(/<section\b[^>]*\bdata-page="([^"]+)"[^>]*>/g)]
    .filter(match => match[1] === page);
  if (openings.length !== 1) throw new Error(`Section ${page} : ${openings.length} occurrence(s), une seule attendue.`);
  const opening = openings[0];
  const tags = /<\/?section\b[^>]*>/g;
  tags.lastIndex = opening.index + opening[0].length;
  let depth = 1, match;
  while ((match = tags.exec(html))) {
    depth += match[0].startsWith('</') ? -1 : 1;
    if (!depth) return { start: opening.index, end: tags.lastIndex, html: html.slice(opening.index, tags.lastIndex) };
  }
  throw new Error(`Section ${page} non fermée.`);
}

export function snapshotProjectSections(html) {
  return Object.fromEntries(PROTECTED_PROJECT_PAGES.map(page => [page, pageSection(html, page).html]));
}

export function restoreProjectSections(html, sections) {
  for (const [page, original] of Object.entries(sections)) {
    const section = pageSection(html, page);
    html = html.slice(0, section.start) + original + html.slice(section.end);
  }
  return html;
}

export function injectCreativeContent(html, root) {
  for (const [page, partial] of Object.entries(CREATIVE_PARTIALS)) {
    const file = join(root, 'content', `${partial}.html`);
    const replacement = readFileSync(file, 'utf8').trim();
    const authored = pageSection(replacement, page);
    if (authored.start !== 0 || authored.end !== replacement.length) {
      throw new Error(`${file} doit contenir uniquement la section data-page="${page}".`);
    }
    const current = pageSection(html, page);
    html = html.slice(0, current.start) + replacement + html.slice(current.end);
  }
  return html;
}

// LiquidButton generates sequential SVG filter IDs. New homepage buttons must
// not collide with the IDs retained verbatim in the frozen case-study screens.
export function namespaceCreativeFilters(html) {
  return html.replaceAll('liquid-glass-site-', 'liquid-glass-creative-site-');
}

export function assertProtectedProjects(root, html, { seo, pageMeta, routes } = {}) {
  const manifest = JSON.parse(readFileSync(join(root, 'content/protected-projects.json'), 'utf8'));
  const changed = [];
  for (const [page, hash] of Object.entries(manifest.sections)) {
    if (contentHash(pageSection(html, page).html) !== hash) changed.push(`section ${page}`);
  }
  for (const [file, hash] of Object.entries(manifest.files)) {
    if (contentHash(readFileSync(join(root, file))) !== hash) changed.push(file);
  }
  for (const [name, values] of Object.entries({ seo, pageMeta, routes })) {
    if (!values) continue;
    for (const [page, hash] of Object.entries(manifest[name])) {
      if (contentHash(JSON.stringify(values[page])) !== hash) changed.push(`${name}.${page}`);
    }
  }
  if (changed.length) {
    throw new Error(`Projets protégés : modification détectée (${changed.join(', ')}). Le build est arrêté pour préserver les études de cas.`);
  }
  return manifest;
}
