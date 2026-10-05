// Exercise the live component's keyboard and routing handlers without a browser.
// The parent browser audit verifies the actual low-height CSS overflow separately.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const base = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = fs.readFileSync(path.join(base, 'index.html'), 'utf8')
  .match(/<script[^>]*data-dc-script[^>]*>([\s\S]*?)<\/script>/)[1];

function events(object = {}) {
  const listeners = new Map();
  return Object.assign(object, {
    addEventListener(type, fn) { if (!listeners.has(type)) listeners.set(type, new Set()); listeners.get(type).add(fn); },
    removeEventListener(type, fn) { listeners.get(type)?.delete(fn); },
    emit(type, event = {}) { for (const fn of [...(listeners.get(type) || [])]) fn({ type, ...event }); },
  });
}

function environment({ mobile = true } = {}) {
  let document;
  class Element {
    constructor(tag, attributes = {}) {
      this.tagName = tag; this.attributes = attributes; this.children = []; this.style = {};
      this.scrolls = []; this.focuses = [];
      if (attributes.href) this.href = new URL(attributes.href, 'https://example.test').href;
    }
    append(node) { node.parent = this; this.children.push(node); return node; }
    getAttribute(name) { return this.attributes[name] ?? null; }
    hasAttribute(name) { return name in this.attributes; }
    setAttribute(name, value) { this.attributes[name] = value; }
    removeAttribute(name) { delete this.attributes[name]; }
    toggleAttribute(name, enabled) { enabled ? this.setAttribute(name, '') : this.removeAttribute(name); }
    contains(node) { return node === this || this.children.some(child => child.contains(node)); }
    matches() { return this.hasAttribute('tabindex') || ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'SUMMARY'].includes(this.tagName); }
    closest(selector) { return selector === 'a' && this.tagName === 'A' ? this : this.parent?.closest(selector) || null; }
    querySelector(selector) { return selector === 'summary' ? this.children.find(child => child.tagName === 'SUMMARY') || null : null; }
    getClientRects() { return this.style.display === 'none' || (this.parent && !this.parent.getClientRects().length) ? [] : [{}]; }
    focus(options) {
      for (let node = this; node; node = node.parent) if (node.hasAttribute('inert')) return;
      this.focuses.push(options); document.activeElement = this; document.emit('focusin', { target: this });
    }
    scrollIntoView(options) { this.scrolls.push(options); }
  }
  const header = new Element('HEADER');
  const brand = header.append(new Element('A', { href: '/' }));
  const desktopNav = header.append(new Element('DIV'));
  const paths = ['/', '/portfolio', '/services', '/a-propos', '/contact'];
  const desktopLinks = paths.map(href => desktopNav.append(new Element('A', { href })));
  const toggle = header.append(new Element('BUTTON'));
  const menu = header.append(new Element('DIV', { id: 'bs-mobile-menu' }));
  const menuLinks = paths.map(href => menu.append(new Element('A', { href })));
  const main = new Element('MAIN', { id: 'bs-main', tabindex: '-1' });
  const skip = new Element('A', { href: '#bs-main' });
  const footer = new Element('FOOTER', { inert: '' }); // A pre-existing state must survive.
  const roots = ['accueil', 'services', 'contact'].map(page => main.append(new Element('SECTION', { 'data-page': page })));
  const studio = roots[0].append(new Element('DIV', { id: 'home-studio' }));
  const expertises = roots[0].append(new Element('DIV', { id: 'home-expertises' }));
  const details = roots[1].append(new Element('DETAILS', { id: 'web' }));
  const summary = details.append(new Element('SUMMARY'));
  const ids = new Map([['bs-main', main], ['bs-mobile-menu', menu], ['home-studio', studio], ['home-expertises', expertises], ['web', details]]);
  document = events({
    activeElement: toggle,
    getElementById: id => ids.get(id) || null,
    querySelectorAll(selector) {
      if (selector === '.rd-header a[href], .rd-header button:not([disabled])') return [brand, ...desktopLinks, toggle, ...menuLinks];
      if (selector === '.rd-nav-links a') return desktopLinks;
      if (selector === '#bs-main, .rd-footer, .bs-skip') return [main, footer, skip];
      return [];
    },
    querySelector(selector) {
      const page = selector.match(/^section\[data-page="([^"]+)"\]$/)?.[1];
      if (page) return roots.find(root => root.getAttribute('data-page') === page) || null;
      return ({ '.rd-header': header, '.rd-brand': brand, '[data-bs-menu-toggle]': toggle, '#bs-mobile-menu a': menuLinks[0] })[selector] || null;
    },
  });
  const media = new Map();
  const frames = new Map(); let frameId = 0;
  const location = { origin: 'https://example.test', pathname: '/', hash: '' };
  const window = events({
    location,
    matchMedia(query) {
      if (!media.has(query)) media.set(query, events({ matches: query.includes('max-width') ? mobile : query.includes('reduced-motion') }));
      return media.get(query);
    },
    scrollTo() {},
    history: { pushState(_state, _title, target) { const url = new URL(target, location.origin); location.pathname = url.pathname; location.hash = url.hash; } },
  });
  class DCLogic {
    setState(update, callback) {
      this.state = { ...this.state, ...(typeof update === 'function' ? update(this.state) : update) };
      toggle.style.display = this.state.isMobile ? 'flex' : 'none';
      desktopNav.style.display = this.state.isMobile ? 'none' : 'flex';
      menu.style.display = this.state.isMobile && this.state.menuOpen ? 'flex' : 'none';
      roots.forEach(root => root.style.display = root.getAttribute('data-page') === this.state.page ? 'block' : 'none');
      callback?.();
    }
  }
  const context = vm.createContext({
    document, window, DCLogic, URL, setTimeout, clearTimeout, console,
    requestAnimationFrame(fn) { const id = ++frameId; frames.set(id, fn); return id; },
    cancelAnimationFrame(id) { frames.delete(id); },
  });
  vm.runInContext(source + '\nglobalThis.TestComponent = Component;', context);
  const app = new context.TestComponent(); app._initNavPill = () => {}; app.componentDidMount();
  const key = (key, shiftKey = false) => {
    let prevented = false;
    window.emit('keydown', { key, shiftKey, preventDefault() { prevented = true; } });
    return prevented;
  };
  const click = anchor => app._onNavClick({ button: 0, target: anchor, preventDefault() {} });
  const resize = mobile => { const mq = media.get('(max-width: 1020px)'); mq.matches = mobile; mq.emit('change'); };
  const flushFrames = () => { const pending = [...frames.values()]; frames.clear(); pending.forEach(fn => fn()); };
  return { app, document, window, brand, desktopLinks, toggle, menu, menuLinks, main, footer, skip, studio, expertises, summary, Element, key, click, resize, flushFrames };
}

{
  const e = environment();
  e.app.renderVals().toggleMenu();
  assert.equal(e.app.renderVals().menuExpanded, 'true');
  assert.equal(e.document.activeElement, e.menuLinks[0], 'opening must focus the first mobile link');
  for (const node of [e.main, e.skip, e.footer]) assert(node.hasAttribute('inert'), 'covered content must be inert');
  e.menuLinks.at(-1).focus(); assert(e.key('Tab'));
  assert.equal(e.document.activeElement, e.brand, 'Tab after the last menu link must wrap inside the header');
  assert(e.key('Tab', true)); assert.equal(e.document.activeElement, e.menuLinks.at(-1), 'Shift+Tab must wrap back');
  e.document.activeElement = e.main; e.document.emit('focusin', { target: e.main });
  assert.equal(e.document.activeElement, e.menuLinks[0], 'the focus guard must reject focus outside the overlay');
  assert(e.key('Escape')); assert.equal(e.document.activeElement, e.toggle);
  assert.equal(e.app.renderVals().menuExpanded, 'false');
  assert(!e.main.hasAttribute('inert')); assert(!e.skip.hasAttribute('inert')); assert(e.footer.hasAttribute('inert'), 'closing must preserve earlier inert state');
  e.app.renderVals().toggleMenu(); e.app.renderVals().closeMenu();
  assert.equal(e.document.activeElement, e.toggle, 'scrim close must restore the toggle');
  e.app.componentWillUnmount();
}
{
  const e = environment(); e.app.renderVals().toggleMenu();
  e.click(e.menuLinks[0]);
  assert.equal(e.app.state.menuOpen, false); assert(!e.main.hasAttribute('inert'));
  assert.equal(e.document.activeElement, e.main, 'active-page menu navigation must return focus to content');
  e.app.renderVals().toggleMenu(); e.click(e.menuLinks.at(-1));
  assert.equal(e.app.state.page, 'contact'); assert(!e.main.hasAttribute('inert'));
  assert.equal(e.document.activeElement, e.main, 'route navigation must remove inert before focusing its destination');
  e.app.componentWillUnmount();
}
{
  const e = environment(); e.app.renderVals().toggleMenu(); e.menuLinks.at(-1).focus();
  e.resize(false);
  assert.equal(e.app.state.menuOpen, false); assert(!e.main.hasAttribute('inert'));
  assert.equal(e.app.renderVals().scrimD, 'none');
  assert.equal(e.document.activeElement, e.desktopLinks.at(-1), 'desktop resize must focus the equivalent visible link');
  e.resize(true); assert.equal(e.app.state.menuOpen, false, 'returning to mobile must not reopen the menu');
  e.app.componentWillUnmount();
}
{
  const e = environment({ mobile: false }); e.toggle.focus(); e.resize(false);
  assert.equal(e.document.activeElement, e.desktopLinks[0], 'a hidden toggle must never retain focus on desktop');
  e.app.renderVals().toggleMenu(); assert.equal(e.app.state.menuOpen, false, 'desktop must not acquire a latent open menu');
  for (const target of [e.studio, e.expertises]) {
    const link = new e.Element('A', { href: '#' + target.getAttribute('id') }); e.click(link);
    assert.equal(target.scrolls.length, 1); assert.equal(target.getAttribute('tabindex'), '-1');
    assert.equal(e.document.activeElement, target, 'local anchor must focus its content destination');
    assert.equal(target.focuses.at(-1).preventScroll, true, 'focus must preserve the explicit anchor scroll');
  }
  e.click(new e.Element('A', { href: '/#home-studio' })); e.flushFrames();
  assert.equal(e.document.activeElement, e.studio, 'route-style anchors must focus non-native destinations too');
  e.click(new e.Element('A', { href: '/services#web' })); e.flushFrames();
  assert.equal(e.document.activeElement, e.summary); assert(!e.summary.hasAttribute('tabindex'), 'native summary must retain its normal tab order');
  e.app.componentWillUnmount();
}
{
  const e = environment(); e.app.renderVals().toggleMenu(); e.app.componentWillUnmount();
  assert(!e.main.hasAttribute('inert')); assert(!e.skip.hasAttribute('inert')); assert(e.footer.hasAttribute('inert'));
  e.document.activeElement = e.main; e.document.emit('focusin', { target: e.main });
  assert.equal(e.document.activeElement, e.main, 'unmount must remove the focus guard');
}

console.log('PASS: mobile keyboard containment, Escape/scrim focus return, route close, desktop resize, inert restoration, non-native anchor focus and cleanup.');
