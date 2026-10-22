// Read-only smoke checks against current production source, without a browser.
// Motion's cancellation promise stays pending; the DOM double reproduces that
// boundary so the site's wrapper must resolve its own navigation promise.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spring } from 'motion';

const base = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const motionSource = fs.readFileSync(path.join(base, 'assets/motion.js'), 'utf8');
const librarySource = fs.readFileSync(path.join(base, 'assets/motion-library.js'), 'utf8')
  .replace(/^import .*;\n/gm, '').replace(/^export /gm, '');
const componentSource = fs.readFileSync(path.join(base, 'index.html'), 'utf8')
  .match(/<script[^>]*data-dc-script[^>]*>([\s\S]*?)<\/script>/)[1];
const microtasks = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };

function events(object = {}) {
  const listeners = new Map();
  return Object.assign(object, {
    addEventListener(type, fn) { if (!listeners.has(type)) listeners.set(type, new Set()); listeners.get(type).add(fn); },
    removeEventListener(type, fn) { listeners.get(type)?.delete(fn); },
    emit(type, event = {}) { for (const fn of [...(listeners.get(type) || [])]) fn({ type, ...event }); },
    listenerCount(type) { return listeners.get(type)?.size || 0; },
  });
}

class NodeDouble {
  constructor(tag = 'DIV', attributes = {}) {
    this.tagName = tag; this.attributes = attributes; this.children = []; this.selectors = new Map();
    this.open = false; this.focusCount = 0; this.scrollCount = 0; this.offsetHeight = 500;
    events(this);
    const values = new Map();
    this.style = new Proxy({
      getPropertyValue: key => values.get(key) || '',
      setProperty: (key, value) => values.set(key, String(value)),
      removeProperty: key => values.delete(key),
    }, {
      get: (target, key) => key in target ? target[key] : values.get(key) || '',
      set: (_target, key, value) => { values.set(key, String(value)); return true; },
    });
  }
  getAttribute(key) { return this.attributes[key] ?? null; }
  hasAttribute(key) { return key in this.attributes; }
  setAttribute(key, value) { this.attributes[key] = value; }
  removeAttribute(key) { delete this.attributes[key]; }
  toggleAttribute(key, enabled) { enabled ? this.setAttribute(key, '') : this.removeAttribute(key); }
  matches() { return this.hasAttribute('tabindex') || ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'SUMMARY'].includes(this.tagName); }
  append(child) { child.parent = this; this.children.push(child); return child; }
  contains(node) { return node === this || this.children.some(child => child.contains(node)); }
  querySelectorAll(selector) { return this.selectors.get(selector) || []; }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  closest(selector) {
    if (selector === 'a' && this.tagName === 'A') return this;
    if (selector === '[data-ba-stack]' && this.hasAttribute('data-ba-stack')) return this;
    if (selector === '[data-ba-gallery]' && this.hasAttribute('data-ba-gallery')) return this;
    if (selector.split(',').some(part => part.trim().startsWith('.') && (this.attributes.class || '').split(' ').includes(part.trim().slice(1)))) return this;
    return this.parent?.closest(selector) || null;
  }
  getClientRects() { return this.style.display === 'none' ? [] : [{}]; }
  getBoundingClientRect() { return this.rect ? this.rect() : { top: 100, bottom: 600, height: 500, width: 500, left: 0 }; }
  focus(options) { this.focusCount++; this.focusOptions = options; }
  scrollIntoView() { this.scrollCount++; }
  animate() {} // Feature detection; the library double owns actual controls.
}

function environment({ reduced = false, lowEnd = false, hidden = false, hero = false, compact = false, coarse = false, fine = !coarse, gallery = false, noLibrary = false } = {}) {
  const jobs = [], observers = [], frames = new Map(); let nextFrame = 1, now = 0;
  const roots = ['accueil', 'services', 'contact'].map(page => new NodeDouble('SECTION', { 'data-page': page }));
  roots.forEach((root, index) => root.style.display = index ? 'none' : 'block');
  const main = new NodeDouble('MAIN'), html = new NodeDouble('HTML'); html.clientHeight = 800;
  const ids = new Map([['bs-main', main]]);
  const stack = roots[0].append(new NodeDouble('DIV', { 'data-ba-stack': '', ...(gallery ? { 'data-ba-gallery': '' } : {}) }));
  const cards = Array.from({ length: gallery ? 5 : 2 }, () => stack.append(new NodeDouble(gallery ? 'A' : 'DIV')));
  stack.selectors.set('[data-ba-project]', cards);
  roots[0].selectors.set('[data-ba-stack]', [stack]);
  let galleryNodes;
  if (gallery) {
    const visuals = cards.map(card => card.append(new NodeDouble('DIV', { 'data-ba-gallery-reveal': '' })));
    const media = [0, 3].map((index, position) => visuals[index].append(new NodeDouble('DIV', { 'data-ba-parallax': position ? '10' : '8' })));
    roots[0].selectors.set('[data-ba-gallery-reveal]', visuals);
    roots[0].selectors.set('[data-ba-parallax]', media);
    galleryNodes = { stack, cards, visuals, media };
  }
  const heading = roots[0].append(new NodeDouble('H2'));
  roots[0].selectors.set('[data-ba-reveal]', [heading]);
  let heroNodes;
  if (hero) {
    const copy = roots[0].append(new NodeDouble());
    const lines = Array.from({ length: 3 }, () => copy.append(new NodeDouble('SPAN')));
    const description = copy.append(new NodeDouble('P'));
    const actions = Array.from({ length: 2 }, () => copy.append(new NodeDouble('A')));
    const art = roots[0].append(new NodeDouble());
    const stage = art.append(new NodeDouble());
    const planes = Array.from({ length: 2 }, () => stage.append(new NodeDouble()));
    const pieces = planes.map(plane => plane.append(new NodeDouble('A')));
    const foot = roots[0].append(new NodeDouble());
    copy.selectors.set('h1>span', lines);
    copy.selectors.set('.bh-hero-description', [description]);
    copy.selectors.set('.bh-hero-actions>a', actions);
    art.selectors.set('.bh-hero-stage', [stage]);
    roots[0].selectors.set('.bh-hero-copy', [copy]);
    roots[0].selectors.set('.bh-hero-art', [art]);
    roots[0].selectors.set('.bh-hero-plane', planes);
    roots[0].selectors.set('.bh-hero-piece', pieces);
    roots[0].selectors.set('.bh-hero-foot', [foot]);
    heroNodes = { copy, lines, description, actions, art, stage, planes, pieces, foot };
  }
  for (const id of ['web', 'identite']) {
    const detail = roots[1].append(new NodeDouble('DETAILS', { id }));
    const summary = detail.append(new NodeDouble('SUMMARY'));
    detail.selectors.set('summary', [summary]); ids.set(id, detail);
  }
  const document = events({
    documentElement: html, body: main, hidden, readyState: 'complete',
    querySelectorAll: selector => selector === '[data-page]' ? roots : [],
    querySelector(selector) {
      const page = selector.match(/^section\[data-page="([^"]+)"\]$/)?.[1];
      return page ? roots.find(root => root.attributes['data-page'] === page) : selector === 'main' ? main : null;
    },
    getElementById: id => ids.get(id) || null,
  });
  const media = new Map();
  const matchMedia = query => {
    const matches = query.includes('reduced-motion') ? reduced
      : query.includes('max-width') ? compact
      : query.includes('pointer: coarse') ? coarse
      : query.includes('pointer: fine') ? fine : false;
    if (!media.has(query)) media.set(query, events({ matches }));
    return media.get(query);
  };
  const raf = fn => { const id = nextFrame++; frames.set(id, fn); return id; };
  const cancelRaf = id => frames.delete(id);
  class Observer {
    constructor(callback) { this.callback = callback; this.nodes = new Set(); observers.push(this); }
    observe(node) { this.nodes.add(node); }
    unobserve(node) { this.nodes.delete(node); }
    disconnect() { this.nodes.clear(); }
  }
  const animate = (node, keyframes, transition) => {
    let resolve;
    const control = {
      node, keyframes, transition, state: 'running', finished: new Promise(done => resolve = done),
      cancel() { this.state = 'cancelled'; },
      stop() { this.state = 'stopped'; },
      complete() {
        if (this.state !== 'running') return;
        for (const [property, value] of Object.entries(keyframes)) node.style.setProperty(property, Array.isArray(value) ? value.at(-1) : value);
        this.state = 'finished'; resolve();
      },
    };
    jobs.push(control); return control;
  };
  const location = { origin: 'https://example.test', pathname: '/', hash: '' };
  const window = events({
    document, location, innerHeight: 800, scrollY: 0, matchMedia,
    requestAnimationFrame: raf, cancelAnimationFrame: cancelRaf,
    getComputedStyle: node => ({ display: node.style.display || 'block', top: node.computedTop || '100px', transform: node.style.transform || 'none', scale: node.style.scale || 'none', opacity: node.style.opacity || '1' }),
    scrollTo() {}, IntersectionObserver: Observer,
    history: { pushState(_state, _title, target) { const url = new URL(target, location.origin); location.pathname = url.pathname; location.hash = url.hash; } },
  });
  class DCLogic {
    setState(update, callback) {
      this.state = { ...this.state, ...(typeof update === 'function' ? update(this.state) : update) };
      roots.forEach(root => root.style.display = root.attributes['data-page'] === this.state.page ? 'block' : 'none');
      callback?.();
    }
  }
  const context = vm.createContext({
    window, document, navigator: { hardwareConcurrency: lowEnd ? 2 : 8, deviceMemory: lowEnd ? 2 : 8 },
    requestAnimationFrame: raf, cancelAnimationFrame: cancelRaf, IntersectionObserver: Observer,
    animate, spring, DCLogic, React: {}, URL, setTimeout, clearTimeout, performance: { now: () => now }, console,
  });
  if (galleryNodes) {
    const rectangle = (top, height = 500) => ({ top, bottom: top + height, height, width: 750, left: 0 });
    stack.rect = () => rectangle(360 - window.scrollY, 2884);
    cards.forEach((card, index) => {
      card.computedTop = (106 + index * 8) + 'px';
      card.rect = () => {
        const flowTop = 360 + index * 596 - window.scrollY;
        const top = stack.hasAttribute('data-ba-gallery-motion') ? Math.max(106 + index * 8, flowTop) : flowTop;
        return rectangle(top + (parseFloat(card.style.getPropertyValue('--stack-shift')) || 0));
      };
    });
    galleryNodes.media.forEach((node, index) => node.rect = () => rectangle(cards[index ? 3 : 0].getBoundingClientRect().top, 430));
  }
  if (!noLibrary) vm.runInContext(librarySource, context);
  vm.runInContext(motionSource, context);
  const motion = window.BrenMotion;
  const flushFrames = (elapsed = 1000 / 60) => { now += elapsed; const pending = [...frames.values()]; frames.clear(); pending.forEach(fn => fn(now)); };
  const advance = (elapsed = 1000) => { for (let time = 0; time < elapsed; time += 1000 / 60) flushFrames(); };
  const makeComponent = () => {
    vm.runInContext(componentSource + '\nglobalThis.TestComponent = Component;', context);
    const app = new context.TestComponent(); app._initNavPill = () => {}; app.componentDidMount();
    return app;
  };
  const click = (app, href) => {
    const anchor = new NodeDouble('A', { href }); anchor.href = new URL(href, location.origin).href;
    app._onNavClick({ button: 0, target: anchor, preventDefault() {} });
  };
  const scroll = y => { window.scrollY = y; window.emit('scroll'); flushFrames(); };
  const intersect = (node, isIntersecting = true) => {
    for (const observer of observers) {
      if (observer.nodes.has(node)) observer.callback([{ target: node, isIntersecting }]);
    }
    flushFrames();
  };
  return { motion, jobs, observers, roots, ids, html, document, window, media, heroNodes, galleryNodes, flushFrames, advance, makeComponent, click, scroll, intersect };
}

{
  const e = environment({ reduced: true });
  e.motion.enterPage(e.roots[0]); assert.equal(await e.motion.exitPage(e.roots[0]), true);
  assert.equal(e.jobs.length, 0, 'reduced motion must create no animation');
  assert.equal(e.motion.refresh().stacks, 0); e.motion.destroy();
}
{
  const e = environment({ lowEnd: true });
  assert(e.html.hasAttribute('data-ba-light')); assert.equal(e.motion.refresh().stacks, 0);
  e.motion.enterPage(e.roots[0]); assert.equal(e.jobs.length, 1);
  assert.deepEqual(Object.keys(e.jobs[0].keyframes), ['opacity'], 'low-end entrance must avoid transforms');
  e.motion.destroy();
}
{
  const e = environment(); e.roots[0].style.opacity = '0.9';
  const natural = e.motion.exitPage(e.roots[0]); e.jobs.at(-1).complete();
  assert.equal(e.jobs.at(-1).transition.duration, 0.12, 'route exits must not hold navigation behind a long departure');
  assert.equal(await natural, true); assert.equal(e.roots[0].style.opacity, '0', 'finished exit must hold its last frame until commit');
  const exitControl = e.jobs.at(-1);
  e.motion.refresh();
  assert.equal(exitControl.state, 'finished'); assert.equal(e.roots[0].style.opacity, '0', 'refresh must preserve a completed held route exit');
  e.motion.cancelPage(); assert.equal(e.roots[0].style.opacity, '0.9', 'completed held exit must still restore on cancellation');
  const interrupted = e.motion.exitPage(e.roots[0]); e.motion.cancelPage();
  assert.equal(await interrupted, false, 'cancel must settle the public promise despite pending native promise');
  assert.equal(e.roots[0].style.opacity, '0.9'); e.motion.destroy();
}
{
  const e = environment(); e.roots[0].style.opacity = '0.9';
  const exit = e.motion.exitPage(e.roots[0]), control = e.jobs.at(-1);
  e.motion.refresh(); assert.equal(control.state, 'running', 'resize refresh must not shorten an exit');
  control.complete(); assert.equal(await exit, true);
  e.motion.destroy(); assert.equal(e.roots[0].style.opacity, '0.9', 'destroy must clean a held exit that already settled');
}
{
  const e = environment(); e.motion.enterPage(e.roots[0], { navigation: true });
  const entry = e.jobs.at(-1);
  assert.equal(entry.keyframes.opacity[0], 0, 'new route must enter from hidden instead of appearing at partial brightness');
  e.motion.refresh(); assert.equal(entry.state, 'running', 'resize refresh must preserve a route entrance');
  entry.complete(); await microtasks(); assert.equal(e.roots[0].style.opacity, '');
  e.motion.destroy();
}
{
  const e = environment(); e.roots[0].style.opacity = '0.9';
  const first = e.motion.exitPage(e.roots[0]);
  e.roots[0].style.opacity = '0.42'; // Simulate the computed intermediate frame.
  const second = e.motion.exitPage(e.roots[0]);
  assert.equal(await first, false); assert.equal(e.jobs.at(-1).keyframes.opacity[0], 0.42, 'retargeting must start from the visible frame, before restoring original styles');
  e.motion.cancelPage(); assert.equal(await second, false); assert.equal(e.roots[0].style.opacity, '0.9');
  e.motion.destroy();
}
{
  const e = environment(); e.roots[0].style.opacity = '0.9';
  const exit = e.motion.exitPage(e.roots[0]); e.jobs.at(-1).complete(); assert.equal(await exit, true);
  const mql = e.media.get('(prefers-reduced-motion: reduce)'); mql.matches = true; mql.emit('change');
  assert.equal(e.roots[0].style.opacity, '0.9', 'enabling reduced motion must release a held exit');
  e.motion.destroy();
}
{
  const e = environment({ hidden: true }); assert.equal(e.motion.refresh().stacks, 0);
  e.document.hidden = false; e.document.emit('visibilitychange');
  assert(e.observers.some(observer => observer.nodes.size >= 2), 'foreground return must reattach scroll targets');
  const pill = new NodeDouble(); e.motion.moveIndicator(pill, 'translateX(42px)', false);
  const control = e.jobs.at(-1), mql = e.media.get('(prefers-reduced-motion: reduce)');
  mql.matches = true; mql.emit('change');
  assert.equal(control.state, 'cancelled'); assert.equal(pill.style.transform, 'translateX(42px)');
  e.motion.destroy();
}
{
  const e = environment(), app = e.makeComponent(); e.motion.cancelPage();
  e.click(app, '/services#web'); e.click(app, '/contact');
  e.jobs.at(-1).complete(); await microtasks();
  assert.equal(app.state.page, 'contact', 'latest route must win after an interrupted exit');
  assert.equal(e.window.location.pathname, '/contact'); assert.equal(e.window.location.hash, '');
  e.click(app, '/services#web'); e.jobs.at(-1).complete(); await microtasks();
  e.click(app, '/services#identite'); e.flushFrames(); await microtasks();
  assert.equal(app.state.page, 'services'); assert.equal(e.window.location.hash, '#identite');
  assert.equal(e.ids.get('web').open, false, 'cancelled anchor must not open');
  assert.equal(e.ids.get('identite').open, true); assert.equal(e.ids.get('identite').scrollCount, 1);
  assert.equal(e.ids.get('identite').querySelector('summary').focusCount, 1, 'destination summary must receive focus');
  assert.equal(e.ids.get('identite').querySelector('summary').focusOptions.preventScroll, true, 'focus must not undo the explicit anchor scroll');
  e.click(app, '/'); e.jobs.at(-1).complete(); await microtasks();
  assert.equal(app.state.page, 'accueil'); assert.equal(e.window.location.hash, '');
  app.componentWillUnmount();
}
{
  const e = environment({ hero: true }), app = e.makeComponent();
  assert(e.heroNodes.lines.every(line => e.jobs.some(job => job.node === line)), 'fixture must exercise the per-line hero choreography');
  for (const job of e.jobs) job.complete(); await microtasks();
  const before = e.jobs.length;
  e.click(app, '/'); await microtasks();
  assert.equal(e.jobs.length, before, 'clicking the active page must not replay the hero or create a new entrance');
  assert.equal(e.heroNodes.art.listenerCount('pointermove'), 0, 'the hero has a stable composition without decorative pointer tracking');
  app.componentWillUnmount();
}
{
  const e = environment({ hero: true });
  const { lines, actions, planes } = e.heroNodes;
  const tokens = e.window.BrenMotionLib.motionTokens;
  e.motion.enterPage(e.roots[0]);
  const entrance = e.jobs.filter(job => lines.includes(job.node) || actions.includes(job.node) || planes.includes(job.node));
  const lineJobs = lines.map(line => entrance.find(job => job.node === line));
  assert.deepEqual(lineJobs.map(job => job.transition.delay), [0, tokens.hero.stagger, tokens.hero.stagger * 2], 'title lines must land in reading order');
  assert(tokens.hero.stagger > 0 && tokens.hero.stagger <= 0.05, 'the title stagger must remain precise and brief');
  assert(lineJobs.every(job => job.transition.type && job.keyframes.opacity[0] >= 0.65), 'title remains readable throughout its spring entrance');
  const planeJobs = planes.map(plane => entrance.find(job => job.node === plane));
  const actionJobs = actions.map(action => entrance.find(job => job.node === action));
  assert.deepEqual(planeJobs.map(job => job.transition.delay), [tokens.hero.stagger, tokens.hero.stagger * 2]);
  assert.equal(actionJobs[0].transition.delay, planeJobs[1].transition.delay, 'primary action and second board must arrive together');
  assert(actionJobs.every(job => job.transition.stiffness === 400 && job.transition.damping === 40), 'actions use the shared critically damped spring');
  assert(entrance.every(job => job.transition.type && !String(job.keyframes.transform).match(/scale\(|rotate|translate3d/)), 'hero entrance must use flat translation and opacity only');
  for (const job of entrance) {
    const generator = spring({ ...job.transition, keyframes: [0, 100] });
    assert(generator.next((0.8 - job.transition.delay) * 1000).done, 'the complete desktop entrance settles in under 800ms');
  }
  e.motion.refresh();
  assert(entrance.every(job => job.state === 'running'), 'geometry refresh must not cut off the coordinated entrance');
  const revealNodes = entrance.map(job => job.node);
  for (const job of entrance) {
    if ('opacity' in job.keyframes) job.node.style.opacity = '0.72';
    if ('transform' in job.keyframes) job.node.style.transform = 'translateY(5px)';
  }
  const preference = e.media.get('(prefers-reduced-motion: reduce)'); preference.matches = true; preference.emit('change');
  assert(entrance.every(job => job.state === 'cancelled'), 'reduced-motion change must cancel every entrance immediately');
  assert(revealNodes.every(node => node.style.opacity === '' && node.style.transform === ''), 'cancellation must restore the visible CSS fallback');
  assert.equal(e.heroNodes.art.listenerCount('pointermove'), 0, 'reduced motion removes hero pointer interaction');
  e.motion.destroy();
}
{
  const e = environment({ hero: true, compact: true, coarse: true });
  e.motion.enterPage(e.roots[0]);
  const { planes, art } = e.heroNodes;
  const tokens = e.window.BrenMotionLib.motionTokens;
  const boardJobs = planes.map(plane => e.jobs.find(job => job.node === plane));
  assert(boardJobs.every(job => job.transition.type && !String(job.keyframes.transform).includes('rotate')), 'touch entrance stays flat and critically damped');
  assert(Math.max(...e.jobs.map(job => job.transition.delay || 0)) <= tokens.hero.compactStagger * 3, 'mobile entrance adds no long stagger');
  assert.equal(art.listenerCount('pointermove'), 0, 'touch must not install pointer tracking');
  const before = e.jobs.length;
  art.emit('pointermove', { pointerType: 'touch', clientX: 200, clientY: 250 }); e.flushFrames();
  assert.equal(e.jobs.length, before, 'touch input must preserve native scrolling without interaction jobs');
  e.motion.destroy();
}
{
  const e = environment({ hero: true });
  const { art, stage } = e.heroNodes;
  assert.equal(art.listenerCount('pointermove'), 0);
  e.motion.refresh(); e.motion.enterPage(e.roots[0]);
  assert.equal(art.listenerCount('pointermove'), 0, 'refresh and entrance never install decorative hero tracking');
  const before = e.jobs.length;
  art.emit('pointermove', { pointerType: 'touch', clientX: 400, clientY: 450 }); e.flushFrames();
  art.emit('pointermove', { pointerType: 'mouse', clientX: 500, clientY: 100 }); e.flushFrames();
  assert.equal(e.jobs.length, before, 'pointer movement cannot restart a hero entrance');
  assert.equal(stage.style.transform, '', 'the art stage remains at its layout position');
  e.motion.destroy(); e.flushFrames();
  for (const name of ['pointermove', 'pointerleave', 'pointercancel', 'focusin']) assert.equal(art.listenerCount(name), 0, 'destroy removes ' + name);
  for (const name of ['scroll', 'blur']) assert.equal(e.window.listenerCount(name), 0, 'destroy removes window ' + name);
  art.emit('pointermove', { pointerType: 'mouse', clientX: 200, clientY: 200 }); e.window.emit('scroll'); e.flushFrames();
  assert.equal(e.jobs.length, before, 'destroy prevents late animation jobs');
}
{
  const e = environment({ hero: true }), app = e.makeComponent(); e.motion.cancelPage();
  e.click(app, '/services'); const obsolete = e.jobs.at(-1);
  e.roots[0].style.opacity = '0.36'; // Current frame of the pending departure.
  const before = e.jobs.length;
  e.click(app, '/'); obsolete.complete(); await microtasks();
  assert.equal(obsolete.state, 'cancelled'); assert.equal(app.state.page, 'accueil', 'clicking the current page must supersede the pending destination');
  assert.equal(e.jobs.length, before + 1, 'returning to active page must resume only its opacity, without hero choreography');
  const resume = e.jobs.at(-1);
  assert.equal(resume.node, e.roots[0]); assert.equal(resume.keyframes.opacity[0], 0.36);
  assert.equal(e.heroNodes.art.listenerCount('pointermove'), 0, 'resuming a departure does not install decorative pointer tracking');
  resume.complete(); await microtasks(); assert.equal(e.roots[0].style.opacity, '');
  app.componentWillUnmount();
}
{
  const e = environment();
  const { createSpringValue, springs } = e.window.BrenMotionLib;
  for (const transition of Object.values(springs)) {
    assert.equal(transition.damping, 2 * Math.sqrt(transition.stiffness), 'resting interface springs must be critically damped');
  }
  const samples = [], value = createSpringValue(1, next => samples.push(next));
  value.set(0.97, springs.instant); e.flushFrames(32);
  const position = value.value, velocity = value.velocity;
  assert(position < 1 && position > 0.97 && velocity < 0, 'fixture must interrupt an actively compressing button');
  value.set(1, springs.release);
  assert.equal(value.value, position, 'a reversal must start at the presentation value');
  assert(Math.abs(value.velocity - velocity) < 1e-12, 'a reversal must inherit the exact current velocity');
  e.flushFrames(16);
  const retapPosition = value.value, retapVelocity = value.velocity;
  value.set(0.97, springs.instant);
  assert.equal(value.value, retapPosition, 'a rapid retap must not jump back to either endpoint');
  assert(Math.abs(value.velocity - retapVelocity) < 1e-12, 'a rapid retap must preserve velocity');
  e.advance();
  assert.equal(value.value, 0.97); assert.equal(value.velocity, 0);
  value.stop(); const count = samples.length; e.advance(); assert.equal(samples.length, count, 'stopped springs leave no animation loop');
  e.motion.destroy();
}
{
  const e = environment();
  const button = new NodeDouble('A', { class: 'rd-button' });
  button.style.transform = 'translateY(5px)';
  e.document.emit('pointerdown', { target: button, button: 0 }); e.flushFrames(32);
  const compressed = Number(button.style.scale);
  assert(compressed < 1 && compressed > 0.97, 'pointer-down begins immediate spring feedback');
  assert.equal(button.style.transform, 'translateY(5px)', 'press scale must compose with an existing entrance transform');
  e.window.emit('pointerup'); assert.equal(Number(button.style.scale), compressed, 'release starts from the current compressed frame');
  e.flushFrames(16); const returning = Number(button.style.scale);
  e.document.emit('pointerdown', { target: button, button: 0 });
  assert.equal(Number(button.style.scale), returning, 'a retap cannot jump to the fixed pressed state');
  e.window.emit('pointercancel'); e.advance();
  assert.equal(button.style.scale, '', 'finished release must restore the button CSS scale');
  e.document.emit('keydown', { target: button, key: 'Enter' }); e.flushFrames(32);
  assert(Number(button.style.scale) < 1, 'keyboard activation receives the same press response');
  const preference = e.media.get('(prefers-reduced-motion: reduce)'); preference.matches = true; preference.emit('change');
  assert.equal(button.style.scale, '', 'changing reduced motion immediately removes a running press');
  e.motion.destroy(); e.advance(); assert.equal(button.style.scale, '');
}
{
  const e = environment(), panel = new NodeDouble(), scrim = new NodeDouble();
  const opened = e.motion.menu(true, panel, scrim);
  assert.equal(panel.style.opacity, '0', 'a mounted menu starts at its source before the first paint');
  e.flushFrames(80);
  const progress = Number(panel.style.opacity);
  assert(progress > 0 && progress < 1); assert.equal(Number(scrim.style.opacity), progress, 'scrim follows the same physical progress');
  const closed = e.motion.menu(false, panel, scrim);
  assert.equal(await opened, false, 'superseded menu entrance must settle as cancelled');
  assert.equal(Number(panel.style.opacity), progress, 'closing mid-entry must keep the presentation frame');
  e.flushFrames(16); const reversed = Number(panel.style.opacity);
  const reopened = e.motion.menu(true, panel, scrim);
  assert.equal(await closed, false, 'a re-open must cancel the obsolete close');
  assert.equal(Number(panel.style.opacity), reversed, 're-opening mid-exit must not jump');
  e.advance(); assert.equal(await reopened, true);
  assert.equal(panel.style.transform, ''); assert.equal(panel.style.opacity, ''); assert.equal(scrim.style.opacity, '', 'an open resting menu releases inline styles');
  const finalClose = e.motion.menu(false, panel, scrim); e.advance(); assert.equal(await finalClose, true);
  assert.equal(panel.style.opacity, '0'); assert.equal(panel.style.transform, 'translateY(-8.000px) scale(0.98000)', 'exit returns to the same anchored origin');
  const pending = e.motion.menu(true, panel, scrim); e.flushFrames(32); e.motion.cancelMenu(panel);
  assert.equal(await pending, false); assert.equal(panel.style.transform, ''); assert.equal(scrim.style.opacity, '');
  const instant = e.motion.menu(false, panel, scrim, { immediate: true }); assert.equal(await instant, true); assert.equal(panel.style.opacity, '0');
  e.motion.destroy(); e.advance(); assert.equal(panel.style.opacity, '', 'destroy restores a held closed menu');
}
{
  const e = environment(), panel = new NodeDouble(), scrim = new NodeDouble();
  const entry = e.motion.menu(true, panel, scrim); e.flushFrames(80);
  const preference = e.media.get('(prefers-reduced-motion: reduce)'); preference.matches = true; preference.emit('change');
  assert.equal(await entry, true, 'enabling reduced motion finishes the requested menu state directly');
  assert.equal(panel.style.transform, ''); assert.equal(scrim.style.opacity, '');
  assert.equal(await e.motion.menu(false, panel, scrim), true); assert.equal(panel.style.opacity, '0', 'reduced motion closes a menu without an animated transform');
  e.motion.destroy();
}
{
  const e = environment(), app = e.makeComponent(); e.motion.cancelPage();
  app.setState({ page: 'services' });
  e.motion.enterPage(e.roots[1], { navigation: true }); e.roots[1].style.opacity = '0.33';
  e.click(app, '/services#identite'); const resume = e.jobs.at(-1), beforeFrame = e.jobs.length;
  assert.equal(resume.keyframes.opacity[0], 0.33); assert.equal(resume.state, 'running', 'same-page anchor refresh must preserve the resuming fade');
  e.flushFrames(); await microtasks();
  assert.equal(e.ids.get('identite').open, true); assert.equal(e.ids.get('identite').scrollCount, 1);
  assert.equal(e.jobs.length, beforeFrame, 'same-page anchor must not start another route or initial entrance');
  app.componentWillUnmount();
}
{
  const e = environment(), app = e.makeComponent(); e.motion.cancelPage();
  e.click(app, '/services'); const obsolete = e.jobs.at(-1);
  app.componentWillUnmount(); obsolete.complete(); await microtasks();
  assert.equal(obsolete.state, 'cancelled'); assert.equal(app.state.page, 'accueil', 'destroy during exit must block a late commit');
  assert.equal(e.roots[0].style.opacity, '', 'destroy during exit must restore the source page');
}
{
  const e = environment(), app = e.makeComponent(); e.motion.cancelPage();
  app.setState({ page: 'services' });
  // A browser history event has already changed the URL before popstate fires.
  e.window.location.pathname = '/services'; e.window.location.hash = '#web';
  e.window.emit('popstate'); e.flushFrames(); await microtasks();
  assert.equal(app.state.page, 'services');
  assert.equal(e.ids.get('web').open, true, 'history navigation within the same page must honor its restored hash');
  assert.equal(e.ids.get('web').scrollCount, 1);
  app.componentWillUnmount();
}

{
  const e = environment({ gallery: true });
  const { stack, cards, media } = e.galleryNodes;
  const read = (node, property) => Number.parseFloat(node.style.getPropertyValue(property));
  const pose = () => cards.map(card => ['--gallery-expand', '--stack-scale', '--stack-shift', '--stack-caption'].map(property => card.style.getPropertyValue(property)));
  assert(stack.hasAttribute('data-ba-gallery-motion'), 'desktop gallery may become sticky only after the motion runtime has opted in');
  assert.equal(read(cards[0], '--gallery-expand'), 0, 'first visual starts at the compact presentation at scroll zero');
  e.scroll(254);
  assert.equal(read(cards[0], '--gallery-expand'), 1, 'first visual must reach its complete presentation when the gallery arrives below the header');
  e.scroll(127);
  assert.equal(read(cards[0], '--gallery-expand'), 0.5, 'expansion must be tied to scroll rather than elapsed time');
  e.motion.refresh();
  assert.equal(read(cards[0], '--gallery-expand'), 0.5, 'a geometry refresh at a nonzero scroll must preserve expansion progress');
  for (const node of media) e.intersect(node);
  const positions = [0, 127, 254, 500, 750, 1100, 1700, 2300];
  const forward = new Map();
  for (const y of positions) {
    e.scroll(y); forward.set(y, pose());
    for (const card of cards.slice(0, -1)) {
      const scale = read(card, '--stack-scale'), shift = read(card, '--stack-shift');
      assert(scale >= 0.955 && scale <= 1, 'recession must stay within 4.5% at every scroll position');
      assert(shift >= -16 && shift <= 0, 'recession may only recede by up to 16px');
    }
    for (const node of media) {
      const amplitude = Number(node.getAttribute('data-ba-parallax'));
      assert(Math.abs(read(node, '--parallax')) <= amplitude, 'parallax must respect the individual artwork safety budget');
    }
  }
  for (const y of [...positions].reverse()) {
    e.scroll(y);
    assert.deepEqual(pose(), forward.get(y), 'returning to scroll ' + y + ' must restore the same gallery composition');
  }
  e.scroll(1100);
  assert.equal(read(cards[0], '--stack-scale'), 0.955, 'a covered previous project must finish its measured recession');
  assert.equal(read(cards[0], '--stack-shift'), -16);
  assert.equal(read(cards[0], '--stack-caption'), 0, 'covered captions must yield to the incoming project instead of overlapping');
  assert.equal(cards.at(-1).style.getPropertyValue('--stack-scale'), '', 'last project must remain at full scale as the contact section arrives');
  e.motion.destroy();
  assert(!stack.hasAttribute('data-ba-gallery-motion'), 'destroy must return the gallery to the visible flow fallback');
  for (const node of [...cards, ...media]) for (const property of ['--gallery-expand', '--stack-scale', '--stack-shift', '--parallax', '--stack-caption']) {
    assert.equal(node.style.getPropertyValue(property), '', 'destroy must release every gallery pose property');
  }
}
{
  for (const query of ['(prefers-reduced-motion: reduce)', '(pointer: coarse)']) {
    const e = environment({ gallery: true }), { stack, cards, media } = e.galleryNodes;
    for (const node of media) e.intersect(node);
    e.scroll(1000);
    assert(cards[0].style.getPropertyValue('--stack-scale'), 'fixture must begin with live desktop motion');
    const preference = e.media.get(query); preference.matches = true; preference.emit('change');
    assert(!stack.hasAttribute('data-ba-gallery-motion'), query + ' must remove sticky opt-in immediately');
    for (const node of [...cards, ...media]) for (const property of ['--gallery-expand', '--stack-scale', '--stack-shift', '--parallax', '--stack-caption']) {
      assert.equal(node.style.getPropertyValue(property), '', query + ' must restore the stable visible presentation');
    }
    e.scroll(0);
    assert.equal(cards[0].style.getPropertyValue('--gallery-expand'), '', 'scrolling after a preference change cannot reinstall transforms');
    preference.matches = false; preference.emit('change');
    assert(stack.hasAttribute('data-ba-gallery-motion'), 'returning to the desktop preference must safely rebuild scroll motion');
    assert.equal(Number.parseFloat(cards[0].style.getPropertyValue('--gallery-expand')), 0);
    e.motion.destroy();
  }
}
{
  for (const flags of [{ noLibrary: true }, { reduced: true }, { compact: true, coarse: true }, { lowEnd: true }, { fine: false }]) {
    const e = environment({ gallery: true, ...flags }), { stack, cards } = e.galleryNodes;
    assert(!stack.hasAttribute('data-ba-gallery-motion'), 'gallery must remain in natural flow for ' + JSON.stringify(flags));
    e.scroll(1200);
    assert(cards.every(card => card.style.transform === '' && card.style.opacity === ''), 'fallback projects must never receive hidden or transformed inline styles');
    assert(cards.every(card => card.style.getPropertyValue('--stack-scale') === ''), 'fallback must not keep a stale desktop scale');
    if (flags.noLibrary || flags.reduced || flags.lowEnd) assert.equal(e.jobs.length, 0, 'nonanimated gallery fallback creates no jobs');
    e.motion.destroy();
  }
}
{
  const e = environment({ gallery: true, compact: true, coarse: true });
  const { visuals, stack } = e.galleryNodes;
  assert.equal(e.jobs.length, 0, 'mobile artwork is visible before any entrance observer fires');
  assert(visuals.every(node => node.style.opacity === '' && node.style.transform === ''));
  e.intersect(visuals[0]);
  assert.equal(e.jobs.length, 1, 'a mobile artwork receives one short entrance when it becomes visible');
  const entry = e.jobs[0];
  assert(entry.keyframes.opacity[0] >= 0.85, 'mobile artwork must remain legible throughout the entrance');
  assert(entry.transition.duration <= e.window.BrenMotionLib.motionTokens.duration.normal, 'mobile entry must stay within the shared short duration');
  assert(!stack.hasAttribute('data-ba-gallery-motion'), 'the mobile entrance cannot enable scroll stacking');
  entry.complete(); await microtasks();
  e.intersect(visuals[0], false); e.intersect(visuals[0]); e.motion.refresh(); e.intersect(visuals[0]);
  assert.equal(e.jobs.length, 1, 'mobile re-entry and geometry refresh must not replay an artwork entrance');
  assert.equal(visuals[0].style.transform, ''); assert.equal(visuals[0].style.opacity, '', 'completed mobile entry must release inline styles');
  e.intersect(visuals[1]); const interrupted = e.jobs.at(-1);
  const preference = e.media.get('(prefers-reduced-motion: reduce)'); preference.matches = true; preference.emit('change');
  assert.equal(interrupted.state, 'cancelled', 'enabling reduced motion cancels a running mobile entrance');
  assert.equal(visuals[1].style.transform, ''); assert.equal(visuals[1].style.opacity, '');
  const count = e.jobs.length; e.intersect(visuals[2]); assert.equal(e.jobs.length, count, 'reduced motion prevents subsequent mobile entrances');
  e.motion.destroy();
}

console.log('PASS: reduced/low-end, 120ms route exit, resize-safe route entry/exit, cancellation/restoration, intermediate-frame retargeting, flat critically damped hero entrance, no decorative pointer tracking, button retap position/velocity continuity, independent press transforms, keyboard press, interruptible menu with symmetric origin, menu immediate/reduced/destroy cleanup, foreground refresh, reduced-motion indicator, rapid navigation, same-page resume/anchors/history, gallery scroll reversibility and bounds, live gallery preference cleanup, library-absent fallback and once-only mobile gallery entry.');
