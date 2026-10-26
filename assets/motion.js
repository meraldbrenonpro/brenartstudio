/* Bren'Art: scroll motion follows native scrolling; content stays visible by default. */
(() => {
  'use strict';

  if (window.BrenMotion && typeof window.BrenMotion.destroy === 'function') {
    window.BrenMotion.destroy();
  }

  const library = window.BrenMotionLib;
  const tokens = library && library.motionTokens;
  const springs = library && library.springs;
  const lowEnd = !!(library && library.isLowEnd());
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const coarse = window.matchMedia('(pointer: coarse)');
  const compact = window.matchMedia('(max-width: 760px)');
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  const preferences = [reduced, coarse, compact, fine];
  const properties = ['--stack-scale', '--stack-shift', '--expand', '--parallax', '--gallery-expand', '--stack-caption'];
  const galleries = new Set();
  const touched = new Set();
  const active = new Set();
  const revealed = new WeakSet();
  const animations = new Map();
  const sizes = new WeakMap();
  let values = new WeakMap();
  let stacks = [];
  let expands = [];
  let parallax = [];
  let frame = 0;
  let refreshFrame = 0;
  let destroyed = false;
  let motionObserver = null;
  let revealObserver = null;
  let resizeObserver = null;

  const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
  const viewportHeight = () => document.documentElement.clientHeight || window.innerHeight;
  const canAnimate = () => !!library && !reduced.matches && !document.hidden;
  const decorativeAllowed = () => canAnimate() && !lowEnd && !coarse.matches && !compact.matches;
  const distortionsAllowed = decorativeAllowed;
  let indicatorControl = null;
  let indicatorNode = null;
  let indicatorTarget = '';
  const pressed = new Set();
  const buttonSprings = new Map();
  const menus = new Map();
  const buttonSelector = '.rd-button, .rd-menu-toggle, .ba-round-link';

  // Route exits retain their last frame until the next page has been mounted.
  // Entrances survive geometry refreshes; completed effects release their styles.
  function animateNode(node, keyframes, transition, { route = false, entrance = false, hold = false } = {}) {
    if (!node || !library || typeof node.animate !== 'function') return null;
    const previous = animations.get(node);
    if (previous) previous.cancel();
    const originals = Object.keys(keyframes).map((property) => [property, node.style.getPropertyValue(property)]);
    const control = library.animate(node, keyframes, transition);
    let settle;
    let settled = false;
    let cleaned = false;
    const finished = new Promise((resolve) => { settle = resolve; });
    const restore = () => {
      for (const [property, value] of originals) {
        if (value) node.style.setProperty(property, value);
        else node.style.removeProperty(property);
      }
    };
    const resolve = (completed) => {
      if (settled) return;
      settled = true;
      settle(completed);
    };
    const job = {
      finished,
      route,
      entrance,
      cancel() {
        if (cleaned) return;
        cleaned = true;
        control.cancel();
        restore();
        if (animations.get(node) === job) animations.delete(node);
        resolve(false);
      },
    };
    animations.set(node, job);
    control.finished.then(() => {
      if (cleaned) return;
      if (!hold) {
        cleaned = true;
        restore();
        if (animations.get(node) === job) animations.delete(node);
      }
      resolve(true);
    }, () => job.cancel());
    return job;
  }

  function cancelPage() {
    for (const job of Array.from(animations.values())) job.cancel();
    resetButtons();
    pressed.clear();
  }

  function enterPage(root, { navigation = false } = {}) {
    if (!root || !canAnimate()) return;
    const copy = root.querySelector('.bh-hero-copy');
    const heroVisible = copy && copy.getBoundingClientRect().bottom > 0;
    if (navigation && !heroVisible) {
      animateNode(root, { opacity: [0, 1] }, {
        duration: lowEnd ? tokens.duration.fast : tokens.duration.normal,
        ease: tokens.easing.smooth,
      }, { route: true });
      return;
    }
    if (lowEnd || (!heroVisible && !decorativeAllowed())) {
      animateNode(root, { opacity: [0.7, 1] }, { duration: tokens.duration.fast, ease: tokens.easing.smooth });
      return;
    }
    if (heroVisible) {
      const small = compact.matches || coarse.matches;
      const stagger = small ? tokens.hero.compactStagger : tokens.hero.stagger;
      const enter = (node, keyframes, delay = 0) => animateNode(node, keyframes, {
        ...springs.gentle, delay,
      }, { entrance: true });
      copy.querySelectorAll('h1>span').forEach((line, index) => {
        if (line.parentElement && line.parentElement.hasAttribute('data-dot-field-headline')) return;
        enter(line, {
          opacity: [0.65, 1],
          transform: ['translateY(' + tokens.distance.md + 'px)', 'none'],
        }, stagger * index);
      });
      enter(copy.querySelector('.bh-hero-description'), { opacity: [0.85, 1] }, stagger);
      root.querySelectorAll('.bh-hero-plane').forEach((plane, index) => {
        // Artwork stays flat and stable; only its containing board arrives.
        enter(plane, { opacity: [0.92, 1], transform: ['translateY(' + tokens.distance.md + 'px)', 'none'] }, stagger * (index + 1));
      });
      copy.querySelectorAll('.bh-hero-actions>a').forEach((action, index) => {
        enter(action, { opacity: [0.9, 1], transform: ['translateY(' + tokens.distance.sm + 'px)', 'none'] },
          stagger * (index + 2));
      });
      const foot = root.querySelector('.bh-hero-foot');
      enter(foot, { opacity: [0.85, 1] }, stagger * 2);
    } else {
      animateNode(root, { opacity: [0.6, 1] }, { duration: tokens.duration.normal, ease: tokens.easing.smooth });
    }
  }

  function exitPage(root) {
    const opacity = root ? parseFloat(window.getComputedStyle(root).opacity) : 1;
    cancelPage();
    if (!root || !canAnimate()) return Promise.resolve(true);
    const job = animateNode(root, { opacity: [Number.isFinite(opacity) ? opacity : 1, 0] }, {
      duration: tokens.duration.exit,
      ease: tokens.easing.sharp,
    }, { route: true, hold: true });
    return job ? job.finished : Promise.resolve(true);
  }

  function resumePage(root) {
    const opacity = root ? parseFloat(window.getComputedStyle(root).opacity) : 1;
    cancelPage();
    if (root && canAnimate() && Number.isFinite(opacity) && opacity < 1) {
      animateNode(root, { opacity: [opacity, 1] }, {
        duration: tokens.duration.fast, ease: tokens.easing.smooth,
      }, { route: true });
    }
  }

  function moveIndicator(node, transform, instant) {
    if (indicatorControl) indicatorControl.stop();
    indicatorControl = null;
    indicatorNode = node;
    indicatorTarget = transform;
    if (instant || !canAnimate() || lowEnd) node.style.transform = transform;
    else indicatorControl = library.animate(node, { transform }, springs.snappy);
  }

  function openDetail(event) {
    const detail = event.target;
    if (!detail || detail.tagName !== 'DETAILS' || !detail.open || !canAnimate()) return;
    const body = Array.from(detail.children).find((child) => child.tagName !== 'SUMMARY');
    showContent(body);
  }

  function showContent(node) {
    if (node && canAnimate()) animateNode(node, { opacity: [0.5, 1] }, {
      duration: tokens.duration.fast, ease: tokens.easing.smooth,
    });
  }

  // Individual scale composes with any in-flight entrance transform. Retaps use
  // the current spring position/velocity instead of restarting at either end.
  function buttonSpring(node) {
    let state = buttonSprings.get(node);
    if (state) return state;
    const original = node.style.getPropertyValue('scale');
    const computed = parseFloat(window.getComputedStyle(node).scale);
    const rest = Number.isFinite(computed) ? computed : 1;
    const restore = () => {
      if (original) node.style.setProperty('scale', original);
      else node.style.removeProperty('scale');
    };
    const value = library.createSpringValue(rest, (scale) => {
      node.style.setProperty('scale', scale.toFixed(5));
    }, (target) => {
      if (target !== rest || pressed.has(node)) return;
      restore();
      buttonSprings.delete(node);
    });
    state = { value, rest, restore };
    buttonSprings.set(node, state);
    return state;
  }

  function resetButtons() {
    for (const state of buttonSprings.values()) {
      state.value.stop();
      state.restore();
    }
    buttonSprings.clear();
    pressed.clear();
  }

  function press(event) {
    if (!canAnimate() || lowEnd || (event.type === 'pointerdown' && event.button !== 0)) return;
    if (event.type === 'keydown' && (event.repeat || !['Enter', ' '].includes(event.key))) return;
    const node = event.target.closest && event.target.closest(buttonSelector);
    if (!node || node.disabled || node.getAttribute('aria-disabled') === 'true') return;
    pressed.add(node);
    const state = buttonSpring(node);
    state.value.set(state.rest * tokens.scale.subtle, springs.instant);
  }

  function release(event) {
    if (event.type === 'keyup' && !['Enter', ' '].includes(event.key)) return;
    for (const node of pressed) {
      const state = buttonSprings.get(node);
      if (!state) continue;
      if (canAnimate()) state.value.set(state.rest, springs.release);
      else { state.value.stop(); state.restore(); buttonSprings.delete(node); }
    }
    pressed.clear();
  }

  function cancelMenu(panel) {
    for (const [node, state] of menus) {
      if (panel && node !== panel) continue;
      state.value.stop();
      state.restore();
      if (state.settle) state.settle(false);
      menus.delete(node);
    }
  }

  // The component owns display, focus and inert. It keeps the panel mounted
  // until this promise resolves true; superseded requests resolve false.
  function menu(open, panel, scrim, { immediate = false } = {}) {
    if (!panel || !library || destroyed) return Promise.resolve(true);
    let state = menus.get(panel);
    if (state && state.scrim !== scrim) { cancelMenu(panel); state = null; }
    if (!state) {
      const originals = [
        [panel, 'transform', panel.style.getPropertyValue('transform')],
        [panel, 'opacity', panel.style.getPropertyValue('opacity')],
        ...(scrim ? [[scrim, 'opacity', scrim.style.getPropertyValue('opacity')]] : []),
      ];
      const restore = () => {
        for (const [node, property, original] of originals) {
          if (original) node.style.setProperty(property, original);
          else node.style.removeProperty(property);
        }
      };
      const value = library.createSpringValue(open ? 0 : 1, (progress) => {
        panel.style.opacity = String(progress);
        panel.style.transform = 'translateY(' + (-8 * (1 - progress)).toFixed(3) + 'px) scale(' + (0.98 + 0.02 * progress).toFixed(5) + ')';
        if (scrim) scrim.style.opacity = String(progress);
      }, (target) => {
        if (target === 1) restore();
        if (state.settle) { const settle = state.settle; state.settle = null; settle(true); }
      });
      state = { value, restore, scrim, target: open ? 1 : 0, settle: null };
      menus.set(panel, state);
    }
    if (state.settle) state.settle(false);
    const finished = new Promise((resolve) => { state.settle = resolve; });
    state.target = open ? 1 : 0;
    if (immediate || !canAnimate() || lowEnd) state.value.jump(state.target);
    else state.value.set(state.target, springs.snappy);
    return finished;
  }

  function onVisibility() {
    if (document.hidden) {
      window.cancelAnimationFrame(frame);
      frame = 0;
      cancelPage();
      for (const state of menus.values()) state.value.jump(state.target);
    } else refresh();
  }

  function clearMotion(includeRoutes = false) {
    for (const animation of Array.from(animations.values())) {
      if (includeRoutes || (!animation.route && !animation.entrance)) animation.cancel();
    }
    for (const node of touched) {
      for (const property of properties) node.style.removeProperty(property);
    }
    touched.clear();
    for (const gallery of galleries) gallery.removeAttribute('data-ba-gallery-motion');
    galleries.clear();
    values = new WeakMap();
  }

  function write(node, property, value) {
    let cached = values.get(node);
    if (!cached) {
      cached = Object.create(null);
      values.set(node, cached);
    }
    if (cached[property] === value) return;
    cached[property] = value;
    touched.add(node);
    node.style.setProperty(property, value);
  }

  function schedule() {
    if (!destroyed && !frame && !document.hidden) frame = window.requestAnimationFrame(update);
  }

  function scheduleRefresh() {
    if (destroyed || refreshFrame) return;
    refreshFrame = window.requestAnimationFrame(() => {
      refreshFrame = 0;
      refresh();
    });
  }

  function update() {
    frame = 0;
    if (destroyed || !distortionsAllowed() || document.hidden) return;

    const height = viewportHeight();
    const writes = [];
    const rects = new Map();
    // Complete all geometry reads before writing custom properties.
    const rect = (node) => {
      if (!rects.has(node)) rects.set(node, node.getBoundingClientRect());
      return rects.get(node);
    };

    for (const stack of stacks) {
      if (!stack.gallery && !stack.cards.some((card) => active.has(card))) continue;
      if (stack.gallery) {
        // The container stays in normal flow, so this never measures its own scale.
        const distance = Math.max(tokens.distance.xl, stack.start - stack.tops[0]);
        const progress = clamp((stack.start - rect(stack.container).top) / distance);
        writes.push([stack.cards[0], '--gallery-expand', progress.toFixed(4)]);
      }
      for (let index = 0; index < stack.cards.length - 1; index += 1) {
        const card = stack.cards[index];
        const next = stack.cards[index + 1];
        const nextRect = rect(next);
        // The CSS transform origin is top center. Remove our prior translation
        // from the measured position so neighbouring cards do not feed back.
        const nextValues = values.get(next);
        const shift = nextValues ? parseFloat(nextValues['--stack-shift']) || 0 : 0;
        const distance = Math.max(1, stack.gallery
          ? stack.heights[index] * tokens.portfolio.overlap
          : Math.min(height * 0.8, stack.heights[index]));
        const end = stack.gallery ? stack.tops[index + 1] : stack.tops[index];
        const progress = clamp(1 - (nextRect.top - shift - end) / distance);
        writes.push([card, '--stack-scale', (1 - progress * (stack.gallery ? tokens.portfolio.recession : 0.06)).toFixed(4)]);
        writes.push([card, '--stack-shift', (-progress * (stack.gallery ? tokens.portfolio.shift : 20)).toFixed(2) + 'px']);
        if (stack.gallery) {
          const threshold = tokens.portfolio.captionThreshold;
          writes.push([card, '--stack-caption', (1 - clamp((progress - threshold) / (1 - threshold))).toFixed(4)]);
        }
      }
    }

    for (const node of expands) {
      if (!active.has(node)) continue;
      const progress = clamp((height * 0.8 - rect(node).top) / (height * 0.65));
      writes.push([node, '--expand', progress.toFixed(4)]);
    }

    for (const node of parallax) {
      if (!active.has(node)) continue;
      const box = rect(node);
      const center = box.top + box.height * 0.5;
      const progress = clamp((height * 0.5 - center) / ((height + box.height) * 0.5), -1, 1);
      const amplitude = node.closest('[data-ba-gallery]')
        ? clamp(Number(node.getAttribute('data-ba-parallax')) || 0, 0, tokens.portfolio.maxParallax) : 20;
      writes.push([node, '--parallax', (progress * amplitude).toFixed(2) + 'px']);
    }

    for (const [node, property, value] of writes) write(node, property, value);
  }

  function reveal(node) {
    if (!decorativeAllowed() || revealed.has(node)) return;
    revealed.add(node);
    const requestedDelay = Number(node.getAttribute('data-ba-reveal-delay')) || 0;
    animateNode(node, { opacity: [0.55, 1], transform: ['translateY(' + tokens.distance.sm + 'px)', 'none'] }, {
      duration: tokens.duration.normal,
      delay: clamp(requestedDelay / 1000, 0, tokens.duration.instant),
      ease: tokens.easing.smooth,
    });
  }

  function revealGallery(node) {
    if (!canAnimate() || lowEnd || revealed.has(node)) return;
    revealed.add(node);
    animateNode(node, { opacity: [0.85, 1], transform: ['translateY(' + tokens.distance.sm + 'px)', 'none'] }, {
      duration: tokens.duration.normal, ease: tokens.easing.smooth,
    });
  }

  function visibleRoots() {
    const screens = Array.from(document.querySelectorAll('[data-page]'));
    if (screens.length) {
      return screens.filter((screen) => screen.getClientRects().length &&
        window.getComputedStyle(screen).display !== 'none');
    }
    const main = document.querySelector('main') || document.body;
    return main ? [main] : [];
  }

  function refresh() {
    if (destroyed) return;
    if (!canAnimate() || lowEnd) {
      resetButtons();
      for (const state of menus.values()) state.value.jump(state.target);
    }
    if (indicatorControl && (reduced.matches || lowEnd || document.hidden)) {
      indicatorControl.cancel();
      indicatorControl = null;
      if (indicatorNode) indicatorNode.style.transform = indicatorTarget;
    }
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
    if (motionObserver) motionObserver.disconnect();
    if (revealObserver) revealObserver.disconnect();
    if (resizeObserver) resizeObserver.disconnect();
    clearMotion(reduced.matches);
    active.clear();
    stacks = [];
    expands = [];
    parallax = [];

    document.documentElement.toggleAttribute('data-ba-light', lowEnd);
    const roots = visibleRoots();
    const headings = [];
    const galleryReveals = [];
    for (const root of roots) {
      headings.push(...root.querySelectorAll('[data-ba-reveal]'));
      if ((compact.matches || coarse.matches) && canAnimate() && !lowEnd) {
        galleryReveals.push(...root.querySelectorAll('[data-ba-gallery-reveal]'));
      }
      if (distortionsAllowed()) {
        for (const container of root.querySelectorAll('[data-ba-stack]')) {
          const gallery = container.hasAttribute('data-ba-gallery');
          if (gallery && !fine.matches) continue;
          if (gallery) {
            container.setAttribute('data-ba-gallery-motion', '');
            galleries.add(container);
          }
          const cards = Array.from(container.querySelectorAll('[data-ba-project]'))
            .filter((card) => card.closest('[data-ba-stack]') === container);
          if (cards.length > 1) stacks.push({
            cards, gallery, container,
            start: gallery ? container.getBoundingClientRect().top + (window.scrollY || 0) : 0,
            heights: cards.map((card) => card.offsetHeight),
            tops: cards.map((card) => parseFloat(window.getComputedStyle(card).top) || 0),
          });
        }
        expands.push(...root.querySelectorAll('[data-ba-expand]'));
        parallax.push(...root.querySelectorAll('[data-ba-parallax]'));
      }
      if (resizeObserver) resizeObserver.observe(root);
    }

    const nodes = new Set([...expands, ...parallax, ...stacks.flatMap((stack) => stack.cards)]);
    if ('IntersectionObserver' in window) {
      motionObserver = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) active.add(entry.target);
          else active.delete(entry.target);
        }
        schedule();
      }, { rootMargin: '35% 0px 35% 0px', threshold: 0 });
      for (const node of nodes) motionObserver.observe(node);

      if (decorativeAllowed() || galleryReveals.length) {
        revealObserver = new IntersectionObserver((entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            if (entry.target.hasAttribute('data-ba-gallery-reveal')) revealGallery(entry.target);
            else reveal(entry.target);
            revealObserver.unobserve(entry.target);
          }
        }, { rootMargin: '0px 0px -10% 0px', threshold: 0.15 });
        for (const heading of [...(decorativeAllowed() ? headings : []), ...galleryReveals]) {
          if (!revealed.has(heading)) revealObserver.observe(heading);
        }
      }
    } else {
      // Older browsers keep the visible default for reveal effects.
      for (const node of nodes) active.add(node);
    }
    if (galleries.size) update();
    else schedule();
    return { stacks: stacks.length, expands: expands.length, parallax: parallax.length };
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    resetButtons();
    cancelMenu();
    window.cancelAnimationFrame(frame);
    window.cancelAnimationFrame(refreshFrame);
    if (motionObserver) motionObserver.disconnect();
    if (revealObserver) revealObserver.disconnect();
    if (resizeObserver) resizeObserver.disconnect();
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', scheduleRefresh);
    window.removeEventListener('load', scheduleRefresh);
    document.removeEventListener('DOMContentLoaded', scheduleRefresh);
    document.removeEventListener('visibilitychange', onVisibility);
    document.removeEventListener('toggle', openDetail, true);
    document.removeEventListener('pointerdown', press);
    window.removeEventListener('pointerup', release);
    window.removeEventListener('pointercancel', release);
    document.removeEventListener('keydown', press);
    document.removeEventListener('keyup', release);
    window.removeEventListener('blur', release);
    if (indicatorControl) indicatorControl.cancel();
    if (indicatorNode) indicatorNode.style.removeProperty('transform');
    document.documentElement.removeAttribute('data-ba-light');
    for (const preference of preferences) {
      if (preference.removeEventListener) preference.removeEventListener('change', refresh);
      else if (preference.removeListener) preference.removeListener(refresh);
    }
    clearMotion(true);
    active.clear();
    stacks = [];
    expands = [];
    parallax = [];
  }

  if ('ResizeObserver' in window) {
    resizeObserver = new ResizeObserver((entries) => {
      let changed = false;
      for (const entry of entries) {
        const next = [entry.contentRect.width, entry.contentRect.height];
        const previous = sizes.get(entry.target);
        sizes.set(entry.target, next);
        if (previous && (previous[0] !== next[0] || previous[1] !== next[1])) changed = true;
      }
      if (changed) scheduleRefresh();
    });
  }

  window.BrenMotion = Object.freeze({ refresh, destroy, enterPage, exitPage, resumePage, cancelPage, moveIndicator, showContent, menu, cancelMenu });
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', scheduleRefresh, { passive: true });
  window.addEventListener('load', scheduleRefresh, { once: true });
  document.addEventListener('visibilitychange', onVisibility);
  document.addEventListener('toggle', openDetail, true);
  document.addEventListener('pointerdown', press);
  window.addEventListener('pointerup', release);
  window.addEventListener('pointercancel', release);
  document.addEventListener('keydown', press);
  document.addEventListener('keyup', release);
  window.addEventListener('blur', release);
  for (const preference of preferences) {
    if (preference.addEventListener) preference.addEventListener('change', refresh);
    else if (preference.addListener) preference.addListener(refresh);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleRefresh, { once: true });
  } else refresh();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(scheduleRefresh);
})();
