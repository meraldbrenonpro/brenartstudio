# Spec Delta: Contact Form

## ADDED Requirements

### Requirement: Envoi d'email depuis le formulaire de contact

WHEN un visiteur soumet le formulaire de contact avec des champs valides,
the system SHALL envoyer un email à `contact@brenartstudio.fr` via Resend
et confirmer visuellement l'envoi au visiteur.

L'email envoyé SHALL avoir `from` = un expéditeur du domaine vérifié
(`Bren'Art Studio <contact@brenartstudio.fr>`), `to` = `contact@brenartstudio.fr`,
et `replyTo` = l'adresse email saisie par le visiteur, de sorte qu'une réponse
depuis la boîte du studio parte directement vers le prospect.

La clé API Resend SHALL être lue depuis une variable d'environnement serveur
(`RESEND_API_KEY`) et ne SHALL jamais être exposée dans le code client.

#### Scenario: Soumission valide

- GIVEN un visiteur remplit `nom`, `email` (`prospect@exemple.fr`), `type`, `message`
- WHEN il soumet le formulaire
- THEN le serveur envoie un email à `contact@brenartstudio.fr` avec `replyTo` = `prospect@exemple.fr`
- AND l'API répond `200`
- AND le formulaire est remplacé par le message « Message bien reçu »

#### Scenario: Réponse au prospect en un clic

- GIVEN un email de contact reçu dans la boîte `contact@brenartstudio.fr`
- WHEN le studio clique sur « Répondre »
- THEN le destinataire pré-rempli est l'adresse saisie par le prospect (via `Reply-To`)

### Requirement: Validation des entrées

WHEN une requête arrive sur `POST /api/contact`,
the system SHALL valider les champs côté serveur avant tout envoi et rejeter
les requêtes invalides sans appeler Resend.

Les champs `nom`, `email`, `type` et `message` SHALL être requis et non vides.
Le champ `email` SHALL respecter un format d'adresse plausible. Le champ `type`
SHALL appartenir à la liste autorisée. Les longueurs SHALL être bornées.

#### Scenario: Champ requis manquant

- GIVEN une requête sans `message`
- WHEN elle est envoyée à `POST /api/contact`
- THEN le serveur répond `400` avec un message d'erreur
- AND aucun email n'est envoyé
- AND l'interface affiche un message d'erreur au visiteur

#### Scenario: Email mal formé

- GIVEN un `email` = `pas-un-email`
- WHEN la requête est envoyée
- THEN le serveur répond `400`
- AND aucun email n'est envoyé

### Requirement: Protection anti-spam

WHEN le formulaire est soumis,
the system SHALL appliquer des protections anti-abus : un champ honeypot masqué
et une limitation de débit par IP.

Si le champ honeypot (`website`) est rempli, the system SHALL répondre `200`
sans envoyer d'email. Si une IP dépasse le seuil autorisé sur la fenêtre de temps,
the system SHALL répondre `429` sans envoyer d'email.

#### Scenario: Bot piégé par le honeypot

- GIVEN une soumission où le champ caché `website` est rempli
- WHEN elle atteint le serveur
- THEN aucun email n'est envoyé
- AND le serveur répond `200` (le bot croit avoir réussi)

#### Scenario: Débit dépassé

- GIVEN une même IP envoyant plus que le seuil autorisé sur la fenêtre
- WHEN la requête suivante arrive
- THEN le serveur répond `429`
- AND aucun email n'est envoyé

### Requirement: Retour d'état à l'utilisateur

WHILE l'envoi est en cours ou en cas d'échec,
the system SHALL informer le visiteur de l'état sans perdre les données saisies
en cas d'erreur.

Pendant l'envoi, le bouton SHALL être désactivé et indiquer un état de chargement.
En cas d'échec (erreur serveur ou réseau), the system SHALL afficher un message
d'erreur et proposer un repli (lien `mailto:contact@brenartstudio.fr`), le
formulaire restant rempli pour permettre une nouvelle tentative.

#### Scenario: Panne réseau

- GIVEN le serveur est injoignable
- WHEN le visiteur soumet le formulaire
- THEN un message d'erreur s'affiche avec le lien mailto de repli
- AND les champs saisis restent présents

#### Scenario: Envoi en cours

- GIVEN un formulaire valide soumis
- WHILE la requête est en attente de réponse
- THEN le bouton est désactivé et affiche un état « Envoi… »

### Requirement: Service unique statique + API

The system SHALL être servi par une application Node unique déployée via Coolify
(buildpack Nixpacks) qui sert les fichiers statiques existants et expose l'endpoint
`POST /api/contact`, sans modifier les URLs, le rendu, ni les assets du site.

#### Scenario: Site inchangé

- GIVEN l'application Node démarrée
- WHEN un visiteur ouvre `/`
- THEN `index.html` s'affiche à l'identique (assets, routes hash, animations)
- AND les pages légales restent accessibles

#### Scenario: Build Nixpacks

- GIVEN un `package.json` à la racine
- WHEN Coolify build avec Nixpacks
- THEN le projet est détecté comme application Node
- AND la commande de démarrage lance le serveur qui écoute sur le port configuré
