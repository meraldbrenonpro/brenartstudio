# Bren’Art Studio — studio et portfolio

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
