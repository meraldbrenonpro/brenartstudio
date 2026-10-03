// Read-only smoke checks against current production source, without a browser.
// Motion's cancellation promise stays pending; the DOM double reproduces that
// boundary so the site's wrapper must resolve its own navigation promise.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
  });
}

class NodeDouble {
  constructor(tag = 'DIV', attributes = {}) {
    this.tagName = tag; this.attributes = attributes; this.children = []; this.selectors = new Map();
    this.open = false; this.focusCount = 0; this.scrollCount = 0; this.offsetHeight = 500;
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
  append(child) { child.parent = this; this.children.push(child); return child; }
  contains(node) { return node === this || this.children.some(child => child.contains(node)); }
  querySelectorAll(selector) { return this.selectors.get(selector) || []; }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  closest(selector) {
    if (selector === 'a' && this.tagName === 'A') return this;
    if (selector === '[data-ba-stack]' && this.hasAttribute('data-ba-stack')) return this;
    return this.parent?.closest(selector) || null;
  }
  getClientRects() { return this.style.display === 'none' ? [] : [{}]; }
  getBoundingClientRect() { return { top: 100, bottom: 600, height: 500, width: 500, left: 0 }; }
  focus() { this.focusCount++; }
  scrollIntoView() { this.scrollCount++; }
  animate() {} // Feature detection; the library double owns actual controls.
}

function environment({ reduced = false, lowEnd = false, hidden = false, hero = false } = {}) {
  const jobs = [], observers = [], frames = new Map(); let nextFrame = 1;
  const roots = ['accueil', 'services', 'contact'].map(page => new NodeDouble('SECTION', { 'data-page': page }));
  roots.forEach((root, index) => root.style.display = index ? 'none' : 'block');
  const main = new NodeDouble('MAIN'), html = new NodeDouble('HTML'); html.clientHeight = 800;
  const ids = new Map([['bs-main', main]]);
  const stack = roots[0].append(new NodeDouble('DIV', { 'data-ba-stack': '' }));
  const cards = [stack.append(new NodeDouble()), stack.append(new NodeDouble())];
  stack.selectors.set('[data-ba-project]', cards);
  roots[0].selectors.set('[data-ba-stack]', [stack]);
  const heading = roots[0].append(new NodeDouble('H2'));
  roots[0].selectors.set('[data-ba-reveal]', [heading]);
  if (hero) {
    roots[0].selectors.set('.bh-hero-copy', [roots[0].append(new NodeDouble())]);
    roots[0].selectors.set('.bh-hero-piece', [roots[0].append(new NodeDouble('A')), roots[0].append(new NodeDouble('A'))]);
    roots[0].selectors.set('.bh-hero-foot', [roots[0].append(new NodeDouble())]);
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
    if (!media.has(query)) media.set(query, events({ matches: query.includes('reduced-motion') && reduced }));
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
    document, location, innerHeight: 800, matchMedia,
    requestAnimationFrame: raf, cancelAnimationFrame: cancelRaf,
    getComputedStyle: node => ({ display: node.style.display || 'block', top: '100px', transform: node.style.transform || 'none', opacity: node.style.opacity || '1' }),
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
    animate, spring() {}, DCLogic, React: {}, URL, setTimeout, clearTimeout, performance, console,
  });
  vm.runInContext(librarySource, context);
  vm.runInContext(motionSource, context);
  const motion = window.BrenMotion;
  const flushFrames = () => { const pending = [...frames.values()]; frames.clear(); pending.forEach(fn => fn(0)); };
  const makeComponent = () => {
    vm.runInContext(componentSource + '\nglobalThis.TestComponent = Component;', context);
    const app = new context.TestComponent(); app._initNavPill = () => {}; app.componentDidMount();
    return app;
  };
  const click = (app, href) => {
    const anchor = new NodeDouble('A', { href }); anchor.href = new URL(href, location.origin).href;
    app._onNavClick({ button: 0, target: anchor, preventDefault() {} });
  };
  return { motion, jobs, observers, roots, ids, html, document, window, media, flushFrames, makeComponent, click };
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
  e.click(app, '/'); e.jobs.at(-1).complete(); await microtasks();
  assert.equal(app.state.page, 'accueil'); assert.equal(e.window.location.hash, '');
  app.componentWillUnmount();
}
{
  const e = environment({ hero: true }), app = e.makeComponent();
  assert(e.jobs.some(job => job.node === e.roots[0].querySelector('.bh-hero-copy')), 'fixture must exercise the actual initial hero choreography');
  for (const job of e.jobs) job.complete(); await microtasks();
  const before = e.jobs.length;
  e.click(app, '/'); await microtasks();
  assert.equal(e.jobs.length, before, 'clicking the active page must not replay the hero or create a new entrance');
  app.componentWillUnmount();
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
  resume.complete(); await microtasks(); assert.equal(e.roots[0].style.opacity, '');
  app.componentWillUnmount();
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

console.log('PASS: reduced/low-end, held exit, resize-safe route entry/exit, cancellation/restoration, intermediate-frame retargeting, destroy cleanup, foreground refresh, reduced-motion indicator, rapid navigation, no active-page hero replay, same-page fade resume, anchors and same-page browser history.');
