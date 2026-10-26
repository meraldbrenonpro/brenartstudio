# Projets — validation locale du 26 octobre 2026

## Résultat

Galerie filtrable retenue par Mérald après présentation de trois options :
galerie, regroupement par discipline et liste éditoriale. Nouvelle page dédiée
à EJP Le Mag dans Motion Design, avec la capture fournie comme couverture.
L’accueil ne présente plus la vidéo. La DA Apple bleu/blanc, le hero et les quatre
études de cas existantes restent conservés. Aucun déploiement.

## Fichiers concernés

| Sources | Rôle |
| --- | --- |
| `content/portfolio.html` | Nouvelle galerie de cinq réalisations, filtres et statut accessible |
| `assets/project-gallery.css` | Grille responsive, filtres opaques et nouvelle fiche Motion Design |
| `content/ejp-le-mag.html` | Contexte associatif, vidéo, crédits, images, sous-titres et transcription |
| `content/home.html` | Retrait de la seule section vidéo, hero préservé |
| `content/services.html` | Lien vers la nouvelle fiche |
| `index.html` | Routage, valeurs du template, filtre dans l’URL, pause vidéo sur la bonne page et SEO |
| `build-static.mjs` | Génération de six pages, dont la nouvelle fiche, sans régénérer les quatre anciennes |
| `lib/creative-content.mjs` | Sources éditoriales et frontière des quatre études de cas |
| `content/protected-projects.json` | Retrait de la seule protection de galerie explicitement libérée ; toutes les autres empreintes identiques |
| `server/index.js` | Route locale `/portfolio/ejp-le-mag` |
| `sitemap.xml`, `llms.txt` | Nouvelle réalisation et disciplines |
| `artifacts/project-preservation-smoke.mjs` | Test de protection adapté au périmètre de galerie désormais éditable |
| `DESIGN.md`, `content/ejp-le-mag-production.md` | Direction retenue et provenance des médias |

Le build met à jour les cinq documents commerciaux existants et crée
`portfolio/ejp-le-mag/index.html`. Les documents légaux reçoivent uniquement
les nouvelles empreintes des styles partagés.

## Médias ajoutés

- `assets/videos/ejp-le-mag-cover-800.webp`, `ejp-le-mag-cover-1600.webp` : capture
  fournie, réduite proportionnellement sans recadrage.
- `assets/videos/ejp-le-mag-cover-og.jpg` : image de partage1200×630 avec marges.
- `assets/videos/ejp-le-mag-plateau.webp`, `ejp-le-mag-rubrique.webp` : deux
  photogrammes du film existant, sans visuel fictif.

Les deuxMP4 et leurs pistesVTT sont réutilisés sans modification. L’ancienne
vignette est conservée dans les fichiers, sans être référencée par les lecteurs.

## Vérifications

- Build : PASS, six pages générées.
- Typage : PASS. Aucune commande lint existante.
- Projets : PASS, quatre sections exactes et56fichiers protégés, ainsi que leurs
  métadonnées, routes et données structurées. Comparaison supplémentaire au
  manifeste sauvegardé au début de cette intervention : identique hors galerie.
- Tests existants Motion, menu, versions d’assets, curseur et Studio Partenaire :
  PASS. Le test contact utilise son scénario fournisseur absent ; aucun email envoyé.
- Chrome :5projets au total,3Branding,2Webdesign,1Motion Design. Ineeva apparaît
  dans les deux disciplines correspondantes, avec une seule carte par sélection.
- URL partageable, rechargement direct, précédent/suivant et maintien du focus :
  PASS. Le filtre ne recharge pas la page.
- Nouvelle fiche atteinte depuis la galerie et directement : PASS. Title,
  description, canonical et image de partage spécifiques dans le HTML généré.
- Lecture décodée depuis la nouvelle route et sous-titres : PASS. Arrêt après
  navigation. Couverture fournie vérifiée sur les lecteurs et la carte.
- Retour depuis la page Acasa figée vers la nouvelle galerie : PASS.
- SansJavaScript : cinq cartes et accès aux cas disponibles ; fiche, contrôles
  vidéo et intégrale dépliable accessibles. Les filtres annoncent leur besoin deJS.
- Viewports320,390,768,1440px : aucun débordement ; filtres44px minimum.
- Aucun échec réseau local ou erreurJavaScript observé sur ces parcours.
- Captures exactes desktop/mobile inspectées, avec décodage des images différées
  avant la capture finale.

## Livraison

Skills appliqués : Apple Design, Frontend Design, Redesign Existing Projects et
Motion Foundations. Aucun plugin externe n’est nécessaire à cette modification
locale. Aucune dépendance ajoutée, aucune migration et aucun déploiement.
Le test tactile est une émulation navigateur, pas un contrôle sur téléphone physique.
