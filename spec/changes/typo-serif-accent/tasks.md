# Implementation Tasks

Une seule phase. `node build-static.mjs` en fin de parcours, puis vérification au
navigateur avant commit.

## 1 · Chargement de la police

1. Dans `index.html`, `<helmet>` : ajouter `Instrument+Serif:ital@0;1` à la requête
   Google Fonts existante qui sert déjà Archivo. Une seule balise `<link>`, pas deux.

## 2 · Règles de style

2. Dans le bloc `<style>` du socle, sous les tokens, ajouter la section « serif
   d'accent » :
   - `h1 em` → `font-family:'Instrument Serif',serif; font-weight:400;
     font-style:italic; font-size:1.14em; letter-spacing:0;`
     Le `1.14em` compense la hauteur d'œil plus basse du serif ; le `letter-spacing:0`
     annule l'approche négative héritée des titres Archivo, qui resserre trop un serif.
   - `h1[data-bs-serif]` → `font-family:'Instrument Serif',serif; font-weight:400;
     text-transform:none; letter-spacing:0;` avec une taille relevée d'environ 25 %.
   - `blockquote` → `font-family:'Instrument Serif',serif; font-size:19px;
     line-height:1.5;`

## 3 · Markup des cinq titres en phrase

3. Envelopper d'un `<em>` le seul accent de chaque titre :
   - Accueil : `qu'on <em>reconnaît</em> avant`
   - Portfolio : `Travaux <em>sélectionnés</em>`
   - Services : `Trois offres, <em>une seule main</em>`
   - À propos : `la <em>voix</em> du&nbsp;studio`
   - Contact : `<em>Parlons</em> de votre projet`
4. Ne pas toucher au carré ni au point terracotta qui terminent ces titres : c'est un
   motif existant, il ne doit pas entrer en concurrence avec l'accent.

## 4 · Les quatre titres de page projet

5. Poser `data-bs-serif` sur les quatre `h1` de page projet et retirer leur
   `text-transform:uppercase` ainsi que leur `font-weight:600` du style inline.
6. Vérifier que `data-hero-line` et la montée masquée du titre fonctionnent toujours :
   le serif a des jambages plus longs, le masque `overflow:hidden` peut couper.

## 5 · Citations

7. Les trois `<blockquote>` de la page d'accueil prennent le style serif par la règle
   d'élément, sans modification de markup. Vérifier qu'aucun autre `blockquote`
   n'existe ailleurs dans le document.

## 6 · Vérification

8. `node build-static.mjs`.
9. Au navigateur, après `document.fonts.ready` : Instrument Serif chargé en romain et
   en italique, appliqué aux 9 titres et aux 3 citations, et nulle part ailleurs.
10. Recette de largeur à 320, 375, 768 et 1440 px sur les 9 pages : aucun débordement
    horizontal, aucun élément dont le contenu dépasse son conteneur, `hyphens` toujours
    à `manual`.
11. Contrôler le contraste des titres projet sur leur photographie de couverture.
12. Vérifier qu'aucun tiret cadratin n'est réintroduit.
