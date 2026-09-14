# Proposal: Studio Partenaire, l'accompagnement créatif récurrent

## Why

Bren'Art Studio vend aujourd'hui des projets ponctuels (Essentiel 1 800 €, Signature
3 500 €, Intégral 6 500 €). Chaque signature repart de zéro : le revenu dépend du
flux de nouveaux projets et ne se prévoit pas au-delà de quelques semaines.

L'objectif est de construire un **revenu mensuel stable** avec un petit portefeuille
de clients récurrents (startups, PME, entreprises) pour qui le studio devient un
**studio créatif externalisé**. L'offre se présente comme un partenariat créatif
premium, pas comme un « abonnement de design » : le client **réserve une capacité
créative** chaque mois et l'utilise pour ses besoins en branding, communication,
supports marketing, réseaux sociaux et webdesign.

Les abonnements ajoutés le 7 septembre (`6f50e6a`, Socle 90 €, Atelier 350 €,
Cap 650 €/mois) contredisent ce modèle : présentés comme secondaires, vendus à
l'heure, ils tireraient vers le bas le prix perçu du partenariat. Ils sont abandonnés.
Ce commit n'existe que sur `fix/legal-pages-routing` et n'a jamais atteint `main` :
le chantier part de `origin/main` sur la branche `feat/studio-partenaire`, et
`6f50e6a` ne doit pas être fusionné.

## Décisions

| Sujet | Décision |
|---|---|
| Nom | **Studio Partenaire** |
| Présentation | « Capacité réservée » comme mécanique principale, comparaison avec une embauche comme argument secondaire |
| Abonnements Socle / Atelier / Cap | Supprimés, le partenariat est la seule formule récurrente |
| Offres Essentiel / Signature / Intégral | Retirées du site. Projets ponctuels possibles **sur devis** après échange |
| Tarif | 400 € par journée |
| Capacité client | Nombre de jours **libre, minimum 3 par mois** (1 200 €/mois et plus) |
| Unité de décompte | **Journée entière**, planifiée |
| Modulation | Hausse ou baisse avec **1 mois de préavis**, jamais sous 3 jours |
| Engagement | Démarrage **3 mois**, puis proposition **12 mois**. Démarrage renouvelable par 3 mois |
| Différence 3 / 12 mois | **Avantages, aucune remise** (voir plus bas) |
| Jours non utilisés | Démarrage : perdus. 12 mois : **report sur le mois suivant, sans cumul** |
| Sortie anticipée | **Préavis de 2 mois facturés**, ou le reste de la période s'il est plus court |
| Capacité du studio | 12 à 15 jours vendus par mois, **quatre partenaires maximum** (mention fixe, sans compteur) |
| Tarif sur le site | Trois exemples de mois fixes (3, 5, 8 jours), pas de sélecteur interactif |
| Supports de vente | HTML à la charte puis export PDF, sur le modèle de la proposition NetSurg |

## L'offre

### Promesse

« Votre studio créatif, chaque mois. » Pour les startups, PME et entreprises qui
communiquent en continu sans équipe créative en interne.

### Ce que couvrent les journées

- **Branding** : déclinaisons et évolutions de l'identité, direction artistique
- **Communication et supports marketing** : plaquettes, présentations, print, signalétique
- **Réseaux sociaux** : templates, visuels de campagne, lignes éditoriales graphiques
- **Digital et webdesign** : nouvelles pages, landing pages, maquettes, évolutions du site

**Hors journées** (devis séparé ou refacturation après accord) : frais externes
(impression, banques d'images, hébergement, achat média), tournages photo et vidéo,
développement complexe (e-commerce, application). Un chantier qui dépasse la
capacité du mois se traite par une hausse temporaire du nombre de jours.

### Fonctionnement mensuel

- **Point de cadrage mensuel** (45 min, visio) : priorités du mois et dates des
  journées de production.
- **Journées entières planifiées.** Les petites demandes rejoignent la journée
  suivante. Une urgence consomme une journée hors planning, selon disponibilité.
- Une journée planifiée annulée par le client moins de 48 h avant reste décomptée.
- Les retouches sont comprises dans les journées.
- **Facturation au début de chaque mois**, à régler sous 8 jours. Un impayé suspend
  les journées.
- Journées supplémentaires ponctuelles au même tarif, selon disponibilité.
- Fichiers sources livrés. Droits cédés sur les livrables du mois à réception du
  paiement de la facture correspondante.

### Démarrage : 3 mois

- Engagement de 3 mois.
- **Atelier de cadrage offert en ouverture**, hors journées facturées : audit de
  l'existant et feuille de route créative du trimestre.
- Jours non utilisés perdus.
- Au terme, un **bilan** débouche sur la proposition d'engagement 12 mois. Si le
  client préfère, il renouvelle pour une nouvelle période de 3 mois, sans les
  avantages du 12 mois.

### Partenariat : 12 mois

Même tarif de 400 €/jour, avec :

- **Tarif garanti** pendant 12 mois
- **Report** des jours non utilisés sur le mois suivant, sans cumul
- **Priorité planning** : les urgences des partenaires 12 mois passent en premier
- **Point stratégique trimestriel** : bilan et feuille de route du trimestre suivant

Pas de reconduction tacite : le renouvellement se propose au bilan annuel.

### Argument de l'embauche

Cinq journées par mois reviennent à 2 000 €, sans recrutement, sans logiciels à
payer, sans période creuse à absorber. **Aucun chiffre de coût salarial n'est publié
sans source vérifiable** (grille de salaires ou étude datée, citée).

## What Changes

`index.html` reste la source unique. Les pages `services/`, `contact/`, `a-propos/`,
`portfolio/` et les études de cas sont régénérées par `node build-static.mjs`, jamais
éditées à la main. Les pages légales (`cgv/`) sont maintenues séparément.

### 1 · Page Services (`index.html`, section `data-page="services"`)

L'URL `/services` est conservée. Les deux blocs actuels (les trois offres projet et
les trois abonnements) sont remplacés, dans cet ordre, par :

1. **Hero** : surtitre « Studio Partenaire », titre « Votre studio créatif,
   *chaque mois*. », sous-titre adressé aux startups, PME et entreprises, bouton
   « Réserver un appel découverte » vers `/contact`, mention « Quatre partenaires
   maximum ».
2. **Le principe, en trois temps** : vous réservez vos journées, on les planifie
   ensemble, le studio produit.
3. **Ce que couvrent vos journées** : les quatre domaines listés plus haut.
4. **Le tarif** : « 400 € la journée, à partir de 3 jours par mois », puis trois
   cartes d'exemples, explicitement présentées comme des repères et non comme des
   paliers :
   - **3 jours · 1 200 €/mois** : visuels réseaux sociaux du mois, un visuel de
     campagne, mises à jour du site.
   - **5 jours · 2 000 €/mois** : le mois à 3 jours, plus une présentation ou une
     plaquette commerciale, ou une landing page.
   - **8 jours · 3 200 €/mois** : une campagne multi-supports complète, une
     évolution de l'identité ou une nouvelle section de site.
5. **Deux temps pour s'engager** : cartes côte à côte Démarrage 3 mois / Partenariat
   12 mois, avec leurs conditions respectives.
6. **Pourquoi un studio externalisé** : l'argument de l'embauche, quelques lignes.
7. **Comment on travaille**, réécrit : Appel découverte, Atelier de cadrage,
   Journées planifiées, Bilan.
8. **Conditions** en petit (report, frais externes, sortie anticipée, mention TVA),
   la ligne « Un projet ponctuel ? Sur devis, parlons-en. » et le bouton final.

Les composants existants sont réutilisés (`bs-shell`, `bs-eyebrow`, `bs-h2`,
`bs-card`, `bs-card--panel`, `bs-feat`, tokens `--bs-*`). La carte **Partenariat
12 mois** est mise en avant avec le marqueur terracotta de l'ancienne offre
Signature. La carte Démarrage reste en `bs-card--panel`. Grilles `repeat(auto-fit,minmax(min(300px,100%),1fr))` comme ailleurs.

### 2 · Accueil

- Le bloc « Ce que je fais / Trois façons de travailler ensemble » devient un encart
  Studio Partenaire : titre orienté studio externalisé, quatre cartes de domaines,
  mention « dès 1 200 €/mois », lien « Découvrir le Studio Partenaire → » vers
  `/services`.
- Relecture du sous-titre du hero : s'il ne parle que de projets ponctuels, il est
  ajusté pour inclure l'accompagnement dans la durée. Le H1 ne change pas.

### 3 · Contact

- `select#bs-type` : `studio-partenaire` (Studio Partenaire), `projet-ponctuel`
  (Projet ponctuel, sur devis), `autre` (Autre).
- `select#bs-budget`, renommé « Capacité envisagée » : À définir ensemble,
  `capa-3` (3 jours · 1 200 €/mois), `capa-4-5` (4 à 5 jours), `capa-6` (6 jours et plus).
- `server/contact.js` : `ALLOWED_TYPES` aligné sur les nouvelles valeurs. Les
  libellés du mail de notification restent lisibles (« Type de demande »,
  « Capacité »).

### 4 · FAQ (page Contact)

Le JSON-LD `FAQPage` est extrait automatiquement du markup par `build-static.mjs`.

- « Comment se déroule un projet ? » devient **« Comment se passe un mois en
  Studio Partenaire ? »**
- « Quels sont les délais ? » devient **« Combien de temps pour démarrer ? »**
  (appel découverte, atelier de cadrage, première journée).
- « Quel budget prévoir, et pour qui ce n'est pas adapté ? » est réécrite sur la
  base de 1 200 €/mois minimum, et indique pour qui le partenariat n'est pas adapté.
- Ajout de **« Et si je n'utilise pas tous mes jours ? »**
- Ajout de **« Puis-je arrêter après 3 mois ? »**
- « De quoi avez-vous besoin pour démarrer ? » et « Travaillez-vous seul ? » sont
  relues et ajustées si elles parlent de « projet ».

### 5 · À propos

« Je prends peu de projets à la fois » devient « Je travaille avec peu de
partenaires à la fois ».

### 6 · SEO et données structurées

- JSON-LD `ProfessionalService` : `priceRange` passe à `"400 € / jour"`. Le
  `hasOfferCatalog` ne contient plus qu'une offre **Studio Partenaire** avec
  `UnitPriceSpecification` (`price` 400, `priceCurrency` EUR, `unitText` « jour »,
  `valueAddedTaxIncluded` false) et `eligibleQuantity` minimum 3 (`unitText`
  « jours par mois »).
- Meta de route `services` (bloc `M` dans `index.html`) : titre et description
  orientés Studio Partenaire et studio créatif externalisé.
- `build-static.mjs`, `PAGE_META.services.og[1]` : nouveau texte alternatif.
- `assets/og/services.jpg` : carte typographique recomposée à l'identique
  (1200×630, fond `#070707`, logotype, filet terracotta, surtitre « STUDIO
  PARTENAIRE », titre de la nouvelle page).
- `llms.txt` : section Services et Key Facts réécrites. Plus de mention des trois
  offres.

### 7 · CGV (`cgv/index.html`)

- **Art. 01** : le périmètre ajoute l'accompagnement créatif récurrent (Studio Partenaire).
- **Art. 03** : le tableau des trois offres est remplacé par « Projets ponctuels :
  sur devis » et « Studio Partenaire : 400 € la journée, minimum 3 jours par mois ».
  Acompte de 30 % et échéancier réservés aux projets ponctuels.
- **Nouvel article « Studio Partenaire, conditions particulières »** : formation par
  contrat d'accompagnement signé, durées (3 ou 12 mois, sans reconduction tacite,
  Démarrage renouvelable par 3 mois), définition de la journée, annulation à moins
  de 48 h, facturation mensuelle d'avance à 8 jours, suspension en cas d'impayé,
  modulation, règles de report, retouches comprises, frais externes, cession des
  droits mensuelle.
- **Art. 05 et 06** (retouches, délais) : précisés comme propres aux projets ponctuels.
- **Art. 10** : sortie anticipée du partenariat, préavis de 2 mois facturés ou reste
  de la période s'il est plus court.
- Numérotation des articles et ancres mises à jour.

### 8 · Supports de vente (hors dépôt, `04 - Com'/Studio Partenaire/`)

1. **Modèle de proposition commerciale** (HTML puis PDF), trame adaptée de
   `02 - Clients/NetSurg/Propsition Commerciale /NetSurg_Proposition_Bren_Art_Studio_v2.html` : ce que
   nous avons compris, ce qui manque aujourd'hui, capacité recommandée, exemple de
   mois type, pourquoi un studio externalisé, parcours 3 puis 12 mois, conditions,
   prochaine étape. Les zones propres au client sont balisées pour être remplies.
2. **Contrat d'accompagnement** (HTML puis PDF, deux pages) : parties, formule
   (Démarrage ou Partenariat), nombre de jours par mois, date de début et de fin,
   domaines prioritaires, interlocuteurs, renvoi aux CGV, signatures.

## Hors périmètre

- Sélecteur interactif de jours, compteur de places disponibles
- Paiement en ligne, prélèvement automatique, espace client
- Outil de suivi des journées consommées (un tableau partagé suffit au départ)
- Modèle de bilan de fin de Démarrage (à produire après le premier client)

## Points de vigilance

- **TVA.** Les prix restent « TVA non applicable, art. 293 B du CGI » tant que la
  franchise en base s'applique. Trois ou quatre partenaires peuvent faire dépasser
  le seuil : à suivre avec le comptable. Le passage à la TVA change la mention sur
  le site, dans les CGV et sur les factures.
- **Relecture juridique.** Les CGV modifiées et le contrat d'accompagnement doivent
  être relus par un professionnel du droit avant la première signature.
- **Argument de l'embauche.** Aucun coût salarial chiffré sans source citée.

## Vérification

- `node build-static.mjs` sans erreur, FAQ extraite avec le bon nombre de questions.
- Au navigateur, en mobile (375 px) et en desktop : accueil, services, contact,
  à propos, CGV. Aucun débordement horizontal à 320 px.
- Plus aucune occurrence des anciens noms d'offre ni des anciens prix dans
  `index.html`, les pages générées, `llms.txt` et `cgv/index.html` : recherche sur
  `Essentiel`, `Signature`, `Intégral`, `Socle`, `>Atelier<`, `>Cap<`, `1&nbsp;800`,
  `3&nbsp;500`, `6&nbsp;500`, `90&nbsp;€`, `350&nbsp;€`, `650&nbsp;€`, `pack-`,
  `trois offres` (insensible à la casse). « Atelier de cadrage » reste autorisé.
- Formulaire de contact : envoi accepté avec chaque nouveau type, refusé avec un
  ancien type.
- JSON-LD valide (Rich Results Test ou validateur schema.org) sur `/` et `/services`.
- `og:image` de `/services` pointe vers la nouvelle carte.
