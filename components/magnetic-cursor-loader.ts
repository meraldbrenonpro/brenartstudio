// Shared by the existing hero loader, including the frozen case-study documents.
// Only a mouse-capable browser loads the small DOM enhancement.
declare const __MAGNETIC_CURSOR_MODULE__: string

interface CursorController { reset(): void; destroy(): void }
interface CursorModule { createMagneticCursor(element: HTMLElement, options?: Record<string, unknown>): CursorController }
interface CursorBrowser extends Window {
  BrenCursor?: CursorController
  BrenMotionLib?: { isLowEnd(): boolean }
}

export function startMagneticCursor() {
  const browser = window as CursorBrowser
  browser.BrenCursor?.destroy()
  const fine = matchMedia('(hover: hover) and (pointer: fine)')
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  const forced = matchMedia('(forced-colors: active)')
  const preferences = [fine, reduced, forced]
  let modulePromise: Promise<CursorModule> | null = null
  let controller: CursorController | null = null
  let element: HTMLDivElement | null = null
  let generation = 0
  let destroyed = false

  const eligible = () => !document.hidden && fine.matches && !reduced.matches && !forced.matches &&
    !browser.BrenMotionLib?.isLowEnd()
  const release = () => {
    controller?.destroy()
    controller = null
    element?.remove()
    element = null
  }
  const reconcile = () => {
    const current = ++generation
    if (destroyed || !eligible()) { release(); return }
    if (controller || !document.body) return
    modulePromise ??= import(__MAGNETIC_CURSOR_MODULE__)
    modulePromise.then(module => {
      if (destroyed || current !== generation || !eligible() || controller) return
      const overlay = document.createElement('div')
      overlay.className = 'br-magnetic-cursor'
      overlay.setAttribute('aria-hidden', 'true')
      document.body.append(overlay)
      element = overlay
      try {
        controller = module.createMagneticCursor(overlay, {
          cursorSize: 32, magneticFactor: 0.18, lerpAmount: 0.18, hoverPadding: 6,
          cursorColor: '#ffffff', blendMode: 'exclusion', contrastBoost: 1,
          preserveAccentColor: '#2d46f5',
          magneticSelector: '[data-magnetic], .rd-button, .ct-button, .ct-text-link, .rd-nav-links a, .rd-brand, .rd-menu-toggle, .partner-cta, .partner-step, .ct-form-submit',
          magneticMoveSelector: '[data-magnetic], .bh-hero-actions .rd-button, .ct-page-cta .ct-button, .partner-cta',
        })
      } catch {
        release()
        // The native cursor remains available when enhancement cannot start.
      }
    }).catch(() => { modulePromise = null })
  }
  const reset = () => controller?.reset()
  const onVisibility = () => { if (document.hidden) reset(); else reconcile() }
  browser.BrenCursor = {
    reset,
    destroy() {
      if (destroyed) return
      destroyed = true
      generation++
      release()
      for (const preference of preferences) preference.removeEventListener('change', reconcile)
      document.removeEventListener('DOMContentLoaded', reconcile)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', reset)
      window.removeEventListener('pageshow', reconcile)
    },
  }
  for (const preference of preferences) preference.addEventListener('change', reconcile)
  document.addEventListener('visibilitychange', onVisibility)
  window.addEventListener('pagehide', reset)
  window.addEventListener('pageshow', reconcile)
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', reconcile, { once: true })
  else reconcile()
}
