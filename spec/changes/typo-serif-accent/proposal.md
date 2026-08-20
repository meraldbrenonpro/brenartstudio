# Proposal : serif d'accent

## Why

Le site est typographiquement irréprochable et parfaitement muet sur ce qu'il vend.
Une seule famille, une seule graisse dominante, aucun contraste : rien ne signale
qu'un studio de création parle. La demande était de se rapprocher du « fait main,
créa design » de [studioyuna.com](https://www.studioyuna.com/).

Relevé de la référence, dans son code plutôt que de mémoire. Son effet tient sur
trois gestes, et sur rien d'autre :

1. **Instrument Serif 400** glissé sur des mots choisis au milieu de titres en sans
   (« inoubliables », « heureuses. », « La brand designer »). C'est le levier
   principal : l'écart serif/sans à l'intérieur d'une même phrase est ce qui lit
   « créa » plutôt que « corporate ».
2. Un **bloc de couleur incliné de 1 à 1,5°** derrière ces mots
   (`matrix(0.999657, -0.0261769, …)`, rayon 5px). Un rectangle qui n'est pas
   d'équerre avec la grille se lit comme posé à la main.
3. Une **manuscrite** (Homemade Apple) réservée aux apartés personnels et aux
   prénoms des clientes. Jamais dans le corps de texte.

Ce qui est **absent** vaut d'être noté : aucun grain, aucune texture papier, aucun
SVG décoratif, aucune forme organique. Le côté artisanal est obtenu sans bruit
visuel — donc compatible avec « épure, rien de décoratif qui ne serve la lecture ».

## Ce qui est retenu, et ce qui ne l'est pas

| Geste | Décision | Raison |
|---|---|---|
| Serif d'accent | **Retenu** | Le levier qui rapporte le plus, pour une seule famille ajoutée |
| Bloc incliné | Écarté | Plus démonstratif, plus dur à doser, plus loin de l'épure |
| Manuscrite | Écarté | Deuxième famille, discipline supplémentaire à tenir dans le temps |
| Fond blanc cassé chaud | Impossible | La charte interdit tout fond chaud. Le noir `#070707` ne bouge pas |

## Amendement à la charte

La charte donnait « Archivo » comme famille unique et non négociable. Elle devient :

> **Archivo** pour tout, **Instrument Serif 400** comme unique face d'accent.

C'est un amendement volontaire, pas un contournement. Sans seconde famille, l'effet
recherché est inatteignable : l'italique d'Archivo a été maquetté et l'écart avec son
romain est trop faible pour que l'accent se voie.

## Les deux emplois, et pas un de plus

| Emploi | Traitement | Nombre |
|---|---|---|
| Accent dans un `h1` en phrase | Instrument Serif **italique**, `1.14em` | 5 |
| `h1` de page projet | Instrument Serif **romain**, bas de casse | 4 |
| Citations client (`blockquote`) | Instrument Serif **romain**, 19px | 3 |

**Romain ou italique.** Studio Yuna utilise le romain. Chez eux le mot est à 55px sur
un rectangle coloré : l'intention est indiscutable. Le bloc étant écarté, à la taille
de nos titres le romain se lit comme une police qui n'a pas chargé. L'italique porte
l'intention tout seul.

La distinction n'est pas arbitraire : **italique quand le serif souligne un mot dans
une phrase** (c'est une emphase), **romain quand le serif porte le titre entier**
(c'est une composition de titre, pas une emphase).

**Citations.** Les guillemets signalent déjà le changement de voix. Serif *et*
italique feraient trois signaux pour un seul travail. Romain, donc, qui se lit aussi
mieux sur la longueur.

**Titres de page projet.** Aujourd'hui Archivo 600 capitales, posés en bas du visuel
de couverture. Le voile dégradé (`rgba(7,7,7,0.7)` en pied) protège la lisibilité :
les deux options tiennent, le choix se fait donc sur le caractère. Retenu : **bas de
casse**, taille augmentée d'environ 25 % pour compenser. En capitales, un serif 400
perd les pleins et déliés qui font qu'un serif se lit comme un serif — on obtiendrait
des capitales fines qui pourraient appartenir à n'importe quelle fonte.

## La règle qui protège dans le temps

> **Un seul accent par titre. Jamais deux.**

L'accent peut être un mot ou une locution courte (« une seule main »). C'est cette
règle, et elle seule, qui empêche le procédé de devenir un tic. Un serif d'accent mal
dosé vieillit vite.

## Les neuf titres

| Page | Titre, accent en gras |
|---|---|
| Accueil | Une marque qu'on **reconnaît** avant de la lire. |
| Portfolio | Travaux **sélectionnés** |
| Services | Trois offres, **une seule main**. |
| À propos | Le visage et la **voix** du studio. |
| Contact | **Parlons** de votre projet. |
| 4 pages projet | Le nom du projet, en entier |

## Contrainte structurante

`index.html` reste la source unique. Les 8 pages générées ne sont jamais éditées à la
main : `node build-static.mjs` après chaque modification. `support.js` n'est pas touché.

Le balisage retenu est `<em>`. Sémantiquement juste — c'est une emphase — et
dégradation gracieuse : si Instrument Serif ne charge pas, on récupère l'italique
d'Archivo au lieu de rien.

## Coût

Instrument Serif s'ajoute à la requête Google Fonts qui sert déjà Archivo : **pas un
tiers de plus**, une famille de plus chez un hôte déjà contacté. Le poids RGPD est
inchangé, seul le poids réseau augmente, d'environ 15 à 20 ko.

L'auto-hébergement des deux familles reste souhaitable et supprimerait la dernière
requête tierce partant sans consentement. Hors périmètre de ce lot.
