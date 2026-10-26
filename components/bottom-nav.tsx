"use client"

import { useLayoutEffect } from "react"
import { createRoot, type Root } from "react-dom/client"
import BottomNavBar from "@/components/ui/bottom-nav-bar"

let root: Root | null = null
let mountedHost: HTMLElement | null = null
let renderedPath: string | null = null

function SiteBottomNav({ host, path }: { host: HTMLElement; path: string }) {
  useLayoutEffect(() => {
    host.dataset.bottomNavReady = "true"
    document.body.setAttribute("data-bottom-nav", "")
    return () => {
      delete host.dataset.bottomNavReady
      document.body.removeAttribute("data-bottom-nav")
    }
  }, [host])
  return <BottomNavBar currentPath={path} stickyBottom />
}

export function unmountBottomNav() {
  root?.unmount()
  root = null
  mountedHost = null
  renderedPath = null
}

export function mountBottomNav(host: HTMLElement, path: string) {
  if (!host.isConnected || (host === mountedHost && path === renderedPath)) return
  if (host !== mountedHost) {
    unmountBottomNav()
    mountedHost = host
    root = createRoot(host, { onUncaughtError: () => {
      // The header menu stays available if enhancement cannot render.
      document.body.removeAttribute("data-bottom-nav")
      host.hidden = true
    } })
  }
  renderedPath = path
  root?.render(<SiteBottomNav host={host} path={path} />)
}
