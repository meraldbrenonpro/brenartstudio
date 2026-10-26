// Exercise the real bootstrap with a controlled module-loading boundary.
// No browser, network, timer delays or real pointer suppression are used.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { transform } from 'esbuild';

const source = readFileSync(new URL('../components/magnetic-cursor-loader.ts', import.meta.url), 'utf8');
const importBoundary = 'import(__MAGNETIC_CURSOR_MODULE__)';
assert.equal(source.split(importBoundary).length, 2, 'One optional module-loading boundary is expected');
const { code } = await transform(source.replace(importBoundary, 'globalThis.__cursorTest.load()'), {
  loader: 'ts', format: 'cjs', target: 'es2020',
});

function eventTarget(extra = {}) {
  const listeners = new Map();
  return Object.assign(extra, {
    addEventListener(type, callback, options) {
      if (!listeners.has(type)) listeners.set(type, new Map());
      listeners.get(type).set(callback, options);
    },
    removeEventListener(type, callback) { listeners.get(type)?.delete(callback); },
    emit(type) {
      for (const [callback, options] of [...(listeners.get(type) || [])]) {
        if (options?.once) listeners.get(type).delete(callback);
        callback({ type });
      }
    },
    listenerCount() { return [...listeners.values()].reduce((sum, group) => sum + group.size, 0); },
  });
}
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
const flush = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };

function environment({ fine = true, reduced = false, forced = false, hidden = false, lowEnd = false, loading = false } = {}) {
  const requests = [];
  const controls = [];
  const nodes = new Set();
  const rootAttributes = new Map();
  let low = lowEnd;
  let shouldThrow = false;
  const preferences = new Map([
    ['(hover: hover) and (pointer: fine)', eventTarget({ matches: fine })],
    ['(prefers-reduced-motion: reduce)', eventTarget({ matches: reduced })],
    ['(forced-colors: active)', eventTarget({ matches: forced })],
  ]);
  const document = eventTarget({
    hidden, readyState: loading ? 'loading' : 'complete',
    documentElement: {
      setAttribute(name, value) { rootAttributes.set(name, value); },
      getAttribute(name) { return rootAttributes.get(name) ?? null; },
      removeAttribute(name) { rootAttributes.delete(name); },
    },
    body: { append(element) { element.isConnected = true; nodes.add(element); } },
    createElement() {
      return {
        isConnected: false, className: '', attributes: new Map(),
        setAttribute(name, value) { this.attributes.set(name, value); },
        remove() { this.isConnected = false; nodes.delete(this); },
      };
    },
  });
  const window = eventTarget({ BrenMotionLib: { isLowEnd: () => low } });
  const engineModule = {
    createMagneticCursor(element, options) {
      if (shouldThrow) throw new Error('Controlled initialization failure');
      const record = { element, options, resets: 0, destroys: 0 };
      controls.push(record);
      // Simulate a rendered controller acquiring the native-cursor switch.
      rootAttributes.set('data-br-cursor', 'active');
      return {
        reset() { record.resets++; rootAttributes.delete('data-br-cursor'); },
        destroy() { record.destroys++; rootAttributes.delete('data-br-cursor'); },
      };
    },
  };
  const context = vm.createContext({
    window, document, Promise, exports: {}, module: { exports: {} },
    matchMedia: query => preferences.get(query),
    __cursorTest: { load() { const request = deferred(); requests.push(request); return request.promise; } },
  });
  vm.runInContext(code, context);
  return {
    window, document, nodes, requests, controls, rootAttributes,
    start: () => context.module.exports.startMagneticCursor(),
    preference(query, matches) { const entry = preferences.get(query); entry.matches = matches; entry.emit('change'); },
    visibility(value) { document.hidden = value; document.emit('visibilitychange'); },
    load(index = requests.length - 1) { requests[index].resolve(engineModule); },
    setLowEnd(value) { low = value; },
    throwOnCreate(value) { shouldThrow = value; },
    listenerCount() { return window.listenerCount() + document.listenerCount() + [...preferences.values()].reduce((sum, entry) => sum + entry.listenerCount(), 0); },
  };
}
const fineQuery = '(hover: hover) and (pointer: fine)';
const reducedQuery = '(prefers-reduced-motion: reduce)';
const forcedQuery = '(forced-colors: active)';

// No optional payload on coarse, reduced, forced-colour, hidden or modest devices.
for (const options of [{ fine: false }, { reduced: true }, { forced: true }, { hidden: true }, { lowEnd: true }]) {
  const env = environment(options); env.start(); await flush();
  assert.equal(env.requests.length, 0);
  assert.equal(env.nodes.size, 0);
  env.window.BrenCursor.destroy();
  assert.equal(env.listenerCount(), 0);
}

// A preference change invalidates an in-flight import before it can own the cursor.
{
  const env = environment(); env.start();
  assert.equal(env.requests.length, 1);
  env.preference(reducedQuery, true);
  env.load(); await flush();
  assert.equal(env.controls.length, 0);
  assert.equal(env.nodes.size, 0);
  assert.equal(env.rootAttributes.has('data-br-cursor'), false);
  env.preference(reducedQuery, false); await flush();
  assert.equal(env.requests.length, 1, 'The successful optional module is cached');
  assert.equal(env.controls.length, 1); assert.equal(env.nodes.size, 1);
  env.window.emit('pageshow'); env.window.emit('pageshow'); await flush();
  assert.equal(env.controls.length, 1, 'Repeated reconciliation does not duplicate the overlay');
  env.visibility(true);
  assert.equal(env.rootAttributes.has('data-br-cursor'), false);
  assert.equal(env.controls[0].resets, 1);
  env.visibility(false); await flush();
  assert.equal(env.controls.length, 1);
  for (const query of [fineQuery, reducedQuery, forcedQuery]) {
    const disablingValue = query !== fineQuery;
    env.preference(query, disablingValue); await flush();
    assert.equal(env.nodes.size, 0);
    assert.equal(env.rootAttributes.has('data-br-cursor'), false);
    env.preference(query, !disablingValue); await flush();
    assert.equal(env.nodes.size, 1);
  }
  env.setLowEnd(true); env.window.emit('pageshow'); await flush();
  assert.equal(env.nodes.size, 0);
  env.setLowEnd(false); env.window.emit('pageshow'); await flush();
  assert.equal(env.nodes.size, 1);
  const alive = env.controls.at(-1);
  env.window.BrenCursor.reset(); assert.equal(alive.resets, 1);
  env.window.emit('pagehide'); assert.equal(alive.resets, 2);
  env.window.BrenCursor.destroy(); env.window.BrenCursor.destroy();
  assert.equal(alive.destroys, 1);
  assert.equal(env.nodes.size, 0); assert.equal(env.listenerCount(), 0);
}

// Latest eligibility wins even if pointer modes change twice before resolution.
{
  const env = environment(); env.start();
  env.preference(fineQuery, false); env.preference(fineQuery, true);
  env.load(); await flush();
  assert.equal(env.requests.length, 1); assert.equal(env.controls.length, 1); assert.equal(env.nodes.size, 1);
  env.window.BrenCursor.destroy();
}

// Backgrounding during download cannot mount until the document becomes visible.
{
  const env = environment(); env.start(); env.visibility(true); env.load(); await flush();
  assert.equal(env.controls.length, 0);
  env.visibility(false); await flush();
  assert.equal(env.controls.length, 1);
  env.window.BrenCursor.destroy();
}

// DOM-ready work and stale imports cannot recreate anything after destruction.
{
  const env = environment({ loading: true }); env.start();
  assert.equal(env.requests.length, 0);
  env.document.readyState = 'complete'; env.document.emit('DOMContentLoaded');
  assert.equal(env.requests.length, 1);
  env.window.BrenCursor.destroy(); env.load(); await flush();
  assert.equal(env.nodes.size, 0); assert.equal(env.controls.length, 0); assert.equal(env.listenerCount(), 0);
}

// Failed imports retry on the next eligible event; failed initialization removes its host.
{
  const env = environment(); env.start(); env.requests[0].reject(new Error('Controlled load failure')); await flush();
  assert.equal(env.nodes.size, 0);
  env.window.emit('pageshow'); assert.equal(env.requests.length, 2);
  env.throwOnCreate(true); env.load(); await flush();
  assert.equal(env.nodes.size, 0); assert.equal(env.rootAttributes.has('data-br-cursor'), false);
  env.throwOnCreate(false); env.window.emit('pageshow'); await flush();
  assert.equal(env.nodes.size, 1);
  env.window.BrenCursor.destroy(); assert.equal(env.listenerCount(), 0);
}

// Re-starting the shared bootstrap replaces its predecessor and listeners exactly once.
{
  const env = environment(); env.start(); env.load(); await flush();
  const count = env.listenerCount(); const previous = env.controls[0];
  env.start();
  assert.equal(previous.destroys, 1); assert.equal(env.nodes.size, 0); assert.equal(env.listenerCount(), count);
  env.load(); await flush();
  assert.equal(env.nodes.size, 1); assert.equal(env.controls.length, 2);
  env.window.BrenCursor.destroy(); assert.equal(env.listenerCount(), 0);
}
console.log('PASS: cursor loader eligibility, deferred import races, visibility, idempotence, retry and complete cleanup.');
