// ---------------------------------------------------------------------------
// Curseur personnalisé — Bren'Art Studio
//
// Ce fichier n'est demandé au réseau que si le pointeur est fin ET que le motion
// réduit n'est pas demandé (voir le chargeur dans index.html). Sur tactile et en
// prefers-reduced-motion, rien n'est téléchargé ni exécuté : le curseur natif
// reste seul en place.
//
// Une seule boucle requestAnimationFrame pour les deux éléments. pointermove est
// écouté en passif et ne fait que stocker les coordonnées ; tout est appliqué
// dans la boucle. La boucle s'arrête quand l'onglet est masqué et quand le
// pointeur quitte la fenêtre.
// ---------------------------------------------------------------------------
(function () {
  'use strict';

  if (window.__bsCursor) return;
  window.__bsCursor = true;

  var LERP = 0.15;           // lissage de l'anneau : c'est ce retard qui donne la matière
  var EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';
  var DUR = '240ms';

  var root = document.createElement('div');
  root.setAttribute('aria-hidden', 'true');
  root.style.cssText =
    'position:fixed;top:0;left:0;width:0;height:0;z-index:9500;pointer-events:none;' +
    'mix-blend-mode:difference;opacity:0;transition:opacity 200ms linear;';

  var ring = document.createElement('div');
  ring.style.cssText =
    'position:fixed;top:0;left:0;width:32px;height:32px;margin:-16px 0 0 -16px;' +
    'box-sizing:border-box;border:1px solid #FFFFFF;border-radius:50%;background:transparent;' +
    'display:flex;align-items:center;justify-content:center;pointer-events:none;' +
    'will-change:transform;' +
    'transition:width ' + DUR + ' ' + EASE + ',height ' + DUR + ' ' + EASE +
    ',margin ' + DUR + ' ' + EASE + ',background-color ' + DUR + ' ' + EASE +
    ',opacity ' + DUR + ' ' + EASE + ';';

  var label = document.createElement('span');
  label.textContent = 'Voir';
  label.style.cssText =
    "font-family:'Archivo',sans-serif;font-size:11px;font-weight:500;letter-spacing:0.08em;" +
    'color:#FFFFFF;opacity:0;transition:opacity ' + DUR + ' ' + EASE + ';';
  ring.appendChild(label);

  var dot = document.createElement('div');
  dot.style.cssText =
    'position:fixed;top:0;left:0;width:6px;height:6px;margin:-3px 0 0 -3px;' +
    'border-radius:50%;background:#FFFFFF;pointer-events:none;will-change:transform;' +
    'transition:opacity ' + DUR + ' ' + EASE + ';';

  root.appendChild(ring);
  root.appendChild(dot);
  document.body.appendChild(root);

  // Masquage du curseur natif, piloté par le même vocabulaire data-cursor que les
  // états : marquer un élément suffit, ce fichier n'a pas à connaître de sélecteurs.
  //
  // La consigne « cursor:none sur body uniquement » ne suffit pas en pratique : la
  // feuille de l'agent utilisateur pose cursor:pointer sur les liens, et le markup
  // du site le pose en style inline sur les boutons. On verrait donc la main native
  // ET l'anneau sur tout élément interactif. Le none est donc étendu aux éléments
  // link et media — ceux pour lesquels le curseur personnalisé existe — et jamais
  // aux champs : la barre d'insertion doit rester visible et la sélection confortable.
  // !important est nécessaire pour repasser devant les styles inline du markup.
  var sheet = document.createElement('style');
  sheet.textContent =
    'body,[data-cursor="link"],[data-cursor="media"]{cursor:none!important}' +
    '[data-cursor="text"],input,textarea,select,[contenteditable]{cursor:auto!important}' +
    // Spécificité : [data-cursor="text"] (0,1,0) l'emporterait sur textarea (0,0,1).
    // On ajoute donc l'attribut ici pour repasser devant.
    'textarea[data-cursor],input[type="text"][data-cursor],' +
    'input[type="email"][data-cursor],input[type="tel"][data-cursor]{cursor:text!important}';
  document.head.appendChild(sheet);

  var px = 0, py = 0;           // position réelle du pointeur
  var rx = 0, ry = 0;           // position lissée de l'anneau
  var seen = false;             // le pointeur a-t-il bougé au moins une fois
  var raf = 0;
  var down = false;
  var state = '';               // '', 'link', 'media', 'text'

  function apply(next) {
    if (next === state) return;
    state = next;

    if (next === 'text') {
      root.style.opacity = '0';
      return;
    }
    root.style.opacity = seen ? '1' : '0';

    var size = 32, bg = 'transparent', dotOn = true, labelOn = false;
    if (next === 'link') { size = 56; bg = 'rgba(200,122,83,0.12)'; dotOn = false; }
    else if (next === 'media') { size = 72; dotOn = false; labelOn = true; }

    ring.style.width = size + 'px';
    ring.style.height = size + 'px';
    ring.style.margin = -(size / 2) + 'px 0 0 ' + -(size / 2) + 'px';
    ring.style.backgroundColor = bg;
    dot.style.opacity = dotOn ? '1' : '0';
    label.style.opacity = labelOn ? '1' : '0';
  }

  function scale() {
    // L'échelle du clic est portée par la boucle, avec la position : jamais par une
    // transition CSS sur transform, qui entrerait en concurrence avec elle.
    return down ? 0.85 : 1;
  }

  function loop() {
    rx += (px - rx) * LERP;
    ry += (py - ry) * LERP;
    ring.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0) scale(' + scale() + ')';
    dot.style.transform = 'translate3d(' + px + 'px,' + py + 'px,0)';
    raf = requestAnimationFrame(loop);
  }

  function start() { if (!raf) raf = requestAnimationFrame(loop); }
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }

  window.addEventListener('pointermove', function (e) {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    px = e.clientX; py = e.clientY;
    if (!seen) {
      seen = true;
      rx = px; ry = py;                       // pas de vol plané depuis l'origine
      if (state !== 'text') root.style.opacity = '1';
    }
    start();
  }, { passive: true });

  // Détection d'état par délégation, sur l'attribut data-cursor : ajouter un
  // élément au vocabulaire ne demande pas de toucher à ce fichier.
  document.addEventListener('pointerover', function (e) {
    var t = e.target && e.target.closest ? e.target.closest('[data-cursor]') : null;
    apply(t ? t.getAttribute('data-cursor') : '');
  }, { passive: true });

  window.addEventListener('pointerdown', function () { down = true; }, { passive: true });
  window.addEventListener('pointerup', function () { down = false; }, { passive: true });

  document.addEventListener('pointerleave', function () { root.style.opacity = '0'; stop(); });
  document.addEventListener('pointerenter', function () {
    if (seen && state !== 'text') root.style.opacity = '1';
    start();
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop(); else start();
  });
})();
