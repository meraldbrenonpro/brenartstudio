// Validate the startup contract without timers, browser downloads or React mocks.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { transform } from 'esbuild';

const source = readFileSync(new URL('../lib/hero-startup.ts', import.meta.url), 'utf8');
const { code } = await transform(source, { loader: 'ts', format: 'cjs', target: 'es2020' });

function environment({ reduced = false, forced = false } = {}) {
  const attributes = new Map(), timers = new Map(), preloads = [], events = [];
  let id = 0;
  const window = {
    matchMedia: query => ({ matches: query.includes('reduced-motion') ? reduced : forced }),
    setTimeout(callback, delay) { const key = ++id; timers.set(key, { callback, delay }); return key; },
    clearTimeout(key) { timers.delete(key); },
    dispatchEvent(event) { events.push(event.type); },
  };
  const document = {
    documentElement: {
      setAttribute: (key, value) => attributes.set(key, value),
      removeAttribute: key => attributes.delete(key),
    },
    createElement: () => ({}),
    head: { append: link => preloads.push(link) },
  };
  const context = vm.createContext({ window, document, Event, module: { exports: {} } });
  vm.runInContext(code, context);
  const install = () => context.module.exports.installHeroStartup('/assets/hero.js?v=current');
  return { install, attributes, timers, preloads, events,
    expire() { for (const [key, timer] of [...timers]) { timers.delete(key); timer.callback(); } },
  };
}

// Head and deferred modules share the same gate and the same bounded wait.
const e = environment(), gate = e.install();
assert.equal(e.install(), gate);
assert.equal(gate.prepare(), true);
assert.equal(gate.prepare(), true);
assert.equal(e.attributes.get('data-hero-startup'), 'pending');
assert.equal(e.timers.size, 1);
assert.equal(e.preloads.length, 1);
assert.equal(e.preloads[0].rel, 'modulepreload');
assert.equal(e.preloads[0].href, '/assets/hero.js?v=current');

// A timeout releases readable HTML and prevents a late canvas from taking over.
e.expire();
assert.equal(e.attributes.size, 0);
assert.equal(gate.canMount(), false);
assert.equal(gate.prepare(), false);
gate.settle(); gate.fallback();
assert.equal(gate.canMount(), false);
assert.deepEqual(e.events, ['bren:hero-fallback']);

// A fresh visit can retry; the first painted frame cancels the watchdog.
gate.leave();
assert.equal(gate.prepare(), true);
assert.equal(e.preloads.length, 1);
gate.settle();
assert.equal(e.timers.size, 0);
assert.equal(e.attributes.size, 0);
e.expire();
assert.equal(gate.canMount(), true);
assert.equal(gate.prepare(), true);
assert.equal(e.attributes.size, 0, 'Repeated route setup must not conceal a running hero');

// Leaving before the first frame cancels the pending visit completely.
gate.leave(); gate.prepare(); gate.leave();
assert.equal(e.timers.size, 0);
assert.equal(e.attributes.size, 0);
assert.equal(gate.prepare(), true);
gate.fallback();
assert.equal(gate.canMount(), false);
assert.equal(e.attributes.size, 0);

// Accessibility preferences never conceal the semantic HTML heading.
for (const flags of [{ reduced: true }, { forced: true }]) {
  const staticEnvironment = environment(flags), staticGate = staticEnvironment.install();
  assert.equal(staticGate.prepare(), true);
  assert.equal(staticEnvironment.attributes.size, 0);
  assert.equal(staticEnvironment.preloads.length, 0);
  assert.equal(staticEnvironment.timers.size, 0);
}

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const start = html.indexOf('<!-- HERO_BOOTSTRAP -->');
const end = html.indexOf('<!-- /HERO_BOOTSTRAP -->');
assert(start > 0 && end > start && end < html.indexOf('<body'));
assert.equal(html.split('<!-- HERO_BOOTSTRAP -->').length, 2);
console.log('PASS: pre-paint bootstrap, first-frame release, bounded fallback, blocked late canvas, route retry, shared preload and static accessibility modes.');
