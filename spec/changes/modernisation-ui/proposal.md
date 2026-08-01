# Proposal: Modernisation UI/UX du site vitrine

## Why

Le site est en ligne et sa direction artistique est aboutie (palette terracotta/ivoire
sur fond `#070707`, Satoshi + Inter, esprit minimaliste premium). Ce qui manque n'est
pas du style, c'est de la **structure** : le design vit dans 905 attributs `style`
inline recopiés à la main, sans échelle d'espacement ni tokens partagés. Résultat —
cinq rayons de bordure différents, trois recettes de carte incompatibles, un bloc
d'en-tête de section dupliqué huit fois, et une couche motion (GSAP/ScrollTrigger/Lenis,
déjà solide) qui n'atteint jamais les cartes.

En parallèle, trois problèmes coûtent aujourd'hui, mesurablement :

- **Poids** : les images référencées pèsent ~100 Mo d'originaux. `laure-mobile.png`
  fait 19 Mo, `laure-principal.jpg` 5,6 Mo est servi dans une carte 4/3 de l'accueil
  sans WebP, `laure-fagbohoun-avis.png` fait 1,2 Mo pour un avatar de 54 × 54 px.
  34 `<img>` sur 47 n'ont ni `width` ni `height` (CLS).
- **`sitemap.xml` cassé** : il liste 4 URLs dont 3 anciennes URLs `.dc.html`
  aujourd'hui redirigées en 301. `/portfolio`, `/services`, `/a-propos`, `/contact`
  et les 4 études de cas n'y figurent pas.
- **Contenu dupliqué** : `build-static.mjs` ne résout pas les placeholders
  `display:{{ dServices }}`. Un crawler sans JS voit donc les 9 écrans du site sur
  chaque URL.

**Règle d'or du chantier** : la palette et les typographies ne bougent pas. Les tokens
introduits *enregistrent* les valeurs existantes, ils ne les redéfinissent pas.

## Contrainte structurante

`index.html` est la **source unique**. Le runtime `x-dc` (`support.js`, généré, à ne
jamais éditer) interprète les `{{ bindings }}`, `onClick` et `style-hover` — ce dernier
étant compilé à l'exécution en règles `.scpN:hover`. Les 8 pages `portfolio/`,
`services/`, `a-propos/`, `contact/` et `portfolio/<projet>/` sont **générées** par
`node build-static.mjs` et ne doivent jamais être éditées à la main. Les 3 pages
légales sont maintenues séparément.

## What Changes

### Phase 0 · Socle de tokens (aucun changement visuel)

Un bloc `<style>` unique dans `<helmet>` de `index.html` :

- `:root` déclarant les valeurs **déjà en place** — couleurs (`--bs-terracotta:#C87A53`,
  `--bs-ink:#070707`, `--bs-sand:#B99E83`, `--bs-brown:#2A1C14`…), échelle d'espacement
  dérivée des `clamp()` existants, rayons, easings (`cubic-bezier(0.16,1,0.3,1)`) et durées.
- 5 classes utilitaires pour les motifs copiés-collés : `.bs-section`, `.bs-shell`,
  `.bs-eyebrow`, `.bs-card`, `.bs-sechead`.

Le reste des styles inline est conservé tel quel. Diff maîtrisé, régression visuelle nulle.

### Phase 1 · Performance & Core Web Vitals

- Dérivés **AVIF** générés avec `sips` (natif macOS) aux largeurs réelles d'affichage,
  plus un fallback JPEG redimensionné pour les fichiers dépourvus de WebP. Chaîne
  `<picture>` AVIF → WebP → JPEG/PNG. Les originaux restent intacts.
- `width`/`height` sur les 47 `<img>`, `loading`/`decoding` sur les 10 qui en manquent.
- Avatars ré-encodés à leur taille d'affichage réelle.
- `defer` sur GSAP, ScrollTrigger et Lenis.
- Vidéo hero : `poster` + `preload="none"` + démarrage différé. Le ré-encodage du
  fichier de 16 Mo est **hors de portée** — `ffmpeg` n'est pas installé sur la machine.
- `nginx.conf` : cache long sur les assets.

### Phase 2 · Structure & rythme visuel

Échelle d'espacement unifiée sur les ~20 sections · recettes de carte harmonisées
(rayon, padding, bordure, ombre) · en-têtes de section réalignés (le
`align-items:flex-end` actuel décale le lien face aux titres sur deux lignes) ·
parité des cartes portfolio entre l'accueil et la landing · rééquilibrage de
l'éventail témoignages, dessiné pour trois cartes mais n'en contenant que deux.

### Phase 3 · Micro-interactions

Extension du ScrollTrigger existant aux cartes et listes avec stagger · easings et
durées unifiés via les tokens de la Phase 0 · zoom image sur les cartes portfolio de
l'accueil, à parité avec `[data-bs-work]` · états `:active` et focus renforcés. Tout
reste sous `prefers-reduced-motion`.

### Phase 4 · SEO & accessibilité

- `<main>` + lien d'évitement (aucun landmark aujourd'hui).
- `build-static.mjs` résout les `{{ dXxx }}` par page → fin du contenu dupliqué.
- `sitemap.xml` reconstruit : 9 URLs réelles + 3 pages légales.
- Pages légales : `lang="fr"`, canonical, meta description.
- Schema enrichi : `LocalBusiness` + `geo` + `priceRange` + `logo` ; `BreadcrumbList`
  par page ; `CreativeWork` par étude de cas ; `Review` + `AggregateRating` à partir
  des deux témoignages 5★ réels déjà présents.
- Contrastes remontés au AA — `rgba(255,255,255,0.42)` sur `#070707` plafonne à 3,4:1.

## Impact

- **Fichiers édités** : `index.html` (toutes phases), `build-static.mjs` (Phase 4),
  `sitemap.xml` (Phase 4), `nginx.conf` (Phase 1), les 3 pages légales (Phase 4).
- **Fichiers ajoutés** : ~30 dérivés AVIF/JPEG dans `assets/`.
- **Fichiers régénérés** : les 8 pages pré-rendues, via `node build-static.mjs`.
- **Jamais touchés** : `support.js` (runtime généré), `server/`, la palette, les typographies.
- **Validation** : chaque phase est présentée et validée avant la suivante.
