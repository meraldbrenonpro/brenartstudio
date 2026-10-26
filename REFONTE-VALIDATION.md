# Repositionnement Bren’Art Studio — validation locale

Version du 23 octobre 2026, après la correction de direction artistique : **Apple bleu/blanc et hero d’origine avec animation de points**.

## Résultat

- Creative Digital Studio ; spécialités 3D · CGI · Motion · AI · Web ; signature « We bring ideas to life. ».
- Titre professionnel Creative Technologist & Digital Designer dans la présentation, À propos, footer et données structurées.
- Trois expertises et trois formats ponctuels sur devis : Product Visuals, CGI Product Film, Digital Launch Experience. Depuis le 24 octobre, Studio Partenaire devient l’offre récurrente principale, avec un budget public dès 800 € HT/mois.
- Méthode Explore / Concept / Create / Deliver, coordonnées et formulaire conservés.
- Le titre et la composition du hero d’origine restent en place avec le Dot Field. Son sur-titre et sa description reflètent le nouveau positionnement.
- Pas de dépendance ajoutée. Motion DOM et le Dot Field sont conservés ; les boutons utilisent désormais des surfaces simples, à la demande de Mérald.

## Sources créées ou modifiées pendant cette intervention

| Fichier | Rôle |
| --- | --- |
| `content/home.html` | Accueil, hero conservé, expertises, offres, fondateur, méthode, contact |
| `content/services.html` | Expertises et offres sur devis |
| `content/about.html` | Présentation professionnelle et approche |
| `content/contact.html` | Formulaire existant, FAQ actualisée, alternative email sans JS |
| `assets/creative-studio.css` | Styles des nouvelles sections dans la DA Apple bleu/blanc |
| `index.html` | Shell, SEO, données structurées, footer ; reçoit les partials au build |
| `build-static.mjs` | Injection des partials et préservation des études de cas |
| `lib/creative-content.mjs` | Injection, isolation des filtres SVG et contrôles d’intégrité |
| `content/protected-projects.json` | Empreintes de référence des projets dans leur état au début de cette mission |
| `components/hero-dot-field-loader.ts` | Navigation native depuis les documents projets figés vers les pages actualisées |
| `assets/hero-dot-field-loader.js` | Sortie compilée du loader |
| `artifacts/project-preservation-smoke.mjs` | Test d’intégrité des projets |
| `package.json` | Commande `test:projects` |
| `.gitignore` | Conservation de ce nouveau test dans Git |
| `llms.txt` | Positionnement et liens actualisés |
| `cgv/index.html` | Tarifs commerciaux fixes remplacés par devis/contrat ; indemnité légale et modalités de paiement préservées |
| `mentions-legales/index.html`, `confidentialite/index.html` | Titre professionnel dans le footer |
| `PRODUCT.md`, `DESIGN.md` | Positionnement et direction retenus documentés |

Le build actualise également `a-propos/index.html`, `services/index.html`, `contact/index.html` et l’environnement global de `portfolio/index.html`. Les contenus projets de la galerie restent identiques.

Le dossier avait déjà des modifications avant cette intervention, notamment dans `package-lock.json`, les composants React, les assets Motion et les pages projets. Elles ont été conservées. Les dépendances essayées pour la scène abandonnée ont été retirées ; aucun paquet supplémentaire n’est nécessaire au résultat final.

## Projets conservés et retrait demandé

À la demande explicite de Mérald après la refonte, le projet ICC/EJP est retiré de l’accueil, de la galerie, de sa page dédiée, du routeur, du sitemap et de llms.txt. Les copies HTML conservées sont nettoyées pour éviter sa réapparition. Koryaa rejoint maintenant Ineeva dans la navigation « Projet suivant ». Les originaux des affiches restent dans les fichiers sources, sans référence dans les pages publiques.

Les contenus, médias et métadonnées des quatre autres projets sont préservés. La seule modification dans une section d’étude de cas conservée est le lien suivant de Koryaa. Les nouvelles empreintes du manifeste correspondent à ce retrait explicitement autorisé. Un test vérifie les quatre cartes et l’absence de publication du projet retiré.

## Vérifications

- `npm run build` : PASS, cinq pages générées, sept FAQ extraites, aucune régénération des études de cas conservées.
- `npm run typecheck` : PASS.
- `npm run test:projects` : PASS.
- `node artifacts/motion-smoke.mjs` : PASS, mouvement réduit, appareils modestes, annulation de routes, ressorts, clavier, menu, nettoyage et galerie.
- `node artifacts/menu-smoke.mjs` : PASS, focus/inert, menu réversible, ancres et changements de largeur.
- `node artifacts/asset-versions-smoke.mjs` : PASS, versionnement et répétabilité.
- `git diff --check` : PASS.
- Navigateur : accueil animé sur desktop et mobile ; contrôles à 320, 390 et 768 px, plus viewport desktop natif. Aucun débordement horizontal ni image visible cassée ; un H1 visible par page.
- Menu mobile, FAQ et validation native du formulaire vérifiés. Parcours direct Acasa → menu Services : nouvelle page chargée correctement.
- Test isolé du handler contact : validation invalide, honeypot et erreur fournisseur absent vérifiés. Aucun email envoyé.

Il n’existe pas de commande lint dans le projet.

## Avant diffusion

Aucun déploiement n’a été effectué. L’envoi réel d’un email n’a pas été testé pendant cette tâche.

Les HTML projets restent hors de la génération générale après le nettoyage ciblé du projet retiré, y compris leur ancien footer. Leur loader partagé force une navigation vers les nouvelles pages du studio. Au déploiement, tenir compte des visiteurs possédant déjà l’ancien loader en cache : le cache existant peut retarder ce comportement tant que leur asset n’est pas rechargé.

## Maintenance

Modifier les quatre partials `content/*.html` pour les contenus commerciaux, et `index.html` pour le shell ou le SEO. Puis exécuter le build et les vérifications ci-dessus. Ne pas éditer uniquement une copie prérendue, qui serait écrasée au build suivant.

## Fichiers concernés par le retrait

`content/home.html`, `index.html` et copies prérendues ; quatre documents projets conservés (nettoyage de l’ancienne SPA embarquée) ; `portfolio/icc-ejp-toulouse/index.html` supprimé ; `build-static.mjs`, `lib/creative-content.mjs`, `content/protected-projects.json`, `server/index.js`, `sitemap.xml`, `llms.txt`, `assets/home.css` et test d’intégrité actualisés.


## Studio Partenaire — intégration du 24 octobre 2026

### Décision commerciale

Une seule offre récurrente à la carte : **400 € HT/jour, minimum deux jours par
mois (800 € HT), engagement initial de trois mois**. Le minimum de ce premier
cycle est donc de 2 400 € HT, avec paiement mensuel avant la période de production.
Le renouvellement intervient uniquement par accord écrit ; les anciennes branches
Démarrage/Partenariat de douze mois et leur préavis ne s’appliquent plus.

Le volume du mois suivant est ajustable selon disponibilité, sans descendre sous
deux jours durant l’engagement. Une demande avance à la fois. Le cadrage, les
échanges et les retours utilisent les journées réservées. Un jour non consommé
peut être reporté sur le mois suivant, sans cumul ; les retards imputables au
studio n’entraînent aucune perte. Les frais externes, les sources, les droits et
la durée d’une journée sont précisés au devis/contrat.

Une mission ponctuelle payante permet de commencer avant de choisir un
accompagnement. Aucun essai gratuit, livrable illimité ou film complet en deux
jours n’est promis. Le configurateur prépare une demande de contact et ne vaut
pas souscription.

### Fichiers concernés par cette intégration

| Sources | Changements |
| --- | --- |
| `content/home.html` | Offre mensuelle principale, lien vers les formats ponctuels ; contenu précédant les offres inchangé |
| `content/services.html` | Explication de l’offre, configurateur, cadre de collaboration, missions ponctuelles |
| `content/contact.html` | Type Studio Partenaire, volume, domaines multiples, FAQ ; alternative email sans JavaScript |
| `components/partner-pricing.ts` | Calculs, bornes 2…10 et construction du lien |
| `components/partner-configurator.tsx` | Sélecteur, slider clavier/tactile, budget et projection, choix conservés en mémoire |
| `components/partner-motion.ts` | Tokens et ressorts partagés, mouvement réduit et appareils modestes |
| `components/partner-render.tsx`, `components/partner-loader.ts` | HTML de secours, module chargé à la visibilité, nettoyage des routes |
| `lib/build-partner.mjs`, `build-static.mjs` | Compilation, pré-rendu et injection des deux panneaux |
| `assets/partner.css`, `assets/creative-studio.css` | Panneau et sections dans la DA Apple bleu/blanc ; cases à cocher mobiles isolées des anciens styles |
| `assets/partner.js`, `assets/partner-configurator.js` | Sorties publiques compilées et versionnées |
| `index.html` | Navigation avec paramètres, préremplissage contrôlé, métadonnées, catalogue structuré, lien footer |
| `server/contact.js` | Validation des champs optionnels, domaines multiples, budget recalculé et message échappé |
| `cgv/index.html` | Conditions commerciales de Studio Partenaire alignées |
| `llms.txt`, `sitemap.xml` | Présentation de l’offre et dates des pages modifiées |
| `PRODUCT.md`, `DESIGN.md`, `components/README.md` | Règles commerciales, choix visuels et maintenance |
| `artifacts/partner-pricing-smoke.mjs`, `artifacts/partner-contact-smoke.mjs` | Calculs, paramètres, sérialisation, validation, aucun envoi réel |
| `.gitignore`, `package.json` | Tests conservés et commande `test:partner` |

Le build régénère les cinq documents commerciaux (`index.html`,
`services/index.html`, `contact/index.html`, `a-propos/index.html`,
`portfolio/index.html`) et actualise les liens versionnés des trois documents
légaux. Les documents individuels des quatre projets restent hors génération.
Les médias, données et métadonnées de ces projets restent inchangés pendant cette
intégration. ICC/EJP reste retiré.

### Rendu et interaction

Le hero, ses textes, ses images et son Dot Field sont conservés. Le préfixe du
partial d’accueil situé avant les anciennes offres a été comparé à sa sauvegarde
du début d’intervention : identique. L’offre utilise une composition éditoriale
avec le panneau de budget à droite, puis un empilement sur mobile. Le panneau
s’adapte à la largeur de son conteneur. Les seuls mouvements supplémentaires sont
les pressions, les coches et le ressort de progression du slider.

Le loader pèse environ 0,9 ko gzip ; le module React/Motion environ 99 ko gzip.
Il est chargé uniquement lorsque le panneau devient visible sur l’accueil ou les
services. Le HTML de départ reste visible avec un lien de contact fonctionnel en
cas de chargement absent ou échoué. Aucun paquet ajouté, aucune migration.
Le workflow de vidéo exportée de motion-graphics n’est pas nécessaire à ce parcours.

### Vérifications et résultats

- Build : PASS, cinq pages, sept FAQ extraites et balisées depuis le contenu visible.
- Typecheck : PASS. Pas de commande lint définie dans le projet.
- `test:partner` : PASS ; calculs, limites, URL, saisies manuelles conservées, domaines multiples, validation, échappement HTML et erreur fournisseur isolée.
- `test:projects` : PASS ; cinq sections et 56 fichiers protégés identiques, SEO/routes préservés, aucun retour du projet retiré.
- Tests Motion, menu et versions d’assets existants : PASS.
- `git diff --check` : PASS.
- Navigateur : desktop natif, 320, 390 et 768 px, aucun débordement horizontal observé ; contrôles du panneau d’au moins 44 px, calcul à quatre jours = 1 600 € HT/mois.
- Parcours réel : 3D + web et quatre jours transmis au formulaire ; retour/précédent/suivant conserve le message libre et une modification manuelle du volume.
- Clavier : Home/End sur le slider atteignent deux/dix jours et désactivent le bouton à la borne correspondante.
- Chargement : panneau non amélioré avant visibilité, puis contrôles React disponibles à l’apparition.
- Mouvement réduit : règles CSS et hook dédiés contrôlés ; moteur existant couvert par ses tests simulés. La préférence système n’a pas été changée pour l’audit visuel.

### Limites et diffusion

Aucun déploiement ni email réel envoyé. Le test du handler utilise volontairement
une clé fournisseur vide pour vérifier son erreur contrôlée ; il ne diagnostique
pas la configuration réelle d’envoi. L’envoi de bout en bout reste à vérifier
lors de la validation avant diffusion. Les conditions commerciales sont alignées,
sans audit juridique général des clauses existantes.

Le dossier a été déplacé pendant les contrôles. Le projet courant et l’aperçu
relancé utilisent maintenant `/Users/meraldbrenon/Documents/Bren'Art Studio/07-Site`.


## Ajustement demandé : retrait du Liquid Glass des boutons

`styles/liquid-glass.css` retire les couches de flou, réfraction et liseré des
boutons, ainsi que le relief des capsules actives de navigation. Les CTA sont
bleus, les boutons de navigation blancs avec bordure, les marqueurs actifs bleu
pâle. Le header flottant reste translucide. `components/render-liquid-buttons.tsx`
ne demande plus la réfraction pour les boutons générés. Le build actualise
`assets/liquid-glass.css` et les documents commerciaux. Les documents projets
restent identiques ; leur environnement commun reçoit le traitement simple.
`DESIGN.md` et `components/README.md` reflètent cette décision. Les textes, images
et l’animation du hero ne sont pas modifiés par cet ajustement.

Validation finale des boutons dans le navigateur : fond bleu opaque, aucun box-shadow ni backdrop-filter, anciennes couches de verre masquées. Aucun avertissement/erreur console observé. Le panneau se démonte en quittant la page et retrouve ses choix au retour. Captures enregistrées dans le dossier de visualisations Codex (`brenart-boutons-simples.png`, `brenart-studio-partenaire.png`).


## Icônes des outils — 24 octobre 2026

La section « Dans l’atelier » de À propos présente cinq outils : Adobe Creative
Cloud, Blender, Claude, Codex et Notion, avec leur icône, nom et usage concret.
La présentation utilise cinq colonnes sur desktop, trois sur tablette et deux
sur mobile, sans animation ou dépendance supplémentaire. Les images sont locales,
chargées en différé et conservent leurs proportions. Les noms restent visibles ;
les alternatives des images sont vides pour éviter leur répétition. Les liens
vers les sites officiels signalent un nouvel onglet.

Sources modifiées : `content/about.html`, `assets/creative-studio.css`,
`DESIGN.md`, `sitemap.xml`. Nouveaux fichiers :
`assets/tools/adobe-creative-cloud-128.png`, `claude-128.png`, `codex-128.png`,
`blender-logo-256.png`, `notion-128.png` et `SOURCES.md` (provenance des images).
Le build actualise les cinq documents commerciaux et les versions de styles.
Les contenus et fichiers des projets restent protégés par leur manifeste.

Build, typage, intégrité des projets et contrôle des espaces : PASS. Aucun
changement de dépendance ni déploiement.

Contrôle navigateur des outils : cinq images chargées, aucune image cassée ni débordement horizontal à320,390,768px et sur desktop. Grille5/3/2colonnes confirmée. Aucune dépendance ni animation supplémentaire ajoutée.


## Curseur magnétique — intégration de la référence fournie

Le cercle suit la souris, s’étire selon la vitesse, épouse les boutons et adopte
une forme fine sur le texte. Les CTA sélectionnés disposent d’un déplacement
borné à huit pixels, tandis que les liens de navigation gardent leur position.
Le contraste utilise le mode exclusion de la référence. Les boutons conservent
leur traitement uni et le hero garde son Dot Field.

Le composant React réutilisable est `components/ui/magnetic-cursor.tsx`. Le
contrôleur TypeScript commun est `lib/magnetic-cursor.ts` ; le bootstrap est
`components/magnetic-cursor-loader.ts`, importé par le chargeur partagé du hero.
`lib/build-hero.mjs` génère et versionne `assets/magnetic-cursor.js` (environ
8,4ko brut / 3,5ko gzip). Le site ne charge pas de nouveau bundle React pour cet
effet. Les styles sont dans `styles/magnetic-cursor.css`, importés par
`styles/liquid-glass.css` puis compilés dans l’asset partagé existant.

Autres sources modifiées : `index.html` (reset/destroy du routeur),
`package.json`, `.gitignore`, `DESIGN.md`, `components/README.md`. Tests ajoutés :
`artifacts/magnetic-cursor-smoke.mjs` et
`artifacts/magnetic-cursor-loader-smoke.mjs`. Les cinq documents commerciaux
reçoivent les nouveaux liens d’assets. Les fichiers individuels des projets
restent identiques, et leur chargeur commun fournit l’effet.

Aucune dépendance ajoutée : le déplacement des contrôles réutilise les ressorts
Motion existants ; le suivi est corrigé selon le temps écoulé. Le rendu cesse au
repos. Les événements restent passifs et l’overlay ne capte aucune interaction.
La propriété `translate` est indépendante des pressions `scale` et des entrées
`transform`, qui sont préservées.

Le pointeur natif est conservé sur tactile, champs, sélection réelle, clavier,
mouvement réduit, couleurs forcées, plein écran, onglet masqué ou erreur de
rendu. Il est masqué uniquement après le premier rendu visible. Les changements
de préférences sont écoutés ; le moteur et son chargement annulent leurs
événements, frames, ressorts et styles lors du nettoyage. Les sélecteurs invalides
et chargements échoués gardent un repli natif.

Vérifications : build, typage, tests curseur/chargeur, intégrité des projets,
Studio Partenaire, Motion, menu, versions d’assets et espaces : PASS.
Les tests isolés couvrent aussi les préférences tactiles/réduites et la reprise
des instances ; la préférence système n’a pas été changée pendant l’audit.
Dans le navigateur : morphologie sur bouton rond et lien large, reprise du
cercle après clic, retour natif au clavier et dans le formulaire, une seule
couche de curseur, retour de navigation et page Acasa directe confirmés.
Le hero conserve son titre et son canvas. Aucun déploiement ni envoi d’email.


## EJP Le Mag et ElevenLabs — intégration du 26 octobre 2026

### Présentation retenue

Une section autonome de l’accueil, après les réalisations existantes et avant
Studio Partenaire : « EJP Le Mag. L’information prend vie. ». Le projet est un
magazine vidéo pour une association. La production complète est attribuée à
Mérald selon sa confirmation. Le texte met en avant l’habillage éditorial,
l’animation2D et la cohérence entre image et son. Un extrait d’une minute permet
de découvrir le travail ; l’édition intégrale6min25 reste dans un détail natif.
La pageServices offre un lien vers cette réalisation. Les anciens projets et
les affichesICC/EJP retirées ne sont pas réintroduits ou modifiés.

### Fichiers de cette intervention

- Sources : `content/home.html`, `content/services.html`, `content/about.html`.
- Interface et lecture : `assets/creative-studio.css`, cycle de vie`index.html`.
- Nouveaux médias : `assets/videos/ejp-le-mag-extrait.mp4`,
  `ejp-le-mag-complet.mp4`, `ejp-le-mag-poster.webp`,
  `ejp-le-mag-extrait-fr.vtt`, `ejp-le-mag-complet-fr.vtt`.
- Outil : `assets/tools/elevenlabs-symbol.svg`, `assets/tools/SOURCES.md`.
- Documentation : `content/ejp-le-mag-production.md`, `DESIGN.md`, ce rapport.
- SEO : dates de modification des seules pagesAccueil/Services/À propos dans
  `sitemap.xml`.
- Sorties du build : les cinq documents commerciaux et les liens versionnés des
  trois documents légaux. Les HTML individuels des projets restent hors génération.

### Vérifications exécutées

- Build et typecheck : PASS. Aucune commande lint existante.
- Intégrité : PASS,5sections exactes et56fichiers protégés, métadonnées et routes
  des projets conservées. Les56empreintes ont aussi été comparées à une copie
  prise au début de cette intervention. Préfixe du hero auteur identique.
- Motion, menu et versionnement des assets : tests existantsPASS.
- `git diff --check` : PASS.
- Chrome : aucun téléchargementMP4 au chargement initial, à l’apparition du
  lecteur ou à la simple ouverture de l’intégrale ; téléchargement à la lecture.
- Lecture réellement décodée : extrait60s,1280×720 et17repères de sous-titres ;
  intégrale384,64s,1280×720 et104repères. Contrôles natifs et lecture inline actifs.
- Pause vérifiée après navigation, sortie du cadre visible et fermeture du
  magazine ; retour à l’accueil sans redémarrage automatique.
- Responsive réel des viewports navigateur :320,390,768,1440px ; aucun
  débordement. Outils en2/2/3/6colonnes avec6images chargées.
- Tactile émulé et préférence de mouvement réduit : lecteur manuel fonctionnel,
  aucun téléchargement automatique. Aucun téléphone physique testé.
- CTA « Imaginer votre vidéo » : contact prérempli sur projet ponctuel ; aucun
  formulaire envoyé.
- SansJavaScript : section et contrôles présents, intégrale dépliable et liens
  directs disponibles.
- RequêteHTTPRange :206,1024octets renvoyés pour bytes0–1023 ; VTT200.
- Aucun échec réseau local ni erreurJavaScript observé sur ces parcours.

### Livraison et limites

Le rendu desktop, mobile et la rubrique des six outils ont été inspectés dans
les captures exactes. Les nouveaux fichiers vidéo pèsent3,5Mo et29,9Mo ; seul
le poster42ko est utile avant lecture. L’original153,5Mo n’a pas été remplacé.
Le détail des médias et de la transcription est dans`content/ejp-le-mag-production.md`.
La prière partiellement indistincte est signalée dans les sous-titres.

Aucune dépendance ajoutée. Aucun déploiement ni envoi de message ou d’email.
La validation de Mérald reste nécessaire avant toute mise en production.
