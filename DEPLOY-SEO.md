# Déploiement SEO — Bren'Art Studio

Le site est une SPA (index.html + support.js) transformée en **pages statiques
pré-rendues**, une par URL propre, pour être bien indexée par Google.

## Architecture des URLs

| URL propre                     | Fichier généré                        | Page interne              |
|--------------------------------|---------------------------------------|---------------------------|
| `/`                            | `index.html`                          | accueil                   |
| `/portfolio`                   | `portfolio/index.html`                | portfolio                 |
| `/services`                    | `services/index.html`                 | services                  |
| `/a-propos`                    | `a-propos/index.html`                 | about                     |
| `/contact`                     | `contact/index.html`                  | contact                   |
| `/portfolio/ineeva`            | `portfolio/ineeva/index.html`         | portfolio-ineeva          |
| `/portfolio/acasa`             | `portfolio/acasa/index.html`          | portfolio-acasa           |
| `/portfolio/koryaa`            | `portfolio/koryaa/index.html`         | portfolio-koryaa          |
| `/portfolio/laure-fagbohoun`   | `portfolio/laure-fagbohoun/index.html`| portfolio-laure-fagbohoun |

Chaque page a son propre `<title>`, `meta description`, `canonical` et Open Graph
(source unique : la table `_seo()` dans `index.html`).

## Régénérer les pages après une modification

Toute modif de `index.html` (contenu, titres…) nécessite de régénérer :

```bash
node build-static.mjs
```

Le script est **idempotent** (ré-exécutable sans risque). Le `Dockerfile` le lance
automatiquement à chaque build, donc en déploiement Coolify c'est transparent.

## Déploiement Coolify (VPS Ubuntu + Nginx)

1. Pousser le repo (avec `Dockerfile`, `nginx.conf`, `build-static.mjs`).
2. Dans Coolify : **New Resource → Application → Dockerfile** (build pack Dockerfile),
   pointant sur ce repo/branche.
3. Port applicatif : **80**. Coolify gère le HTTPS (Let's Encrypt) via son proxy.
4. Domaine : `brenartstudio.fr` (+ `www` en redirection vers l'apex, à configurer
   dans Coolify).
5. Déployer. Le build regénère les pages puis les sert via Nginx (`nginx.conf` :
   URLs propres, compression gzip, cache assets, robots/sitemap).

## Après mise en ligne (à faire une fois)

- [ ] Google Search Console : ajouter la propriété `brenartstudio.fr`, soumettre
      `https://brenartstudio.fr/sitemap.xml`.
- [ ] Vérifier chaque URL avec l'outil d'inspection d'URL (rendu + indexation).
- [ ] Créer l'image `og-image.jpg` (1200×630) à la racine — référencée dans le
      `<head>` mais actuellement **manquante** (aperçu réseaux sociaux cassé sinon).
- [ ] Créer/optimiser la fiche **Google Business Profile** (SEO local Toulouse).
