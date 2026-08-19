#!/usr/bin/env node
// ---------------------------------------------------------------------------
// build-static.mjs — Pré-rendu SEO du site Bren'Art Studio
//
// Transforme la SPA (index.html) en un jeu de pages statiques, une par URL
// propre (/portfolio, /services, /a-propos, /contact, /portfolio/<projet>).
// Chaque page reçoit son <title>, sa meta description, son canonical et ses
// balises Open Graph corrects — ce que Google et les réseaux sociaux lisent
// SANS exécuter le JavaScript. Le SPA prend ensuite le relais et rend le bon
// contenu (le routeur lit l'URL réelle).
//
// Ré-exécutable : `node build-static.mjs` après chaque modif de index.html.
// ---------------------------------------------------------------------------
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const SRC = join(ROOT, 'index.html');

// page interne  ->  URL propre (doit rester synchro avec le routeur d'index.html)
const PAGE_TO_PATH = {
  'accueil': '/',
  'portfolio': '/portfolio',
  'services': '/services',
  'about': '/a-propos',
  'contact': '/contact',
  'portfolio-ineeva': '/portfolio/ineeva',
  'portfolio-acasa': '/portfolio/acasa',
  'portfolio-koryaa': '/portfolio/koryaa',
  'portfolio-laure-fagbohoun': '/portfolio/laure-fagbohoun',
};
const ORIGIN = 'https://brenartstudio.fr';

// Fil d'ariane + fiche d'œuvre par page. Une seule source ici, injectée au build,
// plutôt que neuf blocs JSON-LD recopiés à la main dans index.html.
const PAGE_META = {
  'portfolio':      { crumb: 'Portfolio' },
  'services':       { crumb: 'Services' },
  'about':          { crumb: 'À propos' },
  'contact':        { crumb: 'Contact' },
  'portfolio-ineeva': {
    crumb: 'Ineeva', parent: ['Portfolio', '/portfolio'],
    work: { name: 'Ineeva — identité de marque',
            about: "Identité visuelle et présence en ligne d'une association",
            genre: 'Identité de marque' } },
  'portfolio-acasa': {
    crumb: 'Acasa', parent: ['Portfolio', '/portfolio'],
    work: { name: 'Acasa — identité de marque',
            about: "Identité visuelle d'un magasin de meubles",
            genre: 'Identité de marque' } },
  'portfolio-koryaa': {
    crumb: 'Koryaa', parent: ['Portfolio', '/portfolio'],
    work: { name: 'Koryaa — identité de marque',
            about: "Identité visuelle d'une marque de cosmétique capillaire",
            genre: 'Identité de marque' } },
  'portfolio-laure-fagbohoun': {
    crumb: 'Laure Fagbohoun', parent: ['Portfolio', '/portfolio'],
    work: { name: 'Laure Fagbohoun — site vitrine',
            about: "Site vitrine d'autrice et conférencière",
            genre: 'Site web' } },
};

// --- 1. Extraire la table SEO _seo() depuis index.html (source unique) ------
function extractSeoMap(html) {
  const anchor = html.indexOf('_seo(page)');
  if (anchor < 0) throw new Error('Bloc _seo introuvable dans index.html');
  const start = html.indexOf('const M = {', anchor);
  if (start < 0) throw new Error('Objet « const M = { » introuvable');
  // lecture à comptage d'accolades à partir du premier {
  let i = html.indexOf('{', start), depth = 0, end = -1;
  for (let j = i; j < html.length; j++) {
    const c = html[j];
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) { end = j; break; } }
  }
  if (end < 0) throw new Error('Accolade fermante de M introuvable');
  const objText = html.slice(i, end + 1);
  // eslint-disable-next-line no-eval
  return (0, eval)('(' + objText + ')'); // fichier maison : eval maîtrisé
}

// --- 2. Transformer le HTML pour une page donnée ---------------------------
function escAttr(s) { return String(s).replace(/"/g, '&quot;'); }

function transform(html, page, seo) {
  const path = PAGE_TO_PATH[page];
  const url = ORIGIN + (path === '/' ? '/' : path);
  let out = html;

  // Le build réécrit index.html PAR-DESSUS sa propre source (la page d'accueil).
  // On retire donc les injections d'un build précédent avant d'en poser de
  // nouvelles, sinon elles s'empileraient à chaque exécution.
  out = out.replace(/<style id="bs-prerender">[\s\S]*?<\/style>\s*/g, '');
  out = out.replace(/<!--bs-page-ld-->[\s\S]*?<!--\/bs-page-ld-->\s*/g, '');

  // <base href="/"> pour que assets/ et support.js résolvent depuis la racine
  if (!/<base\s/i.test(out)) {
    out = out.replace(/(<meta charset="utf-8">)/i, '$1\n<base href="/">');
  }

  // <title>
  out = out.replace(/<title>[\s\S]*?<\/title>/i, `<title>${seo.t}</title>`);

  // meta description
  out = out.replace(
    /(<meta name="description" content=")[\s\S]*?(">)/i,
    `$1${escAttr(seo.d)}$2`
  );

  // canonical
  out = out.replace(
    /(<link rel="canonical" href=")[\s\S]*?(">)/i,
    `$1${url}$2`
  );

  // Open Graph + Twitter
  out = out.replace(/(<meta property="og:title" content=")[\s\S]*?(">)/i, `$1${escAttr(seo.t)}$2`);
  out = out.replace(/(<meta property="og:description" content=")[\s\S]*?(">)/i, `$1${escAttr(seo.d)}$2`);
  out = out.replace(/(<meta property="og:url" content=")[\s\S]*?(">)/i, `$1${url}$2`);
  out = out.replace(/(<meta name="twitter:title" content=")[\s\S]*?(">)/i, `$1${escAttr(seo.t)}$2`);
  out = out.replace(/(<meta name="twitter:description" content=")[\s\S]*?(">)/i, `$1${escAttr(seo.d)}$2`);

  // Liens internes #cle -> URL propre (meilleur crawl + partage)
  for (const [key, p] of Object.entries(PAGE_TO_PATH)) {
    out = out.replaceAll(`href="#${key}"`, `href="${p}"`);
  }

  // --- Pré-rendu : n'afficher QUE l'écran de cette URL ---------------------
  // Le markup porte « display:{{ dServices }} ». Sans JS, cette déclaration est
  // invalide donc ignorée par le moteur CSS : les 9 écrans s'affichaient tous, sur
  // chacune des 9 URL. Un crawler sans JS voyait donc le site entier neuf fois.
  //
  // On ne peut pas remplacer le placeholder par « none » en dur : le runtime x-dc
  // perdrait son point d'ancrage et ne pourrait plus jamais réafficher la section.
  // On passe donc par une feuille de style, que le style inline écrit par le runtime
  // écrase dès l'hydratation — l'ordre de priorité CSS fait le travail.
  // Même mécanique pour les blocs conditionnels (accusé de réception du formulaire,
  // message d'erreur, libellé « Envoi… », couche motion) : avant hydratation leur
  // « display:{{ x }} » est invalide, donc ignoré, et ils s'affichaient tous en même
  // temps. On les masque par défaut ; le style inline écrit par le runtime reprend
  // la main dès l'hydratation.
  out = out.replace('</head>',
    `<style id="bs-prerender">section[data-page]{display:none}` +
    `section[data-page="${page}"]{display:block}` +
    `[data-bs-prehide]{display:none}</style>\n</head>`);

  // --- JSON-LD par page : fil d'ariane + fiche d'œuvre ---------------------
  const meta = PAGE_META[page];
  if (meta) {
    const items = [{ '@type': 'ListItem', position: 1, name: 'Accueil', item: ORIGIN + '/' }];
    if (meta.parent) {
      items.push({ '@type': 'ListItem', position: 2, name: meta.parent[0], item: ORIGIN + meta.parent[1] });
    }
    items.push({ '@type': 'ListItem', position: items.length + 1, name: meta.crumb, item: url });

    const blocks = [{ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items }];

    if (meta.work) {
      blocks.push({
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        name: meta.work.name,
        about: meta.work.about,
        genre: meta.work.genre,
        url,
        inLanguage: 'fr-FR',
        creator: { '@id': ORIGIN + '/#studio' },
      });
    }

    const ld = blocks
      .map((b) => `<script type="application/ld+json">\n${JSON.stringify(b, null, 2)}\n</script>`)
      .join('\n');
    out = out.replace('</head>', `<!--bs-page-ld-->\n${ld}\n<!--/bs-page-ld-->\n</head>`);
  }

  return out;
}

// --- 3. Génération ----------------------------------------------------------
const html = readFileSync(SRC, 'utf8');
const M = extractSeoMap(html);

let count = 0;
for (const [page, path] of Object.entries(PAGE_TO_PATH)) {
  const seo = M[page];
  if (!seo) { console.warn(`⚠︎  pas d'entrée SEO pour « ${page} », ignorée`); continue; }
  const rel = path === '/' ? 'index.html' : join(path.slice(1), 'index.html');
  const dest = join(ROOT, rel);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, transform(html, page, seo), 'utf8');
  console.log(`✓  ${path.padEnd(28)} →  ${rel}`);
  count++;
}
console.log(`\n${count} page(s) générée(s).`);
