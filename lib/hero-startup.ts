export interface HeroStartup {
  prepare(): boolean
  canMount(): boolean
  settle(): void
  fallback(): void
  leave(): void
}

/** Shared by the pre-paint head script, deferred loader and optional canvas. */
export function installHeroStartup(moduleUrl: string): HeroStartup {
  const browser = window as Window & { BrenHeroStartup?: HeroStartup }
  if (browser.BrenHeroStartup) return browser.BrenHeroStartup
  const html = document.documentElement
  let state: "idle" | "pending" | "ready" | "fallback" = "idle"
  let timer = 0
  let preloaded = false
  const clear = () => {
    window.clearTimeout(timer)
    timer = 0
    html.removeAttribute("data-hero-startup")
  }
  const startup: HeroStartup = {
    prepare() {
      if (state === "fallback") return false
      if (state !== "idle") return true
      const staticTitle = window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
        window.matchMedia("(forced-colors: active)").matches
      if (staticTitle) { state = "ready"; return true }
      state = "pending"
      html.setAttribute("data-hero-startup", "pending")
      // Bound the wait. A late download must never replace the restored title.
      timer = window.setTimeout(() => startup.fallback(), 1800)
      if (!preloaded) {
        preloaded = true
        const preload = document.createElement("link")
        preload.rel = "modulepreload"
        preload.href = moduleUrl
        document.head.append(preload)
      }
      return true
    },
    canMount() { return state !== "fallback" },
    settle() {
      if (state === "fallback") return
      clear()
      state = "ready"
    },
    fallback() {
      if (state === "fallback") return
      clear()
      state = "fallback"
      window.dispatchEvent(new Event("bren:hero-fallback"))
    },
    leave() {
      clear()
      state = "idle"
    },
  }
  browser.BrenHeroStartup = startup
  return startup
}
