# Bren’Art Studio — studio et portfolio

## Studio Partenaire — 24 octobre 2026

L’offre récurrente devient Studio Partenaire, à la carte : 400 € HT par jour, au moins deux jours et 800 € HT par mois, avec trois mois d’engagement initial. Le minimum de 2 400 € HT sur cette première période est affiché avec la facturation mensuelle. Le renouvellement exige un accord écrit ; aucune formule de douze mois ni reconduction automatique n’est proposée. Les missions ponctuelles restent sur devis et peuvent servir de première collaboration payante.

Le choix du volume et des domaines aide à préparer le premier échange, sans engagement ni paiement en ligne. Il réserve une capacité de travail : une demande active à la fois, estimation avant production, cadrage et retours inclus dans les jours. Aucun nombre de livrables ou film complet n’est promis pour deux jours. Le formulaire reprend les choix sans remplacer le message du visiteur. Les CGV et la FAQ présentent les mêmes règles de modulation, de report et de renouvellement.

Cette évolution conserve la direction Apple bleu/blanc, la hiérarchie typographique et les mouvements accessibles du site. Le hero Dot Field et ses aperçus Ineeva/Acasa restent inchangés. Les médias et contenus des quatre études de cas sont préservés ; le projet ICC/EJP reste retiré.

## Retrait du projet d’affiches événementielles — 23 octobre 2026

À la demande de Mérald, la sélection d’accueil présente Koryaa et Laure Fagbohoun ; la galerie conserve quatre projets. Le projet d’affiches événementielles, sa page et ses liens sont retirés du site. Le parcours suivant Koryaa rejoint Ineeva. La direction Apple bleu/blanc et le hero animé restent inchangés.

## Repositionnement — 23 octobre 2026

La direction Apple bleu/blanc est conservée à la demande de Mérald : #F5F5F7, blanc, #1D1D1F et bleu #2D46F5. Le hero d’origine, son titre « Votre marque. Une vraie personnalité. », son animation Dot Field et les aperçus Ineeva/Acasa sont maintenus. Seuls le sur-titre et la description accompagnent le positionnement Creative Digital Studio.

Le nouveau titre professionnel est Creative Technologist & Digital Designer. Les expertises, offres sur devis, méthode et pages studio/contact sont réorganisées dans cette même DA. Motion DOM et les ressorts existants restent le langage d’interaction ; aucune dépendance 3D supplémentaire n’est requise. `assets/creative-studio.css` se limite aux nouvelles sections. Les pages et médias des études de cas sont figés par le manifeste `content/protected-projects.json` et vérifiés au build. Les quatre pages commerciales sont éditables dans `content/*.html`.

## Direction actuelle — Apple Design, 22 octobre 2026

Cette direction remplace les choix de typographie et de mouvement documentés plus bas. Le site garde son logo, ses réalisations, ses textes et son bleu #2D46F5. L’interface adopte les principes du skill `apple-design` : calme, hiérarchie claire, réponse immédiate et transitions réversibles.

Fond gris très clair #F5F5F7, surfaces blanches, encre #1D1D1F, texte secondaire #606067. La pile système utilise SF sur les appareils Apple et la police native ailleurs, sans téléchargement. Grands titres à approche négative et interligne serré ; descriptions plus aérées ; contrôles compacts mais d’au moins 44 px. Les champs restent à 16 px sur mobile.

L’accueil centre la promesse et présente Ineeva et Acasa dans deux cadres plats. Sur mobile, les deux projets se parcourent horizontalement avec le défilement et l’inertie du navigateur. Les autres sections alternent images, cartes et espaces ouverts. Le portfolio conserve sa galerie ; les services, les études de cas, le studio, le contact et les pages légales partagent la même finition. `assets/apple-design.css` porte cette couche commune, chargée après les feuilles existantes.

Le verre se limite à la navigation fonctionnelle. Le menu mobile se déploie depuis le haut à droite ; sa fermeture suit le même chemin. Le panneau reste monté durant sa sortie, mais le focus, aria et inert suivent immédiatement l’intention. Réouvrir pendant la fermeture reprend la position et la vitesse actuelles. Les pressions des boutons utilisent un ressort critique indépendant des transformations d’entrée, sans rebond décoratif. La sortie de route dure 120 ms, les titres et images arrivent discrètement. Aucun suivi décoratif du pointeur dans le héros.

Mouvement réduit : positions directes et contenu immédiatement lisible. Transparence réduite : navigation opaque. Contraste accru : texte renforcé et limites visibles. Le défilement reste natif et le HTML reste utilisable sans le moteur d’animation.

## Boutons simples — 24 octobre 2026

À la demande de Mérald, les boutons utilisent désormais des surfaces opaques :
bleu du studio et texte blanc pour les CTA, blanc et bordure discrète dans la
navigation. Aucun flou, reflet, biseau ou effet de réfraction sur ces contrôles.
Les couches décoratives de l’ancien composant restent masquées par la feuille
partagée, ce qui couvre aussi les documents projets sans les réécrire.

L’indicateur de navigation et les liens actifs mobiles adoptent une capsule
unie bleu pâle. Le header flottant conserve sa transparence. Les ressorts de
pression, le focus visible, les liens et les adaptations d’accessibilité restent
fonctionnels.

## Animation Dot Field de l’accueil — 23 octobre 2026

Le titre « Votre marque. Une vraie personnalité. » se compose à partir d’un
champ de points. Un balayage bleu parcourt les lettres ; le pointeur précis
repousse les particules, et le défilement les disperse puis les rassemble au
retour. Cette demande remplace la restriction antérieure sur les interactions
du pointeur pour le titre de cette section.

La géométrie provient des lignes du titre HTML existant : taille, coupures,
espacement et position restent ceux du site. Les descriptions et réalisations Ineeva/Acasa sont conservées.
Les boutons suivent désormais le traitement simple décrit ci-dessus. Le titre HTML reste accessible
et sert de repli sans JavaScript, en mouvement réduit ou si le canvas échoue.
Le module est chargé à la demande sur l’accueil, démonté en quittant cette page,
et suspend son rendu hors écran ou dans un onglet masqué. Aucun défilement imposé
ni écran d’attente n’est ajouté.

## Évolution antérieure

## Direction

Un studio lumineux et direct : blanc, noir et bleu vif choisi par Mérald. Les projets portent la démonstration. Studio Yuna inspire le parcours de l’accueil : une première vue visuelle, une présentation personnelle et des offres accessibles, puis les réalisations et le contact. Esaïe Rosa inspire le défilement du portfolio : grands visuels qui prennent leur place puis se superposent. Identité et contenu restent propres à Bren’Art Studio.

## Palette

Fond #FAFAFA, encre #171717, texte secondaire #55585B, surface #F0F1F2, filets #D5D6D7. Accent #2D46F5 avec texte blanc ; survol #2036D8. Aucun jaune ni terracotta dans l’interface. Les couleurs des projets sont conservées dans leurs images.

## Typographie

Bricolage Grotesque pour les titres, Manrope pour le texte. Titres fluides jusqu’à 96 px, approche -.035 em. Trois lignes sur l’accueil, des légendes très compactes dans la galerie.

## Structure

Accueil : promesse explicite et deux visuels de réalisations en composition, portrait et présentation personnelle, trois expertises illustrées, trois projets complémentaires dans une sélection compacte, deux modes de collaboration, trois témoignages réels et contact. Les avis se lisent en trois colonnes sur ordinateur et dans une rangée à faire défiler sur mobile. Un lien Accueil existe aussi dans la navigation de bureau. Portfolio : quatre univers dans une galerie verticale. Études de cas : intention et livrables, images, récit détaillé dans un accordéon. Services : trois entrées visuelles à ouvrir, puis deux modes de collaboration avec conditions détaillées à la demande. Le formulaire reste simple ; les questions sont fermées au départ.

## Mouvement

Accueil : entrée typographique et visuelle coordonnée, apparition des titres au défilement, retours visuels au survol. Portfolio : expansion de la sélection, projets superposés en sticky avec recul progressif et légère parallaxe des images. Défilement natif, aucun écran de chargement. Sur mobile tactile et en mouvement réduit, une galerie normale et tous les contenus accessibles. Le moteur local se réinitialise après une navigation interne.

## Affinage du design et du mouvement — octobre 2026

Palette inchangée : blanc #FAFAFA, encre #171717, gris texte #55585B, surface #F0F1F2, filet #D5D6D7, bleu #2D46F5. Bricolage Grotesque porte les grandes formes typographiques ; Manrope garde les descriptions et interactions lisibles. Alignement à gauche.

Plan initial : conserver le collage de réalisations en ouverture, faire entrer texte et images ensemble, puis garder une lecture calme. La sélection de projets se compose comme un aperçu du travail, avec une grande vue Koryaa et deux vues complémentaires.

    texte noir      | planche bleue + Ineeva / Acasa
    Koryaa grand    | Laure
    Projet ponctuel | description courte | contact
    Partenaire      | conditions utiles  | détails

Relecture : les mots isolés en bleu et les deux panneaux d’offres ressemblaient à un traitement standard. Les titres passent en noir ; le bleu sert la planche du studio et les actions. Les offres deviennent deux rangées ouvertes. Les trois vrais avis restent ensemble, dans leur texte intégral.

Mouvement : presets partagés du skill motion-foundations, Motion DOM dans le moteur actuel du site. Une séquence d’accueil, un fondu de sortie suivi de l’entrée progressive de la nouvelle page, retours tactiles/au clavier, et révélations discrètes une seule fois. Annulation des séquences et ancres différées à chaque nouvelle navigation. Les effets décoratifs sont désactivés sur appareils peu puissants, sur tactile et pour le mouvement réduit. Aucun contenu masqué dans le HTML initial, aucun détournement du défilement natif.

## Premier écran — les identités prennent forme

Direction : des planches de présentation physiques, lumineuses, précises et posées. Palette conservée : #FAFAFA, #171717, #55585B, #F0F1F2, #D5D6D7 et #2D46F5. Bricolage Grotesque pour les trois lignes, Manrope pour le texte et les légendes ; alignement à gauche, proportions et contenus conservés.

    promesse en trois lignes | Ineeva, plan arrière
    description et actions  |     Acasa, premier plan
                            | planche bleue en fond

Le geste distinctif reste l’assemblage des deux projets : aucun nouveau décor ni changement des images. La perspective CSS et les ombres de contact donnent une épaisseur aux planches. Les légendes restent à l’extérieur du chevauchement. Chaque planche avance légèrement au survol ou au focus et son lien se souligne.

Une seule entrée Motion DOM : lignes espacées de 70 ms, puis planches et actions coordonnées, arrêt complet en moins de 800 ms, sans rebond. Le pointeur précis incline l’ensemble de 2,4 degrés au maximum et le décale de 4 px ; retour amorti par une courbe sans dépassement, aucun mouvement au repos. Chaque couche possède sa transformation pour préserver les images et éviter les conflits d’animation.

Sur mobile : entrée raccourcie (450 ms maximum), composition plate stable, aucun suivi du doigt. Mouvement réduit : aucune transformation ni entrée. Le HTML et le CSS restent visibles et les liens utilisables si Motion ne démarre pas. Aucun changement du défilement natif.

## Portfolio — découverte au défilement

Palette et typographies inchangées. Les quatre projets conservés gardent leur ordre, leurs textes, leurs liens et leurs images. Les proportions des réalisations donnent la largeur de chaque présentation : 3/2 pour Koryaa, Ineeva et Laure ; 7/4 pour Acasa. La hauteur disponible réserve la place du menu et des légendes.

    nom + catégorie                        Voir le projet ↗
    grand visuel dans ses proportions
                  projet suivant au premier plan

L’expansion par découpe de toute la galerie est remplacée par un agrandissement du premier visuel de 94 à 100 %, indépendant de sa légende. Les légendes passent au-dessus des images : le nom, la catégorie et l’accès se lisent dès qu’un projet entre. Les cartes deviennent sticky uniquement si le moteur est disponible sur ordinateur avec pointeur précis. À l’arrivée du suivant, le précédent recule de 4,5 % et de 16 px au maximum. Les écarts entre projets restent bornés à 64–120 px et il n’y a pas de réserve vide après le dernier.

Le défilement natif pilote directement les valeurs, sans ressort ni transition sur la progression. La remontée rejoue les mêmes positions. Une parallaxe bornée à 8 px pour Koryaa et 10 px pour Laure dispose d’une marge dédiée ; Acasa et Ineeva restent intégralement cadrés. Le survol relève le visuel de 3 px et souligne l’accès, avec une flèche bleue en 180 ms. Le focus clavier remet le projet au premier plan et à sa taille lisible.

Sur mobile : galerie verticale, proportions originales, entrée unique de 8 px en 350 ms, liens de projet généreux. En mouvement réduit ou sans moteur, la galerie reste en flux normal, sans effet de pile ni parallaxe. Aucun changement sur l’accueil ou les études de cas.


## Outils du studio — 24 octobre 2026

La section À propos présente Adobe Creative Cloud, Blender, Claude, Codex et Notion dans une grille sobre : icône locale, nom et usage. Cinq colonnes sur desktop, trois sur tablette et deux sur mobile. Les couleurs des marques sont conservées dans la DA bleu/blanc. Aucun cadre en verre ni animation supplémentaire. Les sources sont documentées dans `assets/tools/SOURCES.md`.


## Curseur magnétique

À la demande de Mérald, un cercle blanc en mode exclusion suit la souris, s’étire
selon sa vitesse et épouse les petits contrôles au survol. Le réglage du site
est de32px, avec un magnétisme0,18 et une marge6px. Les CTA peuvent se déplacer
au maximum de8px ; les liens de navigation restent fixes. Les boutons conservent
leur surface unie, sans retour du Liquid Glass.

Le pointeur natif reste utilisé pour le tactile, le clavier, les champs et la
sélection de texte, le mouvement réduit et les couleurs forcées. Le rendu est
suspendu au repos et dans un onglet masqué. L’overlay est extérieur au routeur,
sans interception d’événement ; le Dot Field et les projets sont conservés.
Cette interaction globale répond à la nouvelle demande de curseur et complète
les règles antérieures sur le suivi du pointeur.


## EJP Le Mag et ElevenLabs — 26 octobre 2026

Une section autonome « EJP Le Mag. L’information prend vie. » suit les projets de
l’accueil et précède Studio Partenaire. Palette existante (bleu #2d46f5, blanc,
gris #f5f5f7, encre #1d1d1f, secondaire #606067), typographie système, vidéo
dominante16:9 et notes éditoriales en deux colonnes. Sur mobile, le contenu
s’empile. Le hero, son animation et les études de cas existantes restent figés.

Le visiteur lance lui-même un extrait d’une minute. Un détail natif donne accès
au magazine complet6min25. Les deux lecteurs ont leurs contrôles et sous-titres
français. Aucun autoplay ni boucle. Le film se met en pause à la sortie de page,
de son cadre visible ou de l’onglet, et lorsqu’un autre lecteur démarre. Les
boutons gardent leurs surfaces unies.

La rubrique des outils ajoute le symbole officiel ElevenLabs et l’usage « Voix
et création audio ». Elle adopte six colonnes sur desktop, trois sur tablette
et deux sur mobile. Aucune dépendance n’est ajoutée.


## Galerie filtrable et fiche Motion Design — 26 octobre 2026

Mérald a choisi la galerie filtrable parmi trois propositions : galerie, sections
par discipline, liste éditoriale. L’index `/portfolio` est désormais une grille
asymétrique en douze colonnes sur grand écran, deux sur tablette et une sur mobile.
Les visuels conservent leurs proportions, sans nouveau recadrage des projets.
Les filtres Tous les projets, Branding, Webdesign et Motion Design sont des liens
ordinaires, à surface opaque. L’URL porte le filtre (`?discipline=...`) pour le
partage et précédent/suivant. Le focus reste sur le filtre et le nombre de projets
est annoncé. Un changement de sélection produit un bref fondu/décalage de huit
pixels à partir des tokens existants, désactivé avec le mouvement réduit ou sur
appareil modeste. Aucun empilement collant ne gêne la consultation.

Les réalisations sont Koryaa, Acasa, Ineeva, Laure Fagbohoun et EJP Le Mag.
Ineeva appartient à Branding et Webdesign, sans dupliquer sa carte. Les quatre
études de cas originales conservent leurs médias, textes, URL et métadonnées.
La galerie seule est libérée du manifeste à la suite de cette demande explicite.

EJP Le Mag possède sa fiche `/portfolio/ejp-le-mag`, sous Motion Design. La vidéo
et son texte sont retirés de l’accueil ; son hero reste inchangé. La couverture
est la capture fournie par Mérald, intégrée dans les proportions originales,
avec deux exports WebP et une version de partage. Le plateau et une rubrique
sont montrés par deux images réellement extraites du film. Lecteurs manuels,
sous-titres, transcription, contexte associatif et crédits complets sont conservés.
La rubrique des six outils, dont ElevenLabs, reste en place.


## Couleur au survol du curseur — correction du 26 octobre 2026

Le curseur retrouve son rendu d’origine : blanc en mode exclusion, donc noir
sur les surfaces claires, avec le suivi, l’étirement et l’aimantation existants.
Le contour et le fond translucide ajoutés précédemment sont supprimés.
Seul le bleu des contrôles survolés est compensé avant composition pour rester
bleu#2D46F5 après inversion, au lieu de devenir jaune. Le noir, le blanc et les
autres couleurs suivent l’effet d’origine. Cette compensation temporaire est
retirée à la sortie du contrôle, au reset, à la navigation et au nettoyage.


## Ajustements éditoriaux — 27 octobre 2026

- Cible : marques indépendantes, associations, commerces, créateurs et projets à identité forte.
- Accueil : priorité à l’identité visuelle, au web et à l’animation ; Toulouse figure dans le sur-titre et les métadonnées.
- Hero : conserver exactement « Votre marque. Une vraie personnalité. », l’animation et le correctif de démarrage.
- Les premières réalisations 3D/CGI restent annoncées par le badge existant, sans inventer de références.
- Français pour la signature, les expertises, les offres et la méthode ; conserver le titre officiel Creative Technologist & Digital Designer, les noms des outils et les disciplines de la galerie.
- Accueil allégé : résumé de Studio Partenaire, lien vers le configurateur sur `/services#collaboration`, et méthode complète uniquement sur `/services#methode`.
- Les conditions de l’offre restent inchangées : 400 € HT/jour, minimum deux jours par mois, engagement initial de trois mois et renouvellement par accord écrit.
- Aucun récit de parcours ajouté, à la demande de Mérald ; aucune date ni expérience inventée.
- Chaque page garde son appel à l’action adapté au contexte. Les études de cas, leurs médias, leurs URL et leurs métadonnées sont préservés.


## Missions et lisibilité mobile — 27 octobre 2026

- Expertises commence par les missions ponctuelles, avec deux entrées claires « Identité visuelle » et « Site vitrine », leurs livrables documentés et les références Acasa / Laure Fagbohoun.
- La production 3D/CGI reste disponible sur devis, avec les premières références annoncées prochainement.
- Studio Partenaire possède un exemple indicatif : aucune promesse de livrables dans deux jours ; les conditions et constantes de prix sont conservées.
- Mobile : badge 3D déplacé dans l’expertise, lien secondaire sous les réalisations, espaces réduits et cinq libellés toujours visibles dans la navigation.
- Le titre exact, les visuels et liens Ineeva / Acasa sont conservés. La formation Dot Field se stabilise après une seconde sur mobile ; le repli lisible et le mouvement réduit restent actifs.
