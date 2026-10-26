// Run the actual typed engine against pointer/media/RAF lifecycles, without a browser.
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const { outputFiles } = await build({
  entryPoints: [fileURLToPath(new URL('../lib/magnetic-cursor.ts', import.meta.url))],
  bundle: true, write: false, platform: 'node', format: 'cjs', target: 'node20',
});
const module = { exports: {} };
vm.runInNewContext(outputFiles[0].text, { module, exports: module.exports });
const { createMagneticCursor } = module.exports; // Import itself never needs window/document.

class Events {
  listeners = new Map();
  addEventListener(name, handler) { if (!this.listeners.has(name)) this.listeners.set(name, new Set()); this.listeners.get(name).add(handler); }
  removeEventListener(name, handler) { this.listeners.get(name)?.delete(handler); }
  emit(name, detail = {}) { for (const handler of [...(this.listeners.get(name) || [])]) handler({ type: name, target: this, ...detail }); }
  count() { return [...this.listeners.values()].reduce((n, handlers) => n + handlers.size, 0); }
}
class Style {
  values = new Map(); priorities = new Map(); writes = []; throwOn = '';
  setProperty(name, value, priority = '') {
    if (this.throwOn === name) throw new Error('simulated style failure');
    this.values.set(name, String(value)); this.priorities.set(name, priority); this.writes.push(name);
  }
  getPropertyValue(name) { return this.values.get(name) || ''; }
  getPropertyPriority(name) { return this.priorities.get(name) || ''; }
  removeProperty(name) { const old = this.getPropertyValue(name); this.values.delete(name); this.priorities.delete(name); this.writes.push(name); return old; }
}
class Rect {
  constructor(x, y, width, height) { Object.assign(this, { x, y, left: x, top: y, width, height, right: x + width, bottom: y + height }); }
}
class Node {
  attributes = new Map(); style = new Style(); isConnected = true; parentElement = null; children = [];
  constructor(tag, doc, attributes = {}, box = new Rect(100, 100, 160, 48)) {
    this.tagName = tag.toUpperCase(); this.ownerDocument = doc; this.box = box;
    Object.entries(attributes).forEach(([name, value]) => this.setAttribute(name, value));
  }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  removeAttribute(name) { this.attributes.delete(name); }
  append(child) { child.parentElement = this; this.children.push(child); return child; }
  matches(selector) {
    if (selector === '[contenteditable]:not([contenteditable="false"])') return this.attributes.has('contenteditable') && this.getAttribute('contenteditable') !== 'false';
    const attribute = selector.match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/);
    if (attribute) return this.attributes.has(attribute[1]) && (attribute[2] === undefined || this.getAttribute(attribute[1]) === attribute[2]);
    if (selector.startsWith('.')) return (this.getAttribute('class') || '').split(' ').includes(selector.slice(1));
    if (/^[a-z]+$/i.test(selector)) return this.tagName === selector.toUpperCase();
    throw new Error('Invalid selector');
  }
  closest(selector) {
    for (let node = this; node; node = node.parentElement) if (selector.split(',').some(part => node.matches(part.trim()))) return node;
    return null;
  }
  getBoundingClientRect() {
    const offset = this.style.getPropertyValue('translate').split(' ').map(parseFloat);
    return new Rect(this.box.x + (offset[0] || 0), this.box.y + (offset[1] || 0), this.box.width, this.box.height);
  }
}

function environment({ fine = true, coarse = false, reduced = false, forced = false, supports = true, springs = false } = {}) {
  const doc = new Events(); doc.hidden = false; doc.fullscreenElement = null;
  const win = new Events(); doc.defaultView = win;
  win.innerWidth = 1280; win.innerHeight = 800; win.DOMRect = Rect;
  let time = 0, nextFrame = 0;
  const frames = new Map();
  win.requestAnimationFrame = callback => { const id = ++nextFrame; frames.set(id, callback); return id; };
  win.cancelAnimationFrame = id => frames.delete(id);
  const media = new Map([
    ['(hover: hover) and (pointer: fine)', fine], ['(pointer: coarse)', coarse],
    ['(prefers-reduced-motion: reduce)', reduced], ['(forced-colors: active)', forced],
  ].map(([query, matches]) => [query, Object.assign(new Events(), { matches })]));
  win.matchMedia = query => media.get(query);
  win.CSS = { supports: () => supports };
  win.getSelection = () => ({ isCollapsed: true });
  win.getComputedStyle = node => ({
    getPropertyValue: name => node.style.getPropertyValue(name) || (name === 'translate' ? 'none' : ''),
    get opacity() { return node.style.getPropertyValue('opacity') || '1'; },
    get visibility() { return node.style.getPropertyValue('visibility') || 'visible'; },
    get display() { return node.style.getPropertyValue('display') || 'block'; },
    get borderTopLeftRadius() { return node.style.getPropertyValue('border-radius') || '999px'; },
  });
  doc.documentElement = new Node('html', doc);
  doc.body = doc.documentElement.append(new Node('body', doc));
  const make = (tag, attrs, box) => doc.body.append(new Node(tag, doc, attrs, box));
  if (springs) win.BrenMotionLib = {
    springs: { gentle: {}, release: {} }, motionTokens: { duration: { fast: .18 } },
    createSpringValue(initial, update, complete = () => {}) {
      let value = initial, target = initial, frame = 0;
      function tick() {
        frame = 0; value += (target - value) * .4;
        const done = Math.abs(target - value) < .001;
        if (done) value = target;
        update(value);
        if (done) complete(target); else frame = win.requestAnimationFrame(tick);
      }
      return {
        set(next) { target = next; if (!frame) frame = win.requestAnimationFrame(tick); },
        stop() { win.cancelAnimationFrame(frame); frame = 0; },
      };
    },
  };
  const pump = (count = 1, dt = 1000 / 60) => {
    for (let n = 0; n < count; n++) {
      time += dt; const jobs = [...frames.values()]; frames.clear(); jobs.forEach(job => job(time));
    }
  };
  const settle = () => { let left = 900; while (frames.size && left--) pump(); assert.ok(left > 0, 'RAF should settle rather than loop at rest'); };
  const pointer = (target, x = 200, y = 200, pointerType = 'mouse') => win.emit('pointermove', { target, clientX: x, clientY: y, pointerType });
  const preference = (query, matches) => { const item = media.get(query); item.matches = matches; item.emit('change'); };
  return { doc, win, media, make, frames, pump, settle, pointer, preference,
    overlay: make('div'), listenerCount: () => doc.count() + win.count() + [...media.values()].reduce((n, query) => n + query.count(), 0) };
}
const active = env => env.doc.documentElement.getAttribute('data-br-cursor');

// No flash at origin, no hidden native pointer before the first successful frame.
{
  const e = environment(); const cursor = createMagneticCursor(e.overlay);
  assert.equal(active(e), null); assert.equal(e.overlay.style.getPropertyValue('opacity'), '0');
  e.pointer(e.doc.body, 350, 240); assert.equal(active(e), null); e.pump();
  assert.equal(active(e), 'active');
  assert.match(e.overlay.style.getPropertyValue('transform'), /350\.000px,240\.000px/);
  e.settle(); assert.equal(e.frames.size, 0);
  e.pointer(e.doc.body, 600, 380); e.pump(2); e.settle(); assert.equal(e.frames.size, 0);
  e.doc.emit('keydown', { key: 'Tab' }); assert.equal(active(e), null);
  e.pointer(e.doc.body); e.pump(); assert.equal(active(e), 'active');
  e.doc.emit('pointerleave'); assert.equal(active(e), null); assert.equal(e.frames.size, 0);
  cursor.destroy(); assert.equal(e.listenerCount(), 0);
}
// Every accessibility/pointer gate keeps a native cursor, including live changes.
for (const setup of [{ fine: false }, { coarse: true }, { reduced: true }, { forced: true }, { supports: false }]) {
  const e = environment(setup); const cursor = createMagneticCursor(e.overlay);
  e.pointer(e.doc.body); e.pump(); assert.equal(active(e), null); assert.equal(e.frames.size, 0);
  cursor.destroy(); assert.equal(e.listenerCount(), 0);
}
{
  const e = environment(); const cursor = createMagneticCursor(e.overlay);
  e.pointer(e.doc.body, 200, 200, 'touch'); e.pump(); assert.equal(active(e), null);
  for (const query of ['(prefers-reduced-motion: reduce)', '(forced-colors: active)', '(pointer: coarse)']) {
    e.pointer(e.doc.body); e.pump(); assert.equal(active(e), 'active');
    e.preference(query, true); assert.equal(active(e), null); assert.equal(e.frames.size, 0);
    e.preference(query, false);
  }
  e.pointer(e.doc.body); e.pump(); e.doc.hidden = true; e.doc.emit('visibilitychange');
  assert.equal(active(e), null); assert.equal(e.frames.size, 0);
  e.doc.hidden = false; e.pointer(e.doc.body); e.pump(); e.win.emit('blur'); assert.equal(active(e), null);
  cursor.destroy();
}
// Delegation resolves SVG/span children, while editable/disabled/inert ancestors remain native.
{
  const e = environment({ springs: true });
  const button = e.make('button', { 'data-magnetic': '' }); const child = button.append(new Node('svg', e.doc));
  button.style.setProperty('transform', 'rotate(4deg)'); button.style.setProperty('scale', '.97');
  const start = button.style.writes.length;
  const cursor = createMagneticCursor(e.overlay);
  e.pointer(child, 251, 138); e.pump(8);
  assert.equal(e.overlay.getAttribute('data-br-cursor-state'), 'magnetic');
  assert.equal(e.overlay.getAttribute('data-br-cursor-target'), 'button');
  assert.ok(parseFloat(e.overlay.style.getPropertyValue('width')) > 160);
  assert.ok(button.style.getPropertyValue('translate'));
  assert.ok(button.style.getPropertyValue('translate').split(' ').every(value => Math.abs(parseFloat(value)) <= 8));
  assert.ok(!button.style.writes.slice(start).some(name => ['transform', 'scale'].includes(name)));
  e.doc.emit('pointerout', { target: button, relatedTarget: child }); assert.equal(active(e), 'active');
  e.settle(); assert.equal(e.frames.size, 0);
  // Scroll cancels the old viewport rectangle and restores the independent translation.
  e.doc.emit('scroll'); assert.equal(active(e), null); assert.equal(button.style.getPropertyValue('translate'), '');
  assert.equal(button.style.getPropertyValue('transform'), 'rotate(4deg)'); assert.equal(button.style.getPropertyValue('scale'), '.97');
  for (const [tag, attrs] of [['input', {}], ['textarea', {}], ['select', {}], ['iframe', {}], ['video', {}], ['div', { contenteditable: 'true' }], ['div', { inert: '' }], ['button', { disabled: '' }]]) {
    e.pointer(child, 220, 130); e.pump();
    const parent = e.make(tag, attrs); const nested = parent.append(new Node('span', e.doc));
    e.pointer(nested); e.pump(); assert.equal(active(e), null, `${tag} ancestor must retain native pointer`);
  }
  cursor.destroy(); assert.equal(e.listenerCount(), 0); assert.equal(e.frames.size, 0);
}
// Text-bar shape has one renderer. Radius also converges for equal-size targets.
{
  const e = environment(); const cursor = createMagneticCursor(e.overlay, { cursorSize: 24, hoverPadding: 0 });
  const paragraph = e.make('p'); e.pointer(paragraph); e.settle();
  assert.equal(e.overlay.getAttribute('data-br-cursor-state'), 'text');
  assert.ok(Math.abs(parseFloat(e.overlay.style.getPropertyValue('width')) - 3) < .08);
  const square = e.make('button', { 'data-magnetic': '' }, new Rect(188, 188, 24, 24));
  square.style.setProperty('border-radius', '0px');
  cursor.reset(); e.pointer(e.doc.body); e.pump(); e.pointer(square); e.settle();
  assert.ok(parseFloat(e.overlay.style.getPropertyValue('border-radius')) < .08, 'Equal-size shape must finish its corner animation');
  cursor.destroy();
}
// Mouse release restores the effect after a collapsed click, but preserves real selection/native zones.
{
  const e = environment(); const cursor = createMagneticCursor(e.overlay);
  e.pointer(e.doc.body); e.pump(); e.doc.emit('selectstart'); assert.equal(active(e), null);
  e.win.emit('pointerup', { target: e.doc.body, clientX: 220, clientY: 180, pointerType: 'mouse' }); e.pump();
  assert.equal(active(e), 'active');
  e.win.getSelection = () => ({ isCollapsed: false }); e.doc.emit('selectstart');
  e.win.emit('pointerup', { target: e.doc.body, clientX: 220, clientY: 180, pointerType: 'mouse' }); e.pump();
  assert.equal(active(e), null);
  e.win.getSelection = () => ({ isCollapsed: true });
  const input = e.make('input'); e.win.emit('pointerup', { target: input, clientX: 220, clientY: 180, pointerType: 'mouse' }); e.pump();
  assert.equal(active(e), null);
  e.pointer(e.doc.body); e.pump(); e.win.emit('pointercancel'); assert.equal(active(e), null);
  cursor.destroy(); assert.equal(e.listenerCount(), 0); assert.equal(e.frames.size, 0);
}
// Invalid selectors safely fall back to a free cursor, without event exceptions.
{
  const e = environment(); const cursor = createMagneticCursor(e.overlay, { hoverAttribute: 'bad]', magneticSelector: '[bad', magneticMoveSelector: '[broken' });
  e.pointer(e.doc.body); e.settle(); assert.equal(active(e), 'active');
  assert.equal(e.overlay.getAttribute('data-br-cursor-state'), 'free'); cursor.destroy();
}
// Existing translations are not composed destructively; previous root values survive.
{
  const e = environment({ springs: true }); e.doc.documentElement.setAttribute('data-br-cursor', 'prior');
  const button = e.make('button', { 'data-magnetic': '' }); button.style.setProperty('translate', '12px 3px', 'important');
  const cursor = createMagneticCursor(e.overlay); e.pointer(button); e.settle();
  assert.equal(button.style.getPropertyValue('translate'), '12px 3px');
  assert.equal(button.style.getPropertyPriority('translate'), 'important');
  cursor.reset(); assert.equal(active(e), 'prior'); cursor.destroy(); assert.equal(active(e), 'prior');
}
// A later controller never restores a stale active value owned by a reset instance.
{
  const e = environment(); const first = createMagneticCursor(e.overlay);
  e.pointer(e.doc.body); e.pump();
  const second = createMagneticCursor(e.make('div'));
  first.reset(); e.pointer(e.doc.body); e.pump();
  first.destroy(); second.reset(); assert.equal(active(e), null);
  second.destroy(); assert.equal(e.listenerCount(), 0); assert.equal(e.frames.size, 0);
}
// A CSS/render failure cannot hide the OS pointer, and idle/destroy leave no work.
{
  const e = environment(); e.overlay.style.setProperty('display', 'none');
  const cursor = createMagneticCursor(e.overlay); e.pointer(e.doc.body); e.settle(); assert.equal(active(e), null); cursor.destroy();
}
{
  const e = environment(); const cursor = createMagneticCursor(e.overlay); e.overlay.style.throwOn = 'transform';
  e.pointer(e.doc.body); e.pump(); assert.equal(active(e), null); assert.equal(e.frames.size, 0);
  e.overlay.style.throwOn = ''; cursor.destroy();
}
{
  const e = environment({ springs: true }); const button = e.make('button', { 'data-magnetic': '' });
  for (let index = 0; index < 20; index++) {
    const cursor = createMagneticCursor(e.overlay); e.pointer(button, 260, 142); e.pump(2); cursor.reset(); cursor.destroy(); cursor.destroy();
    assert.equal(e.frames.size, 0); assert.equal(e.listenerCount(), 0); assert.equal(active(e), null);
    assert.equal(button.style.getPropertyValue('translate'), '');
  }
}
console.log('PASS: cursor fine-pointer/accessibility gates, nested delegation, native fields, idle RAF, radius convergence, scroll/route reset, transform isolation, errors and repeated cleanup.');
