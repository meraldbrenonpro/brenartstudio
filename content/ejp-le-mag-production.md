# EJP Le Mag — sources et intégration web

Ajout du 26 octobre 2026. Le projet est présenté comme une réalisation pour une
association. Mérald confirme avoir réalisé la direction artistique, la conception
des personnages et décors, l’animation, le montage, les voix et la musique.
Aucune mention de bénévolat, d’équipe ou de résultat commercial n’est ajoutée.

## Source et dérivés

Source fournie : `/Users/meraldbrenon/Downloads/EJP Le Mag 25:10:26.mp4`.
L’original reste intact : 153473922 octets, SHA256
`785b76cebeac73b3796359533dc654e4845a332a53ba25ee9fa7f9fe9c1de67f`.

La vidéo originale mesure1920×1080,30images/s et dure384,64s. Les exports web
H.264/AAC sont à1280×720,30images/s, CRF24 et audio128kbit/s, avec l’atome
moov placé avant mdat (faststart). Le court extrait reprend les60premières
secondes sans réécrire le montage ; la coupe suit une phrase complète.
La première vignette du plateau est conservée dans les fichiers, sans être utilisée.
La couverture actuelle est la capture fournie par Mérald le 26 octobre :
`/Users/meraldbrenon/Desktop/Capture d’écran 2026-10-26 à 09.29.15.png`.
Elle est réduite proportionnellement en WebP800/1600px, sans recadrage.
Une version1200×630 avec marges sert au partage social. Les deux images du
corps de page sont des photogrammes du film (plateau10s, communication30s).
Aucun visuel fictif de réalisation n’est généré pour cette section.

| Fichier dans `assets/videos/` | Taille | SHA256 |
| --- | --- | --- |
| `ejp-le-mag-extrait.mp4` | 3,507,609 octets | `7f7316128ec4caf82de939cc9b1abd15548c4cc962156b3dc636886672eca3f8` |
| `ejp-le-mag-complet.mp4` | 29,873,474 octets | `a274c84b7430ae4d05b81e6f500715d0cb9fa6c6c596e89ca691c5b0ca5a631a` |
| `ejp-le-mag-poster.webp` | 42,150 octets | `6007574c6732f15a3fd8b465ad2fd4942d75b9728dabcd04562dce5553f36266` |
| `ejp-le-mag-extrait-fr.vtt` | 1,460 octets | `f6f16758b1ee1c38f77f2ea6d19fb8310df670a10314a6904b8e448d2c09d326` |
| `ejp-le-mag-complet-fr.vtt` | 9,196 octets | `7315386cc8c85c6146f6e622088701796fedee913d675f0c2ac449420eef6649` |

## Accessibilité et lecture

Deux pistesVTT françaises :17repères pour l’extrait et104pour le magazine.
La reconnaissance locale a été corrigée avec le conducteur, notamment les noms,
les pôles, les adresses et les inserts parlés. Le passage de prière non intelligible
est signalé « Prière, paroles indistinctes » plutôt que transcrit arbitrairement.
La transcription visible de l’extrait est dans le détail natif de sa page projet.

Les vidéos utilisent `preload="none"`, des commandes natives et `playsInline`.
Pas de lecture automatique ni de boucle. Le moteurx-dc attend un booléen réel
pour `controls` : le partial emploie `{{ true }}` et le préfixe`sc-camel-` pour
`playsInline`/`srcLang`. L’initialisation assure aussi ces propriétés natives.
Leur logique est séparée du média décoratif en boucle Acasa.

Les lecteurs se mettent en pause à la sortie de page, à la disparition complète
hors du viewport, à l’arrière-plan, et lorsqu’un autre film démarre. La fermeture
du détail de l’intégrale coupe également le son. La lecture ne reprend jamais
seule. Les liens directsMP4 et le HTML utile restent accessibles sansJavaScript.

## Maintenance

Page dédiée : `/portfolio/ejp-le-mag`, source `content/ejp-le-mag.html`.
La vidéo est retirée de l’accueil. Galerie : `content/portfolio.html`, filtres
Branding, Webdesign et Motion Design, source partagée avec le nouveau build.
Lien depuis les expertises :
`content/services.html`. Styles : `assets/creative-studio.css` et
`assets/project-gallery.css`. Cycle de vie :
`index.html` (`_studioVideos`, `_pauseStudioVideos`). Régénérer avec
`npm run build`. Les quatre études de cas originales restent protégées. La seule protection
levée sur demande explicite concerne la galerie, pas ses études de cas.
Les sous-titres et l’extrait doivent être réexportés ensemble si la vidéo change.

ElevenLabs est ajouté indépendamment dans `content/about.html`, avec son symbole
officiel local et les sources dans `assets/tools/SOURCES.md`. Aucun outil de
reconnaissance, d’encodage ou d’icônes n’est ajouté aux dépendances du site.
