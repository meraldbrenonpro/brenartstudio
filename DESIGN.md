# Bren’Art Studio — studio et portfolio

## Direction actuelle — Apple Design, 22 octobre 2026

Cette direction remplace les choix de typographie et de mouvement documentés plus bas. Le site garde son logo, ses réalisations, ses textes et son bleu #2D46F5. L’interface adopte les principes du skill `apple-design` : calme, hiérarchie claire, réponse immédiate et transitions réversibles.

Fond gris très clair #F5F5F7, surfaces blanches, encre #1D1D1F, texte secondaire #606067. La pile système utilise SF sur les appareils Apple et la police native ailleurs, sans téléchargement. Grands titres à approche négative et interligne serré ; descriptions plus aérées ; contrôles compacts mais d’au moins 44 px. Les champs restent à 16 px sur mobile.

L’accueil centre la promesse et présente Ineeva et Acasa dans deux cadres plats. Sur mobile, les deux projets se parcourent horizontalement avec le défilement et l’inertie du navigateur. Les autres sections alternent images, cartes et espaces ouverts. Le portfolio conserve sa galerie ; les services, les études de cas, le studio, le contact et les pages légales partagent la même finition. `assets/apple-design.css` porte cette couche commune, chargée après les feuilles existantes.

Le verre se limite à la navigation fonctionnelle. Le menu mobile se déploie depuis le haut à droite ; sa fermeture suit le même chemin. Le panneau reste monté durant sa sortie, mais le focus, aria et inert suivent immédiatement l’intention. Réouvrir pendant la fermeture reprend la position et la vitesse actuelles. Les pressions des boutons utilisent un ressort critique indépendant des transformations d’entrée, sans rebond décoratif. La sortie de route dure 120 ms, les titres et images arrivent discrètement. Aucun suivi décoratif du pointeur dans le héros.

Mouvement réduit : positions directes et contenu immédiatement lisible. Transparence réduite : navigation opaque. Contraste accru : texte renforcé et limites visibles. Le défilement reste natif et le HTML reste utilisable sans le moteur d’animation.

## Évolution antérieure

## Direction

Un studio lumineux et direct : blanc, noir et bleu vif choisi par Mérald. Les projets portent la démonstration. Studio Yuna inspire le parcours de l’accueil : une première vue visuelle, une présentation personnelle et des offres accessibles, puis les réalisations et le contact. Esaïe Rosa inspire le défilement du portfolio : grands visuels qui prennent leur place puis se superposent. Identité et contenu restent propres à Bren’Art Studio.

## Palette

Fond #FAFAFA, encre #171717, texte secondaire #55585B, surface #F0F1F2, filets #D5D6D7. Accent #2D46F5 avec texte blanc ; survol #2036D8. Aucun jaune ni terracotta dans l’interface. Les couleurs des projets sont conservées dans leurs images.

## Typographie

Bricolage Grotesque pour les titres, Manrope pour le texte. Titres fluides jusqu’à 96 px, approche -.035 em. Trois lignes sur l’accueil, des légendes très compactes dans la galerie.

## Structure

Accueil : promesse explicite et deux visuels de réalisations en composition, portrait et présentation personnelle, trois expertises illustrées, trois projets complémentaires dans une sélection compacte, deux modes de collaboration, trois témoignages réels et contact. Les avis se lisent en trois colonnes sur ordinateur et dans une rangée à faire défiler sur mobile. Un lien Accueil existe aussi dans la navigation de bureau. Portfolio : cinq univers dans une galerie verticale. Études de cas : intention et livrables, images, récit détaillé dans un accordéon. Services : trois entrées visuelles à ouvrir, puis deux modes de collaboration avec conditions détaillées à la demande. Le formulaire reste simple ; les questions sont fermées au départ.

## Mouvement

Accueil : entrée typographique et visuelle coordonnée, apparition des titres au défilement, retours visuels au survol. Portfolio : expansion de la sélection, projets superposés en sticky avec recul progressif et légère parallaxe des images. Défilement natif, aucun écran de chargement. Sur mobile tactile et en mouvement réduit, une galerie normale et tous les contenus accessibles. Le moteur local se réinitialise après une navigation interne.

## Affinage du design et du mouvement — octobre 2026

Palette inchangée : blanc #FAFAFA, encre #171717, gris texte #55585B, surface #F0F1F2, filet #D5D6D7, bleu #2D46F5. Bricolage Grotesque porte les grandes formes typographiques ; Manrope garde les descriptions et interactions lisibles. Alignement à gauche.

Plan initial : conserver le collage de réalisations en ouverture, faire entrer texte et images ensemble, puis garder une lecture calme. La sélection de projets se compose comme un aperçu du travail, avec une grande vue Koryaa et deux vues complémentaires.

    texte noir      | planche bleue + Ineeva / Acasa
    Koryaa grand    | Laure
                    | ICC
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

Palette et typographies inchangées. Les cinq projets gardent leur ordre, leurs textes, leurs liens et leurs images. Les proportions des réalisations donnent la largeur de chaque présentation : 3/2 pour Koryaa, Ineeva et Laure ; 7/4 pour Acasa ; trois affiches sur leur fond d’origine pour ICC/EJP. La hauteur disponible réserve la place du menu et des légendes.

    nom + catégorie                        Voir le projet ↗
    grand visuel dans ses proportions
                  projet suivant au premier plan

L’expansion par découpe de toute la galerie est remplacée par un agrandissement du premier visuel de 94 à 100 %, indépendant de sa légende. Les légendes passent au-dessus des images : le nom, la catégorie et l’accès se lisent dès qu’un projet entre. Les cartes deviennent sticky uniquement si le moteur est disponible sur ordinateur avec pointeur précis. À l’arrivée du suivant, le précédent recule de 4,5 % et de 16 px au maximum. Les écarts entre projets restent bornés à 64–120 px et il n’y a pas de réserve vide après le dernier.

Le défilement natif pilote directement les valeurs, sans ressort ni transition sur la progression. La remontée rejoue les mêmes positions. Une parallaxe bornée à 8 px pour Koryaa et 10 px pour Laure dispose d’une marge dédiée ; Acasa et Ineeva restent intégralement cadrés. Le survol relève le visuel de 3 px et souligne l’accès, avec une flèche bleue en 180 ms. Le focus clavier remet le projet au premier plan et à sa taille lisible.

Sur mobile : galerie verticale, proportions originales, entrée unique de 8 px en 350 ms, liens de projet généreux et trois affiches ICC visibles. En mouvement réduit ou sans moteur, la galerie reste en flux normal, sans effet de pile ni parallaxe. Aucun changement sur l’accueil ou les études de cas.
