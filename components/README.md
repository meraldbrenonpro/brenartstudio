# Composants React du site

Le site conserve son HTML statique, son routeur et son serveur Hono. React et
TypeScript servent au pré-rendu des boutons et à quelques îlots interactifs
isolés (hero, configurateur et navigation mobile). Les boutons restent en HTML.

- `components/ui/liquid-glass-button.tsx` : `LiquidButton`, `Button`, `MetalButton`
  et leurs variantes.
- `components/ui/demo.tsx` : exemple fluide, utilisable sur mobile.
- `components/ui/liquid-glass-navigation.tsx` : capsule de navigation partagée,
  déplacée par le ressort existant ; elle conserve sa position en mouvement réduit.
- `components/render-liquid-buttons.tsx` : intégration aux liens `.rd-button` du
  site ; les destinations, les libellés et les attributs sont conservés.
- `lib/utils.ts` : helper `cn` (`clsx` + `tailwind-merge`).
- `styles/liquid-glass.css` : source Tailwind et matière verre.
- `assets/liquid-glass.css` : feuille publique générée par le build.

Le dossier `components/ui` n’existait pas. Il fournit désormais le chemin attendu
par les imports `@/components/ui/...` et par la configuration shadcn. Les alias
`@/*`, TypeScript et `components.json` sont configurés à la racine.

## Installer et vérifier

```sh
npm ci
npm run typecheck
npm run build
npm start
```

Les dépendances React, Radix Slot, `class-variance-authority`, `clsx`,
`tailwind-merge`, TypeScript et Tailwind sont déjà déclarées et verrouillées.
L’installation manuelle shadcn est terminée : relancer `shadcn init` n’est pas
nécessaire pour utiliser le composant fourni. Le build scanne les fichiers
TypeScript du dossier `components` pour générer les utilitaires Tailwind.

La configuration suit les [alias shadcn](https://ui.shadcn.com/docs/components-json).
Tailwind est chargé [sans Preflight](https://tailwindcss.com/docs/preflight) pour
que ses styles de base ne réinitialisent pas les pages existantes.

## Réutiliser le bouton

```tsx
import { LiquidButton } from "@/components/ui/liquid-glass-button"

<LiquidButton asChild size="xl">
  <a href="/contact">Parlons de votre projet</a>
</LiquidButton>
```

`asChild` conserve un véritable lien. Pour une action, utiliser directement
`<LiquidButton type="button" onClick={...}>…</LiquidButton>` dans une surface
React montée côté navigateur. Aucun fournisseur de contexte ni gestionnaire
d’état global n’est nécessaire. `MetalButton` est disponible en source ; son état
interactif nécessite également une surface React montée côté navigateur.

Chaque instance reçoit un identifiant SVG unique. `filterId` permet d’en fournir
un explicitement au pré-rendu. `refraction` active la distorsion SVG ; elle est
désactivée sur les boutons du site depuis le 24 octobre 2026. Leur feuille
partagée masque les anciennes couches de verre et applique un fond uni. Les préférences de transparence réduite et de contraste accru
utilisent un fond opaque. Les boutons de contact continuent à fonctionner sans
JavaScript ; le formulaire conserve sa propre gestion d’état.

Aucune image ou icône supplémentaire n’est nécessaire. Les réalisations du
studio et les flèches déjà présentes dans les libellés sont conservées.

## Animation du titre d’accueil

`components/ui/dot-field.tsx` expose `DotField`, `DotFieldProps` et
`DotFieldHandle` (`replay`, `setScattered`). `dot-field-demo.tsx` en donne un
exemple autonome. Aucune dépendance supplémentaire n’est nécessaire.

Dans le site, `components/hero-dot-field.tsx` monte l’animation dans un hôte
absolu de `.bh-hero-copy`. Les options `headlineElement` et `scrollElement`
reprennent le titre et la géométrie du héros existants. Le rendu HTML demeure
la source du contenu et de la mise en page ; seul son encrage visuel passe au
canvas une fois celui-ci prêt. `styles/hero-dot-field.css` est inclus dans la
feuille Tailwind générée.

`hero-dot-field-loader.ts` ne charge le module React qu’en entrant sur l’accueil.
Le routeur appelle `BrenHero.sync(page)` après le montage de la page et nettoie
l’îlot à sa destruction. Le build génère le module et son chargeur avec des URL
versionnées. Le défilement demeure natif ; le mouvement réduit garde le vrai
titre, et les préférences changées à chaud sont prises en compte.


## Studio Partenaire

L’offre mensuelle est un îlot React indépendant du hero et de la SPA x-dc.

- `partner-pricing.ts` : tarif, limites, calculs et URL de contact.
- `partner-render.tsx` : devis de départ HTML visible, avec un véritable lien.
- `partner-configurator.tsx` : sélecteur natif, boutons tactiles et domaines optionnels.
- `partner-motion.ts` : pont vers les tokens existants, `motion/react`, mouvement réduit et appareils modestes.
- `partner-loader.ts` : `BrenPartner.sync(page)` / `destroy()`, observation de visibilité et annulation des chargements périmés.
- `lib/build-partner.mjs` : pré-rendu et modules publics versionnés.
- `assets/partner.css` : styles limités au panneau, adaptés à sa largeur réelle.

Les marqueurs `<!-- PARTNER_CONFIGURATOR:home -->` et `:services` dans les
partials sont remplacés au build. Le fallback reste visible tant que React n’a
pas validé son premier rendu. Le module complet ne charge qu’à l’apparition du
panneau sur l’accueil ou les services. Les choix restent en mémoire pendant la
navigation, sans cookie ni stockage persistant.

Le lien transmet uniquement `type`, `jours` et `domaines` au formulaire. Le
routeur préserve ces paramètres ; la saisie libre n’est jamais préremplie ni
écrasée. Le serveur valide le volume et les domaines et recalcule le budget du
message reçu. Ce parcours prépare un échange, sans souscription en ligne.

`npm run test:partner` vérifie calculs, limites, sérialisation, validation et
contenu du message en environnement isolé, sans envoi réel.


## Curseur magnétique

Le composant fourni est adapté dans `components/ui/magnetic-cursor.tsx`. Il
conserve les paramètres de forme, taille, couleur, mélange et intensité et partage
le contrôleur `lib/magnetic-cursor.ts` avec le site HTML. La structure shadcn,
Tailwind et TypeScript existante suffit : aucune installation supplémentaire.

Le chargeur `components/magnetic-cursor-loader.ts` est intégré au loader partagé
du hero. Le build génère `assets/magnetic-cursor.js` et versionne son import. Ce
petit module DOM ne charge que sur un appareil avec souris et survol, hors
mouvement réduit, couleurs forcées et configuration modeste détectée. Aucun
nouveau bundle React n’est envoyé pour le curseur. Les documents projets
conservent leurs octets et utilisent leur environnement commun.

La feuille `styles/magnetic-cursor.css` est incluse dans le style global existant.
Le moteur rend le cercle avant de masquer le pointeur natif et restitue ce
pointeur en cas de sortie, clavier, saisie, sélection, défilement, changement de
préférence ou erreur. Il ne bloque aucun événement. Le rendu s’arrête au repos.

Réutilisation dans une surface React autonome (la feuille partagée doit être
chargée) :

```tsx
import { MagneticCursor } from '@/components/ui/magnetic-cursor'

<MagneticCursor cursorSize={32} magneticFactor={0.18} hoverPadding={6} blendMode="exclusion">
  <a data-magnetic href="/contact">Parlons de votre projet</a>
</MagneticCursor>
```

Dans le site actuel, l’effet est déjà initialisé globalement par le chargeur ;
un second wrapper global n’est donc pas nécessaire. Le contrat commun est
`createMagneticCursor(element, options)` → `reset()` / `destroy()`. Le routeur
appelle `BrenCursor.reset()` lors du changement de page. Les contrôles pouvant se
déplacer utilisent `translate`, limité à huit pixels, et gardent leurs propriétés
`transform` et `scale` existantes. La navigation garde sa position et reçoit
uniquement la morphologie du curseur. `data-no-magnetic` préserve une zone native.
Le tactile reste natif, y compris sur les appareils hybrides.

`npm run test:cursor` contrôle l’animation au repos, les préférences, les zones
natives, les cibles imbriquées, le changement de page, les chargements asynchrones,
les multiples instances et le nettoyage. Aucun ajout de GSAP ou vecteur : les
ressorts de contrôle réutilisent Motion ; le suivi utilise une interpolation
corrigée selon le temps écoulé.


## Navigation mobile en bas d’écran

Le composant fourni est adapté dans `components/ui/bottom-nav-bar.tsx`, avec
`components/ui/bottom-nav-demo.tsx` comme exemple autonome. Les chemins shadcn
existent déjà : `components/ui` pour les composants, `lib/utils.ts` pour `cn`,
`styles/liquid-glass.css` pour la source Tailwind, `assets/liquid-glass.css` pour
la feuille publique générée. Il n’est pas nécessaire de relancer le CLI shadcn.

Les six boutons d’exemple sont remplacés par de vrais liens français : Accueil,
Projets, Expertises, Le studio et Contact. `lib/bottom-navigation.ts` centralise
les routes et associe les études de cas à l’onglet Projets. Aucun contenu projet,
URL ou document protégé n’est modifié. Aucune image supplémentaire n’est requise.

```tsx
import BottomNavBar from '@/components/ui/bottom-nav-bar'

// Exemple autonome, sélection locale :
<BottomNavBar defaultIndex={0} />

// Site : le routeur fournit la route affichée :
<BottomNavBar currentPath="/portfolio/koryaa" stickyBottom />
```

Les props d’origine `className`, `defaultIndex` et `stickyBottom` sont conservées.
`items` accepte des objets `{ label, href, icon }` avec une icône Lucide ;
`currentPath` contrôle la sélection depuis le routeur et `onActiveChange` permet
d’écouter un clic. Aucun provider ni état global supplémentaire n’est nécessaire.
Les liens gardent les fonctions natives du navigateur et `aria-current="page"`.

`lucide-react` est installé. `framer-motion` est déclaré directement en version
14.0.0, identique au moteur déjà utilisé par `motion` : une seule version dans
le verrou npm. Le composant importe `motion/react` pour rester cohérent avec
les autres îlots. Les ressorts et durées reprennent les tokens du site via le
hook existant `usePartnerMotion`, partagé avec cette nouvelle surface.
Les changements de taille utilisent la [projection `layout` par transformations](https://motion.dev/docs/react-layout-animations),
avec un focus visible, des cibles de 44 px et le respect du mouvement réduit.

`components/studio-islands.ts` regroupe les exports du configurateur et de la
barre dans le bundle public existant `assets/partner-configurator.js`. Les deux
îlots ont leurs propres racines et partagent React/Motion dans un même module :
il n’y a pas de troisième bundle complet. `lib/build-partner.mjs` versionne ce
module pour les deux chargeurs, puis `lib/build-hero.mjs` transmet sa version au
chargeur commun déjà référencé par les documents projets préservés.

`components/bottom-nav-loader.ts` monte une racine hors du DOM géré par x-dc
jusqu’à 1020 px ; il ne demande aucun module React pour la barre sur desktop.
Il synchronise clics, historique, changement de route et redimensionnement,
annule les chargements périmés et nettoie sa racine avec `destroy()`. La barre
se masque pendant l’ouverture du menu, la saisie ou l’affichage du clavier
virtuel. En cas d’échec du module, le menu du site continue de fonctionner.

`styles/bottom-nav.css` est importé par la feuille Tailwind partagée. Le fond est
blanc uni, l’onglet actif bleu clair ; aucun effet de verre n’est ajouté aux
contrôles. La zone `safe-area-inset-bottom`, l’espace sous le footer et les
marges de défilement évitent de masquer les derniers liens et champs.

Vérifications : `npm run build`, `npm run typecheck`, `npm run test:projects`,
`npm run test:cursor`, `npm run test:partner`, puis les scripts existants menu,
motion et versionnement des assets. Contrôler aussi dans le navigateur les cinq
routes, précédent/suivant, les pages projet ouvertes directement, le menu, le
focus clavier, les formulaires, le redimensionnement et le mouvement réduit.
