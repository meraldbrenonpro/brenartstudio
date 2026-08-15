# Implementation Tasks

## Backend

1. Initialiser le projet Node : `package.json` (`"type": "module"`, `engines.node`,
   scripts `start`/`dev`), installer `hono`, `@hono/node-server`, `resend`. Ajouter
   `.gitignore` (`node_modules`, `.env`) et `.env.example` (`RESEND_API_KEY=`,
   `PORT=3000`, `CONTACT_TO=contact@brenartstudio.fr`,
   `CONTACT_FROM="Bren'Art Studio <contact@brenartstudio.fr>"`).
2. Créer `server/index.js` : app Hono qui sert les fichiers statiques de la racine
   (`index.html`, `assets/`, `uploads/`, pages légales `.dc.html`) via `serveStatic`,
   et écoute sur `process.env.PORT`.
3. Créer `server/contact.js` : handler `POST /api/contact`. Lire le corps JSON
   (`nom`, `email`, `type`, `budget`, `message`, `website` = honeypot).
4. Valider les entrées : champs requis (`nom`, `email`, `type`, `message`) non vides,
   format email plausible, longueurs max, `type` ∈ liste autorisée. Rejeter en `400`
   avec message clair si invalide. Si honeypot `website` rempli → répondre `200` sans
   envoyer (piège à bots).
5. Ajouter un rate limit simple en mémoire par IP (ex. 5 requêtes / 10 min) → `429`.
6. Envoyer via Resend : `resend.emails.send({ from: CONTACT_FROM, to: CONTACT_TO,
   replyTo: <email client>, subject, html, text })`. Corps HTML lisible reprenant tous
   les champs (nom, email, type, budget, message) + `idempotencyKey`. Gérer l'erreur
   Resend → `502`/`500` sans fuiter de détail. Succès → `200 { ok: true }`.

## Frontend (index.html, bloc data-dc-script)

1. Ajouter les états `sending` et `error` dans `this.state` et exposer `sendingD` /
   `errorMsg` / `formDisabled` dans les vals du rendu (à côté de `formD`/`sentD`).
2. Réécrire `submitForm` : `e.preventDefault()` → construire le payload depuis
   `new FormData(e.target)` → `fetch('/api/contact', { method:'POST', headers:{'Content-Type':'application/json'}, body })`.
   Gérer : `sending=true` (bouton désactivé, libellé « Envoi… »), succès → `sent=true`,
   échec (`!res.ok` ou exception réseau) → `error` avec message de repli et lien mailto.
3. Ajouter au markup du formulaire : un champ honeypot masqué (`website`,
   `aria-hidden`, hors flux, `tabindex=-1`) et un bloc d'erreur `display:{{ errorD }}`.
   Conserver styles, classes et structure existants.

## Déploiement

1. `nixpacks.toml` (optionnel, si détection auto insuffisante) fixant la commande de
   démarrage `node server/index.js`. Vérifier que Nixpacks build en Node via
   `package.json`.
2. Documenter dans le README/IMPORT-NOTES : variables d'env à créer dans Coolify
   (`RESEND_API_KEY`, `CONTACT_TO`, `CONTACT_FROM`, `PORT`), port exposé, révocation
   de la clé API partagée en clair.

## Vérification

1. Local : `npm start`, ouvrir `http://localhost:3000/`, vérifier que le site s'affiche
   à l'identique (assets, routes hash, animations) et que `POST /api/contact` renvoie
   `200` et déclenche un email réel reçu sur `contact@brenartstudio.fr` avec `Reply-To`
   = adresse de test.
2. Tester les cas d'erreur : champs manquants → `400` + message UI ; honeypot rempli →
   pas d'email ; dépassement rate limit → `429` ; panne réseau simulée → message
   d'erreur + fallback mailto affiché.
3. Déployer sur Coolify avec la variable `RESEND_API_KEY` (nouvelle clé) et refaire le
   test d'envoi de bout en bout en production.
