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
  const preferences = [reduced, coarse, compact];
  const properties = ['--stack-scale', '--stack-shift', '--expand', '--parallax'];
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
  const buttonSelector = '.rd-button, .rd-menu-toggle, .ba-round-link';

  // Route exits retain their last frame until the next page has been mounted.
  // Other effects release their styles so hover/focus CSS can take over.
  function animateNode(node, keyframes, transition, { route = false, hold = false } = {}) {
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
    pressed.clear();
  }

  function enterPage(root, { navigation = false } = {}) {
    if (!root || !canAnimate()) return;
    if (navigation) {
      animateNode(root, { opacity: [0, 1] }, {
        duration: lowEnd ? tokens.duration.fast : tokens.duration.normal,
        ease: tokens.easing.smooth,
      }, { route: true });
      return;
    }
    if (!decorativeAllowed()) {
      animateNode(root, { opacity: [0.7, 1] }, { duration: tokens.duration.fast, ease: tokens.easing.smooth });
      return;
    }
    const copy = root.querySelector('.bh-hero-copy');
    if (copy && copy.getBoundingClientRect().bottom > 0) {
      animateNode(copy, { opacity: [0.4, 1], transform: ['translateY(' + tokens.distance.md + 'px)', 'none'] },
        { duration: tokens.duration.slow, ease: tokens.easing.smooth });
      const pieces = root.querySelectorAll('.bh-hero-piece');
      pieces.forEach((piece, index) => {
        const rotation = index === 0 ? 3 : -5;
        animateNode(piece, { transform: [
          'translateY(' + tokens.distance.lg + 'px) rotate(' + (rotation * 2) + 'deg)',
          'translateY(0px) rotate(' + rotation + 'deg)',
        ] }, { ...springs.gentle, delay: tokens.duration.instant * (index + 1) });
      });
      const foot = root.querySelector('.bh-hero-foot');
      if (foot) animateNode(foot, { opacity: [0.5, 1] }, { duration: tokens.duration.normal, delay: tokens.duration.fast });
    } else {
      animateNode(root, { opacity: [0.6, 1] }, { duration: tokens.duration.normal, ease: tokens.easing.smooth });
    }
  }

  function exitPage(root) {
    const opacity = root ? parseFloat(window.getComputedStyle(root).opacity) : 1;
    cancelPage();
    if (!root || !canAnimate()) return Promise.resolve(true);
    const job = animateNode(root, { opacity: [Number.isFinite(opacity) ? opacity : 1, 0] }, {
      duration: lowEnd ? tokens.duration.fast : tokens.duration.normal,
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

  function press(event) {
    if (!canAnimate() || lowEnd || (event.type === 'pointerdown' && event.button !== 0)) return;
    if (event.type === 'keydown' && (event.repeat || !['Enter', ' '].includes(event.key))) return;
    const node = event.target.closest && event.target.closest(buttonSelector);
    if (!node || node.disabled || node.getAttribute('aria-disabled') === 'true') return;
    const original = window.getComputedStyle(node).transform;
    pressed.add(node);
    animateNode(node, { transform: [original === 'none' ? 'scale(1)' : original, 'scale(' + tokens.scale.subtle + ')'] }, springs.instant);
  }

  function release(event) {
    if (event.type === 'keyup' && !['Enter', ' '].includes(event.key)) return;
    for (const node of pressed) {
      const job = animations.get(node);
      if (job) job.cancel();
      if (canAnimate()) animateNode(node, { transform: ['scale(' + tokens.scale.subtle + ')', 'scale(1)'] }, springs.release);
    }
    pressed.clear();
  }

  function onVisibility() {
    if (document.hidden) {
      window.cancelAnimationFrame(frame);
      frame = 0;
      cancelPage();
    } else refresh();
  }

  function clearMotion(includeRoutes = false) {
    for (const animation of Array.from(animations.values())) {
      if (includeRoutes || !animation.route) animation.cancel();
    }
    for (const node of touched) {
      for (const property of properties) node.style.removeProperty(property);
    }
    touched.clear();
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
      if (!stack.cards.some((card) => active.has(card))) continue;
      for (let index = 0; index < stack.cards.length - 1; index += 1) {
        const card = stack.cards[index];
        const next = stack.cards[index + 1];
        const nextRect = rect(next);
        // The CSS transform origin is top center. Remove our prior translation
        // from the measured position so neighbouring cards do not feed back.
        const nextValues = values.get(next);
        const shift = nextValues ? parseFloat(nextValues['--stack-shift']) || 0 : 0;
        const distance = Math.max(1, Math.min(height * 0.8, stack.heights[index]));
        const progress = clamp(1 - (nextRect.top - shift - stack.tops[index]) / distance);
        writes.push([card, '--stack-scale', (1 - progress * 0.06).toFixed(4)]);
        writes.push([card, '--stack-shift', (-progress * 20).toFixed(2) + 'px']);
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
      writes.push([node, '--parallax', (progress * 20).toFixed(2) + 'px']);
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
    for (const root of roots) {
      headings.push(...root.querySelectorAll('[data-ba-reveal]'));
      if (distortionsAllowed()) {
        for (const container of root.querySelectorAll('[data-ba-stack]')) {
          const cards = Array.from(container.querySelectorAll('[data-ba-project]'))
            .filter((card) => card.closest('[data-ba-stack]') === container);
          if (cards.length > 1) stacks.push({
            cards,
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

      if (decorativeAllowed()) {
        revealObserver = new IntersectionObserver((entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            reveal(entry.target);
            revealObserver.unobserve(entry.target);
          }
        }, { rootMargin: '0px 0px -10% 0px', threshold: 0.15 });
        for (const heading of headings) {
          if (!revealed.has(heading)) revealObserver.observe(heading);
        }
      }
    } else {
      // Older browsers keep the visible default for reveal effects.
      for (const node of nodes) active.add(node);
    }
    schedule();
    return { stacks: stacks.length, expands: expands.length, parallax: parallax.length };
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
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

  window.BrenMotion = Object.freeze({ refresh, destroy, enterPage, exitPage, resumePage, cancelPage, moveIndicator, showContent });
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
