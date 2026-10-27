"use client"

import * as React from "react"
import { createRoot, type Root } from "react-dom/client"
import { installHeroStartup } from "@/lib/hero-startup"
import { DotField } from "@/components/ui/dot-field"

let root: Root | null = null
let mountedHost: HTMLElement | null = null

export function unmountHero() {
  root?.unmount()
  root = null
  mountedHost = null
}

export function mountHero() {
  const hero = document.querySelector<HTMLElement>('[data-page="accueil"] .bh-hero')
  const headline = hero?.querySelector<HTMLElement>('[data-dot-field-headline]')
  const host = hero?.querySelector<HTMLElement>('[data-dot-field-root]')
  if (!hero || !headline || !host || !hero.getClientRects().length) return
  if (host === mountedHost && root) return
  unmountHero()
  const styles = getComputedStyle(headline)
  mountedHost = host
  const startup = installHeroStartup("")
  root = createRoot(host, { onUncaughtError: () => startup.fallback() })
  root.render(
    <DotField
      headline={headline.textContent?.replace(/\s+/g, " ").trim() || "Votre marque. Une vraie personnalité."}
      headlineElement={headline}
      scrollElement={hero}
      accent="#2d46f5"
      fontFamily={styles.fontFamily}
      fontWeight={Number(styles.fontWeight) || 600}
      repelRadius={110}
      compactIntro={window.matchMedia("(max-width: 760px)").matches}
      scrollScatter
      scrollHint={false}
      onFirstFrame={() => startup.settle()}
      onReady={() => startup.settle()}
      className="bh-dot-field"
    />,
  )
}
