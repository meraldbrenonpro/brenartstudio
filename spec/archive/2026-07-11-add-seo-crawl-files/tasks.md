# Implementation Tasks

## robots.txt (skill `robots-txt`)

1. Créer `robots.txt` à la racine, UTF-8, conforme RFC 9309 :

   ```text
   User-agent: *
   Allow: /
   Disallow: /api/

   Sitemap: https://brenartstudio.fr/sitemap.xml
   ```

   Crawlers IA laissés autorisés (objectif GEO). Vérifier avec le skill
   `robots-txt` qu'aucun blocage accidentel n'est introduit.

## sitemap.xml (skill `seo-sitemap`)

1. Créer `sitemap.xml` à la racine (`urlset` xmlns sitemaps.org 0.9) avec les
   `<url>` canoniques : accueil `https://brenartstudio.fr/` + 3 pages légales
   (URLs percent-encodées, cf. proposal). Ajouter `<lastmod>` avec la date réelle
   de dernière modif de chaque fichier. **Ne pas** inclure `<priority>` /
   `<changefreq>`. HTTPS uniquement, une seule loc par page canonique.
2. Valider via le skill `seo-sitemap` : XML valide, < 50 000 URL, pas d'URL
   non-200, pas de doublon, sitemap déclaré dans `robots.txt`.

## llms.txt (skill `geo-llmstxt`)

1. Générer `llms.txt` à la racine avec le skill `geo-llmstxt` : `# Bren'Art Studio`,
   blockquote de description (< 200 car.), section listant la page d'accueil et
   les faits clés (services, offres Essentiel/Signature/…, zone Toulouse/France,
   contact) ; section `## Optional` pour les pages légales. Contenu factuel,
   sans fluff marketing, aligné sur le JSON-LD existant d'`index.html`.
2. Valider le format avec le skill `geo-llmstxt` (titre H1 en 1re ligne,
   blockquote juste après, liens absolus valides).

## Serveur (point d'intégration critique)

1. Éditer `server/index.js` : ajouter `/robots.txt`, `/sitemap.xml`, `/llms.txt`
   à `ALLOWED_ROOT_FILES`. Ne rien changer d'autre.

## Vérification

1. Local (`npm start`) : `curl -i` sur les trois URL →
   - `/robots.txt` → `200`, `Content-Type: text/plain`, corps attendu ;
   - `/sitemap.xml` → `200`, `Content-Type: application/xml` (ou `text/xml`) ;
   - `/llms.txt` → `200`, `text/plain`.

   Vérifier qu'un chemin non listé renvoie toujours `404` (default-deny intact).
2. Ouvrir chaque `<loc>` du sitemap → toutes renvoient `200` (encodage correct
   des pages légales).
3. Vérifier que le site (`/`), les pages légales et `POST /api/contact` restent
   inchangés.
