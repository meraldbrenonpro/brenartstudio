declare const __BOTTOM_NAV_MODULE__: string

interface BottomNavModule {
  mountBottomNav(host: HTMLElement, path: string): void
  unmountBottomNav(): void
}
interface BottomNavController { sync(): void; destroy(): void }

/** No React request on desktop; the existing header is the no-JS fallback. */
export function startBottomNavigation() {
  const browser = window as Window & { BrenBottomNav?: BottomNavController }
  browser.BrenBottomNav?.destroy()
  const media = window.matchMedia("(max-width: 1020px)")
  let host: HTMLElement | null = null
  let loaded: BottomNavModule | null = null
  let loading: Promise<BottomNavModule> | null = null
  let generation = 0
  let destroyed = false
  const viewport = window.visualViewport

  const syncVisibility = () => {
    if (!host) return
    const open = !!document.querySelector('[data-bs-menu-toggle][aria-expanded="true"]')
    const editing = !!document.activeElement?.closest(
      'input:not([type="checkbox"]):not([type="radio"]):not([type="submit"]):not([type="button"]), textarea, select, [contenteditable="true"], [contenteditable=""]',
    )
    const keyboard = !!viewport && viewport.height < window.innerHeight * 0.7
    host.hidden = open || editing || keyboard
    host.inert = host.hidden
  }

  const remove = () => {
    generation++
    const focused = host?.contains(document.activeElement)
    const href = focused ? document.activeElement?.getAttribute("href") : null
    loaded?.unmountBottomNav()
    host?.remove()
    host = null
    document.body.removeAttribute("data-bottom-nav")
    if (focused) {
      const target = href ? Array.from(document.querySelectorAll<HTMLAnchorElement>('.rd-nav-links a')).find(link => link.getAttribute('href') === href) : null
      const fallback = document.querySelector<HTMLElement>('[data-bs-menu-toggle]')
      const visible = target?.getClientRects().length ? target : fallback
      if (visible?.getClientRects().length) visible.focus({ preventScroll: true })
    }
  }

  const sync = () => {
    if (destroyed) return
    if (!media.matches) { if (host) remove(); return }
    if (!host) {
      host = document.createElement("div")
      host.setAttribute("data-bottom-nav-host", "")
      host.setAttribute("data-no-magnetic", "")
      document.body.append(host)
    }
    syncVisibility()
    const target = host
    const current = generation
    loading ??= import(__BOTTOM_NAV_MODULE__)
    loading.then(module => {
      loaded = module
      if (destroyed || generation !== current || host !== target || !target.isConnected || !media.matches) return
      module.mountBottomNav(target, location.pathname)
      syncVisibility()
    }).catch(() => {
      loading = null
      if (generation === current) remove()
    })
  }
  // The route handler may pushState later in the same click event.
  const afterEvent = () => queueMicrotask(sync)
  const afterFocus = () => queueMicrotask(syncVisibility)
  const observer = new MutationObserver(syncVisibility)
  observer.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["aria-expanded"] })
  media.addEventListener("change", sync)
  document.addEventListener("click", afterEvent)
  window.addEventListener("popstate", afterEvent)
  window.addEventListener("hashchange", afterEvent)
  document.addEventListener("focusin", afterFocus)
  document.addEventListener("focusout", afterFocus)
  viewport?.addEventListener("resize", syncVisibility)

  browser.BrenBottomNav = {
    sync,
    destroy() {
      destroyed = true
      remove()
      observer.disconnect()
      media.removeEventListener("change", sync)
      document.removeEventListener("click", afterEvent)
      window.removeEventListener("popstate", afterEvent)
      window.removeEventListener("hashchange", afterEvent)
      document.removeEventListener("focusin", afterFocus)
      document.removeEventListener("focusout", afterFocus)
      viewport?.removeEventListener("resize", syncVisibility)
    },
  }
  sync()
}
