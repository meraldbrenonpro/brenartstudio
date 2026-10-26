// The configurator is optional enhancement: its complete static quote remains
// available while this small controller waits for an active, visible host.
declare const __PARTNER_MODULE__: string

interface PartnerModule {
  mountPartner(host: HTMLElement): void
  unmountPartner(): void
}
interface PartnerController {
  sync(page: string): void
  destroy(): void
}

const partnerBrowser = window as Window & { BrenPartner?: PartnerController }
partnerBrowser.BrenPartner?.destroy()
let moduleReady: PartnerModule | null = null
let moduleLoading: Promise<PartnerModule> | null = null
let observer: IntersectionObserver | null = null
let activeHost: HTMLElement | null = null
let generation = 0

const syncPartner = (page: string) => {
  const allowed = page === "accueil" || page === "services"
  const section = allowed ? document.querySelector<HTMLElement>(`[data-page="${page}"]`) : null
  const host = section?.querySelector<HTMLElement>("[data-partner-configurator]") ?? null
  if (host && host === activeHost && host.isConnected) return
  const current = ++generation
  observer?.disconnect()
  observer = null
  moduleReady?.unmountPartner()
  activeHost = null
  if (!host || !host.getClientRects().length) return
  activeHost = host

  const activate = () => {
    if (current !== generation || host !== activeHost) return
    observer?.disconnect()
    observer = null
    moduleLoading ??= import(__PARTNER_MODULE__)
    moduleLoading.then((module) => {
      moduleReady = module
      if (current === generation && host === activeHost && host.isConnected && host.getClientRects().length) module.mountPartner(host)
    }).catch(() => {
      // Keep the visible, functional HTML quote if loading or enhancement fails.
      moduleLoading = null
    })
  }
  if (!("IntersectionObserver" in window)) activate()
  else {
    observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) activate()
    }, { threshold: 0.01 })
    observer.observe(host)
  }
}

const startPartner = () => {
  const path = location.pathname.replace(/\/+$/, "") || "/"
  syncPartner(path === "/" ? "accueil" : path === "/services" ? "services" : "")
}

partnerBrowser.BrenPartner = {
  sync: syncPartner,
  destroy() {
    generation++
    observer?.disconnect()
    observer = null
    moduleReady?.unmountPartner()
    activeHost = null
    document.removeEventListener("DOMContentLoaded", startPartner)
  },
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", startPartner, { once: true })
else startPartner()

export {}
