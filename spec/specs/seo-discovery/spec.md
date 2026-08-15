# Specification: SEO Discovery Files

### Requirement: robots.txt exposé et conforme

The system SHALL exposer un fichier `robots.txt` à la racine du domaine
(`https://brenartstudio.fr/robots.txt`), en UTF-8 texte brut et conforme
RFC 9309, servi avec un `Content-Type` `text/plain` et un statut `200`.

Le fichier SHALL autoriser le crawl du site (`User-agent: *`, `Allow: /`),
interdire `/api/`, et déclarer le sitemap via une ligne
`Sitemap: https://brenartstudio.fr/sitemap.xml` en URL absolue. Les crawlers IA
SHALL rester autorisés (pas de blocage de GPTBot ou équivalents), en cohérence
avec l'objectif GEO et la présence de `llms.txt`.

#### Scenario: robots.txt servi

- GIVEN l'application Node démarrée
- WHEN un crawler requête `GET /robots.txt`
- THEN le serveur répond `200` avec `Content-Type: text/plain`
- AND le corps contient `Sitemap: https://brenartstudio.fr/sitemap.xml`
- AND la ligne `Disallow: /api/` est présente

#### Scenario: Pas de blocage accidentel

- GIVEN le fichier `robots.txt`
- WHEN un moteur évalue l'accès à `/` et aux pages légales
- THEN aucune directive `Disallow` ne bloque ces chemins

### Requirement: Sitemap XML des pages canoniques

The system SHALL exposer un `sitemap.xml` à la racine
(`https://brenartstudio.fr/sitemap.xml`), XML valide au schéma
`http://www.sitemaps.org/schemas/sitemap/0.9`, servi en `200`.

Le sitemap SHALL lister uniquement les URL canoniques indexables en HTTPS :
la page d'accueil `/` et les 3 pages légales. Les `<loc>` des pages légales
SHALL être percent-encodées (espaces, apostrophe, accents). Chaque `<url>`
SHALL porter un `<lastmod>`. Le sitemap SHALL NOT contenir de `<priority>`,
de `<changefreq>`, ni les ancres internes de la SPA (`#services`, `#portfolio`…).

#### Scenario: Sitemap valide et complet

- GIVEN l'application démarrée
- WHEN un crawler requête `GET /sitemap.xml`
- THEN le serveur répond `200` avec un XML valide
- AND il contient `<loc>https://brenartstudio.fr/</loc>`
- AND il contient les 3 URL de pages légales percent-encodées
- AND aucune balise `<priority>` ni `<changefreq>` n'est présente

#### Scenario: Toutes les URL sont accessibles

- GIVEN les `<loc>` déclarées dans le sitemap
- WHEN chacune est requêtée
- THEN elle répond `200` (encodage d'URL correct pour les pages légales)

### Requirement: llms.txt pour la découverte IA (GEO)

The system SHALL exposer un `llms.txt` à la racine
(`https://brenartstudio.fr/llms.txt`), au format Markdown de la convention
llms.txt, servi en `200` avec `Content-Type` `text/plain`.

Le fichier SHALL commencer par un titre H1 (`# Bren'Art Studio`) suivi
immédiatement d'une description en blockquote de moins de 200 caractères, puis
de liens absolus vers les pages avec descriptions concises et factuelles. Les
faits clés (services, offres, zone géographique, contact) SHALL être cohérents
avec le JSON-LD `ProfessionalService` d'`index.html`.

#### Scenario: llms.txt servi et conforme

- GIVEN l'application démarrée
- WHEN un assistant IA requête `GET /llms.txt`
- THEN le serveur répond `200` avec `Content-Type: text/plain`
- AND la première ligne est un titre H1 avec le nom du studio
- AND une description en blockquote (`>`) suit immédiatement
- AND les liens vers les pages sont des URL absolues valides

### Requirement: Exposition via l'allowlist du serveur

WHEN les fichiers de découverte sont ajoutés à la racine,
the system SHALL les exposer en les ajoutant explicitement à l'allowlist
`ALLOWED_ROOT_FILES` de `server/index.js`, sans affaiblir le default-deny
existant : tout chemin non listé SHALL continuer de renvoyer `404`.

#### Scenario: Fichiers de découverte accessibles

- GIVEN `/robots.txt`, `/sitemap.xml`, `/llms.txt` ajoutés à l'allowlist
- WHEN chacun est requêté
- THEN le serveur répond `200`

#### Scenario: Default-deny préservé

- GIVEN un chemin racine non listé (ex. `/.env`, `/package.json`)
- WHEN il est requêté
- THEN le serveur répond `404`
