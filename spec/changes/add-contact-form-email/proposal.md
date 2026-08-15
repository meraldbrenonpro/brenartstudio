# Proposal: Formulaire de contact fonctionnel via Resend

## Why

Le formulaire de la page `#contact` (`index.html`) est **factice** : le handler
`submitForm` (`index.html:2040`) fait `e.preventDefault()` puis affiche le message
« Message bien reçu » sans jamais envoyer quoi que ce soit. Aucun email n'arrive.

Objectif : rendre le formulaire réellement fonctionnel pour que les prospects
puissent contacter le studio, avec les emails livrés à `contact@brenartstudio.fr`
et une réponse possible en un clic (le `Reply` répond directement au client).

**Contrainte structurante** : la clé API Resend est un **secret**. Elle ne peut pas
vivre dans le JavaScript client (visible par tout visiteur). L'envoi doit donc passer
par un point d'entrée **côté serveur**. Le site, aujourd'hui purement statique, doit
devenir une petite application Node servie par Coolify.

## What Changes

- **Nouveau backend minimal Node.js** (un seul service, un seul déploiement) :
  - sert les fichiers statiques existants (`index.html`, `assets/`, `uploads/`, pages légales) — aucun changement d'URL ni de rendu ;
  - expose `POST /api/contact` qui valide la requête et envoie l'email via le SDK Resend.
- **Envoi Resend** : `from` = domaine vérifié (`Bren'Art Studio <contact@brenartstudio.fr>`),
  `to` = `contact@brenartstudio.fr`, `replyTo` = email saisi par le client → répondre
  à l'email reçu répond au prospect.
- **Sécurité / anti-spam** : clé API en variable d'environnement (`RESEND_API_KEY`),
  validation stricte des champs, honeypot anti-bot, rate limiting par IP.
- **Client** : réécriture de `submitForm` (`index.html`, bloc `data-dc-script`) pour
  `fetch('/api/contact')`, avec états `sending` / `sent` / `error` (bouton désactivé
  pendant l'envoi, message d'erreur si échec). Le design et le markup du formulaire
  restent inchangés.
- **Config déploiement** : `package.json` (détecté par Nixpacks → build Node),
  `.env.example`, `.gitignore` (exclure `.env`), variable `RESEND_API_KEY` définie dans
  Coolify.

## Recommended stack

Serveur **Hono + @hono/node-server** (ultra-léger, moderne, `serveStatic` intégré,
évolutif vers d'autres routes API). Alternative équivalente : Express. Le SDK officiel
`resend` gère l'appel API. Décision inscrite dans les tasks — modifiable à la revue.

## Impact

- **Nature du déploiement** : passe de « site statique » à « app Node » sur Coolify.
  Nixpacks détecte `package.json` et lance `npm ci` + start automatiquement. Aucune
  nouvelle infra ; un seul service, un seul port.
- **Secret** : `RESEND_API_KEY` à créer dans les variables d'environnement Coolify
  (ne jamais committer). La clé fournie dans la demande devra être **révoquée et
  régénérée** puisqu'elle a transité en clair.
- **Fichiers** : ajout `server/`, `package.json`, `package-lock.json`, `.env.example`,
  `.gitignore`, `nixpacks.toml` (optionnel) ; édition ciblée du bloc `data-dc-script`
  de `index.html`.
- **Aucun impact** sur le contenu, le SEO, les routes hash, les animations ou les assets.
- **Specs** : nouvelle capability `contact-form`.
