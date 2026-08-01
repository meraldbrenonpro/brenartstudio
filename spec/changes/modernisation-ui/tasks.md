# Implementation Tasks

Chaque phase se termine par `node build-static.mjs` + vérification visuelle, puis
validation explicite avant la phase suivante.

## Phase 0 · Socle de tokens

1. Dans `index.html`, bloc `<helmet>` : ajouter un `<style>` `:root` déclarant les
   valeurs **relevées dans l'existant** — couleurs (`--bs-terracotta:#C87A53`,
   `--bs-terracotta-hi:#D89265`, `--bs-terracotta-nav:#BE7E59`, `--bs-ink:#070707`,
   `--bs-ivory:#FFFFFF`, `--bs-sand:#B99E83`, `--bs-brown:#2A1C14`, `--bs-brown-line:#4E3D30`,
   `--bs-espresso:#221610`), rayons (`--bs-r-card:20px`, `--bs-r-lg:22px`, `--bs-r-xl:28px`),
   easings (`--bs-ease:cubic-bezier(0.16,1,0.3,1)`, `--bs-ease-nav:cubic-bezier(0.625,0.05,0,1)`),
   durées (`--bs-t-fast:.2s`, `--bs-t:.3s`, `--bs-t-slow:.65s`).
2. Ajouter l'échelle d'espacement dérivée des `clamp()` déjà utilisés :
   `--bs-pad-section:clamp(70px,9vw,130px)`, `--bs-pad-x:clamp(20px,4vw,48px)`,
   `--bs-gap-head:clamp(40px,5vw,64px)`, `--bs-shell:1280px`.
3. Créer les 5 classes utilitaires : `.bs-section` (padding vertical + horizontal),
   `.bs-shell` (`max-width` + centrage), `.bs-eyebrow` (filet 24px + label capitales),
   `.bs-card` (fond, bordure, rayon, padding, ombre), `.bs-sechead` (eyebrow + titre + lien).
4. Migrer **uniquement** les occurrences strictement identiques de ces 5 motifs vers les
   classes. Ne pas toucher aux styles inline qui portent une valeur spécifique.
5. Vérifier au navigateur qu'aucun écran n'a bougé (accueil, portfolio, services,
   à-propos, contact, une étude de cas), desktop et mobile.

## Phase 1 · Performance

> **⚠ À savoir avant toute régénération d'images.** `sips` (l'encodeur macOS utilisé
> faute de `ffmpeg`) **échoue silencieusement** sur une partie des conversions AVIF :
> le fichier produit a les bonnes dimensions et un poids plausible, mais Chrome le
> rend entièrement transparent. Sur 54 dérivés, 10 étaient dans ce cas — tous sur des
> images à canal alpha ou à certaines largeurs précises. Une reprise à 90 % de la
> largeur en a récupéré 6.
> **Conséquence : chaque dérivé doit être vérifié au navigateur** (dessin sur canvas
> et lecture de l'alpha moyen) avant d'être référencé. Le contrôle vit dans
> `scratchpad/cmp-layout.html` et la routine de vérification AVIF. Installer `ffmpeg`
> rendrait ce garde-fou inutile et permettrait de compresser la vidéo hero de 16 Mo.

1. Script de génération des dérivés AVIF via `sips -s format avif`, aux largeurs
   réelles d'affichage. Fallback JPEG redimensionné pour `laure-*`, `koryaa-*` et les
   avatars, qui n'ont pas de WebP.
2. Contrôle visuel avant/après sur 3 images représentatives avant de valider l'encodage.
3. Réécrire les `<picture>` en chaîne AVIF → WebP → JPEG/PNG. Ajouter `<source>` AVIF
   aux 17 `<picture>` existants ; convertir en `<picture>` les `<img>` nus concernés.
4. Ajouter `width`/`height` (dimensions intrinsèques) aux 34 `<img>` qui en manquent,
   `loading="lazy"` + `decoding="async"` aux 10 sans attribut — sauf le logo du hero,
   qui garde `fetchpriority="high"`.
5. Ré-encoder `laure-fagbohoun-avis.png` (1,2 Mo) et `ineeva-avatar.png` (152 Ko) à
   108 px (54 px × 2 pour le rétina).
6. `defer` sur les 3 scripts CDN. Vérifier que `support.js` et le bloc `data-dc-script`
   tolèrent le chargement différé (la couche motion a déjà un garde `window.gsap`).
7. Vidéo hero : `preload="none"`, attribut `poster` sur une image AVIF légère extraite
   de la première frame, démarrage à l'`IntersectionObserver`.
8. `nginx.conf` : `expires 1y` + `immutable` sur les dérivés versionnés.

## Phase 2 · Structure & rythme

1. Appliquer `.bs-section` / `.bs-shell` aux ~20 blocs de section, en supprimant les
   `padding`/`max-width` inline redondants.
2. Harmoniser les 3 recettes de carte sur `.bs-card` + modificateurs (`--ivory`,
   `--glass`, `--brown`) : même rayon, même padding, même logique d'ombre.
3. Corriger l'alignement des en-têtes de section : le lien de droite doit s'aligner sur
   la **dernière ligne de base** du titre, pas sur le bas du bloc.
4. Cartes portfolio de l'accueil : reprendre le cadre et le rapport d'image de
   `[data-bs-work]` pour la parité avec la landing portfolio.
5. Éventail témoignages : rééquilibrer la composition à deux cartes (angles, décalages,
   ordre de profondeur) pour qu'elle lise comme un choix, pas comme une carte manquante.
6. Grille de tarifs : hauteurs de blocs cohérentes, listes alignées entre les 3 offres.

## Phase 3 · Micro-interactions

1. Déclarer un helper `revealStagger` dans le bloc `data-dc-script`, adossé au
   ScrollTrigger existant, et le brancher sur les grilles de cartes (services, méthode,
   tarifs, témoignages, FAQ, outils).
2. Remplacer les 5 couples durée/easing divergents par les tokens de la Phase 0.
3. Cartes portfolio de l'accueil : zoom `scale(1.045)` sur l'image et atténuation des
   voisines, à parité avec `[data-bs-works-grid]`.
4. États `:active` sur tous les boutons et CTA ; renforcer `:focus-visible` sur les
   cartes cliquables (aujourd'hui seul un contour global existe).
5. Vérifier que chaque ajout est neutralisé sous `prefers-reduced-motion`.

## Phase 4 · SEO & accessibilité

1. Envelopper les 9 `<section data-page>` dans un `<main>` ; ajouter un lien
   d'évitement vers `#bs-main` en tête de `<body>`.
2. `build-static.mjs` : remplacer `display:{{ dXxx }}` par `block` pour la page
   générée et `none` pour les 8 autres, avant écriture. Vérifier que le runtime
   `x-dc` réécrit bien ces valeurs à l'hydratation sans flash.
3. Reconstruire `sitemap.xml` : `/`, `/portfolio`, `/services`, `/a-propos`, `/contact`,
   les 4 `/portfolio/<projet>`, `/mentions-legales`, `/cgv`, `/confidentialite`.
   Supprimer les 3 anciennes URLs `.dc.html` redirigées.
4. Pages légales (`mentions-legales/`, `cgv/`, `confidentialite/`) : `<html lang="fr">`,
   `<link rel="canonical">`, `<meta name="description">`.
5. Enrichir le JSON-LD `ProfessionalService` : `geo` (Toulouse), `priceRange`, `logo`,
   `image`, `telephone` si le studio en publie un.
6. Ajouter `BreadcrumbList` par page et `CreativeWork` par étude de cas, injectés par
   `build-static.mjs` (une seule source, pas de duplication manuelle).
7. Ajouter `Review` × 2 et `AggregateRating` à partir des témoignages Ineeva et
   Laure Fagbohoun déjà présents dans le markup.
8. Remonter au AA les textes sous 4,5:1 — `rgba(255,255,255,0.42)` et `0.45` sur fond
   `#070707`, en restant dans la gamme de gris existante.
9. Corriger les blocs d'étoiles : `role="img"` porté par l'élément qui a l'`aria-label`.

---

## Notes d'exécution

**Runtime x-dc — piège majeur.** Le bloc `data-dc-script` est évalué d'un seul tenant
par `new Function()`. Un identifiant en double (ex. deux `const blocks` dans la même
portée) lève une `SyntaxError` qui fait échouer **toute la classe logique** : les
placeholders `{{ }}` restent bruts, le routage meurt, la page entière tombe. Rien
n'est détecté au build. Vérifier la syntaxe du bloc après chaque modification.

**Feuille de pré-rendu.** `build-static.mjs` n'écrit pas `display:none` en dur (le
runtime perdrait son ancrage) mais injecte `<style id="bs-prerender">`. Le style
inline écrit par le runtime l'écrase à l'hydratation. Vérifié : le routage client et
le bouton Précédent fonctionnent toujours ; sans JS, une seule section est rendue.

**Idempotence du build.** `build-static.mjs` réécrit `index.html` par-dessus sa propre
source : les injections (feuille de pré-rendu, JSON-LD par page) sont délimitées et
retirées avant réinjection. Vérifié sur trois exécutions successives.

**SRI.** L'URL de Lenis a dû être épinglée à `1.3.25` : elle pointait sur la plage
flottante `lenis@1`. Toute montée de version impose de recalculer l'empreinte
(sinon le navigateur bloque le script).

**Contraste — reste deux points liés à la palette**, non corrigés faute de mandat sur
la DA : le blanc sur terracotta `#C87A53` (3,3:1) et le terracotta sur fond sombre en
petit corps (3,3:1). Options calculées, sans sortir de la palette existante :
l'encre `#221610` sur terracotta donne 5,35:1 (précédent : bouton « Choisir
Signature »), et `--bs-terracotta-hi` `#D89265` sur `#070707` donne 7,88:1.

