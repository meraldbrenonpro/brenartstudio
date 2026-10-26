import { startMagneticCursor } from './magnetic-cursor-loader'
import { startBottomNavigation } from './bottom-nav-loader'

// The protected case-study HTML is intentionally frozen. Links back to the
// commercial site must fetch its current shell rather than reveal an old copy.
const frozenStudy = /^\/portfolio\/[^/]+\/?$/.test(location.pathname) &&
  !document.body.classList.contains('creative-site')
const currentStudioPath = (url: URL) => url.origin === location.origin &&
  ['/', '/services', '/a-propos', '/contact', '/portfolio'].includes(url.pathname.replace(/\/+$/, '') || '/')
if (frozenStudy) {
  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    const anchor = (event.target as Element | null)?.closest('a')
    if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return
    if (currentStudioPath(new URL(anchor.href))) event.stopImmediatePropagation()
  }, true)
  window.addEventListener('popstate', (event) => {
    if (!currentStudioPath(new URL(location.href))) return
    event.stopImmediatePropagation()
    location.reload()
  }, true)
}

// A small route-aware loader keeps the React/canvas bundle off the other pages.
declare const __DOT_FIELD_MODULE__: string

interface HeroAnimationModule {
  mountHero(): void
  unmountHero(): void
}

interface HeroAnimationController {
  sync(page: string): void
  destroy(): void
}

const browser = window as Window & { BrenHero?: HeroAnimationController }
browser.BrenHero?.destroy()
let loaded: HeroAnimationModule | null = null
let loading: Promise<HeroAnimationModule> | null = null
let generation = 0

const sync = (page: string) => {
  const current = ++generation
  if (page !== "accueil") {
    loaded?.unmountHero()
    return
  }
  if (!loading) loading = import(__DOT_FIELD_MODULE__)
  loading.then((module) => {
    loaded = module
    if (generation === current) module.mountHero()
  }).catch(() => {
    // The authored HTML headline remains visible when the enhancement fails.
    loading = null
  })
}

browser.BrenHero = {
  sync,
  destroy() {
    generation++
    loaded?.unmountHero()
  },
}

const start = () => {
  sync(location.pathname.replace(/\/+$/, "") === "" ? "accueil" : "")
  startBottomNavigation()
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true })
else start()

// Global environment enhancement; project HTML and media remain untouched.
startMagneticCursor()
