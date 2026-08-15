# Proposal: Fichiers de découverte SEO/GEO (robots.txt, sitemap.xml, llms.txt)

## Why

Le site `brenartstudio.fr` n'expose aucun fichier de pilotage des robots :
pas de `robots.txt`, pas de `sitemap.xml`, pas de `llms.txt`. Conséquences :

- Les moteurs (Google, Bing) crawlent sans plan de site déclaré et sans
  directive de crawl — aucun signal explicite sur ce qui doit être exploré.
- Aucun contrôle sur les crawlers IA ni aucune aide à la compréhension du site
  par les assistants (GEO — Generative Engine Optimization). Or le studio veut
  être cité correctement par les IA.
- Le `<link rel="canonical">` et le JSON-LD `ProfessionalService` déjà présents
  dans `index.html` ne sont pas complétés par les fichiers de découverte
  standards attendus à la racine.

Objectif : ajouter trois fichiers **statiques, simples et conformes aux
standards** (RFC 9309 pour robots.txt, protocole sitemaps.org 0.9, convention
llms.txt) pour améliorer le référencement et la visibilité IA, sans toucher au
contenu ni au design du site.

## Contrainte structurante

Le serveur (`server/index.js`, Hono) applique un **default-deny** : seuls les
chemins listés dans `ALLOWED_ROOT_FILES` / `ALLOWED_ROOT_DIRS` sont servis, tout
le reste renvoie `404`. Un fichier déposé à la racine n'est **pas** accessible
tant qu'il n'est pas ajouté à l'allowlist. C'est le point d'intégration central
de ce change : sans cette modification, `/robots.txt`, `/sitemap.xml` et
`/llms.txt` renverraient `404`.

`serveStatic` de Hono fixe le `Content-Type` d'après l'extension :
`.txt` → `text/plain`, `.xml` → `application/xml` — corrects pour les trois
fichiers (llms.txt étant du Markdown servi en `text/plain`, ce qui est attendu).

## What Changes

- **`robots.txt`** (racine) : `User-agent: *` `Allow: /`, `Disallow: /api/`
  (l'endpoint de contact n'a pas à être crawlé), et déclaration
  `Sitemap: https://brenartstudio.fr/sitemap.xml`. Crawlers IA **autorisés**
  (cohérent avec l'ajout de llms.txt et l'objectif GEO).
- **`sitemap.xml`** (racine) : les URL canoniques réellement indexables —
  la page d'accueil `/` et les 3 pages légales (Mentions légales, CGV,
  Confidentialité), avec `<lastmod>`. Pas de `<priority>` ni `<changefreq>`
  (ignorés par Google). Les ancres de la SPA (`#services`, `#portfolio`, …) ne
  sont **pas** des URL distinctes → non listées.
- **`llms.txt`** (racine) : résumé Markdown du studio (nom, description en une
  phrase, offres Essentiel/Signature/…, portfolio, contact) et liens vers les
  pages, généré selon la convention via le skill `geo-llmstxt`.
- **`server/index.js`** : ajout de `/robots.txt`, `/sitemap.xml`, `/llms.txt`
  à `ALLOWED_ROOT_FILES`. Aucune autre logique modifiée.

## URLs des pages légales (encodage sitemap)

Les fichiers légaux contiennent espaces, apostrophe et accents ; dans le sitemap
les `<loc>` SHALL être percent-encodées :

- `https://brenartstudio.fr/CGV%20-%20Bren%27Art%20Studio.dc.html`
- `https://brenartstudio.fr/Confidentialit%C3%A9%20-%20Bren%27Art%20Studio.dc.html`
- `https://brenartstudio.fr/Mentions%20l%C3%A9gales%20-%20Bren%27Art%20Studio.dc.html`

## Impact

- **Fichiers ajoutés** : `robots.txt`, `sitemap.xml`, `llms.txt` (racine).
- **Fichier édité** : `server/index.js` (allowlist uniquement, ~3 lignes).
- **Aucun impact** sur le contenu, le design, les routes hash, les assets, le
  formulaire de contact ou le déploiement (mêmes build/start Nixpacks).
- **Maintenance** : `sitemap.xml` et `llms.txt` sont statiques ; à mettre à jour
  manuellement si de nouvelles pages/offres apparaissent (site à faible
  fréquence de changement → acceptable, pas de génération dynamique nécessaire).
- **Specs** : nouvelle capability `seo-discovery`.
- **Hors périmètre** : la balise `og:image` pointe vers `https://brenartstudio.fr/og-image.jpg`
  qui n'existe pas encore à la racine — à traiter séparément.
