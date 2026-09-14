# Studio Partenaire — Implementation Tasks

> Exécution inline dans la session (demande explicite : « intègre tout ceci au site »).
> Spec : `spec/changes/studio-partenaire/proposal.md`.

**Goal :** remplacer les offres projet par l'offre Studio Partenaire sur tout le site
(Services, accueil, contact, FAQ, à propos, SEO, CGV).

**Architecture :** `index.html` est la source unique ; `node build-static.mjs`
régénère les pages. `cgv/index.html` est maintenue à la main. `server/contact.js`
valide le type de demande.

**Tech :** HTML statique + runtime `x-dc` (`support.js`, jamais édité), Node 20
(Hono) pour l'API de contact.

## Global Constraints

- Tarif : 400 € la journée, minimum 3 jours par mois (1 200 €/mois).
- Démarrage 3 mois (atelier de cadrage offert, jours non utilisés perdus, renouvelable par 3 mois).
- Partenariat 12 mois : tarif garanti, report 1 mois sans cumul, priorité planning, point trimestriel.
- Modulation : préavis 1 mois, jamais sous 3 jours. Sortie anticipée : 2 mois de préavis facturés.
- Quatre partenaires maximum (mention fixe).
- Mention fiscale inchangée : « TVA non applicable, art. 293 B du CGI ».
- Aucun chiffre de coût salarial sans source.
- Palette, typographies et composants existants (`bs-*`, tokens `--bs-*`) : aucun nouveau style global.
- Copie : français, pas de tiret cadratin dans les nouveaux textes, espaces insécables (`&nbsp;`) avant `:` `?` `€`.

---

### Task 1 : Page Services

**Files :** Modify `index.html` (section `data-page="services"`)

- [ ] Remplacer hero, grille des trois offres, carte « Projet sur-mesure », mention TVA,
      bloc « Comment on travaille » et CTA final par les 8 blocs de la spec (§1).
- [ ] `node build-static.mjs` → pas d'erreur.
- [ ] Navigateur : `/services` desktop + 375 px + 320 px, pas de débordement horizontal.
- [ ] Commit `feat(studio-partenaire): refondre la page Services`.

### Task 2 : Accueil et À propos

**Files :** Modify `index.html` (bloc « Ce que je fais », section `about`)

- [ ] Remplacer « Trois façons de travailler ensemble » par l'encart Studio Partenaire
      (4 domaines, « dès 1 200 €/mois », lien `/services`).
- [ ] Hero : CTA « Démarrer un projet » → « Devenir partenaire » (le H1 ne change pas).
- [ ] À propos : « Je prends peu de projets à la fois » → « Je travaille avec peu de partenaires à la fois ».
- [ ] Build + vérification navigateur `/` et `/a-propos`.
- [ ] Commit.

### Task 3 : Contact (formulaire, serveur, FAQ)

**Files :** Modify `index.html` (section `contact`, boucle FAQ), `server/contact.js`

- [ ] `select#bs-type` : `studio-partenaire`, `projet-ponctuel`, `autre`. Libellé « Type de demande ».
- [ ] `select#bs-budget` : « Capacité envisagée » — `""`, `capa-3`, `capa-4-5`, `capa-6`.
- [ ] `ALLOWED_TYPES = ['studio-partenaire', 'projet-ponctuel', 'autre']`, libellés du mail
      « Type de demande » / « Capacité », message d'erreur « Le type de demande est invalide. ».
- [ ] FAQ : 7 questions (spec §4), boucle `for` du runtime étendue à 7.
- [ ] Test : `node --input-type=module` qui importe `createContactHandler` et vérifie
      400 pour `pack-signature`, et passage de la validation pour `studio-partenaire`.
- [ ] Build → « FAQ : 7 question(s) ». Navigateur : accordéon ouvre/ferme chaque question.
- [ ] Commit.

### Task 4 : SEO et partage

**Files :** Modify `index.html` (JSON-LD, `_seo` M), `build-static.mjs`, `llms.txt`,
`assets/og/services.jpg`

- [ ] `priceRange` `"400 € / jour"`, `hasOfferCatalog` à une offre Studio Partenaire
      (`UnitPriceSpecification`, `eligibleQuantity` min 3).
- [ ] Meta `services` et `contact` réécrites ; `PAGE_META.services.og[1]` mis à jour.
- [ ] `llms.txt` : Services + Key Facts.
- [ ] Recomposer `assets/og/services.jpg` (1200×630, canvas dans le navigateur, mêmes
      positions que la carte actuelle, titre « Votre studio créatif, chaque mois. »).
- [ ] Build ; `JSON.parse` de chaque bloc JSON-LD de `index.html` et `services/index.html`.
- [ ] Commit.

### Task 5 : CGV

**Files :** Modify `cgv/index.html`

- [ ] Art. 01 périmètre ; art. 02 devis (ponctuel) ou contrat (partenariat) ; art. 03
      tableau remplacé ; nouvel art. 04 « Studio Partenaire » ; renumérotation 04→14
      (ids `sec-NN`, sommaire, numéros) ; art. 06/07 limités aux projets ponctuels ;
      art. 11 sortie anticipée ; art. 09 cession mensuelle.
- [ ] Navigateur `/cgv` : sommaire cliquable, 14 entrées.
- [ ] Commit.

### Task 6 : Vérification finale

- [ ] Grep des anciens noms/prix (spec § Vérification) sur `index.html`, pages générées,
      `llms.txt`, `cgv/index.html` → aucune occurrence.
- [ ] Console navigateur sans erreur sur `/`, `/services`, `/contact`.
- [ ] Captures `/services` desktop et mobile envoyées à l'utilisateur.
