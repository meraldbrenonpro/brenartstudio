import * as React from "react"
import { GlassFilter } from "@/components/ui/liquid-glass-button"

// The existing navigation spring owns this surface's position and dimensions.
// Keep it separate from button transforms, including reduced-motion resets.
export function LiquidNavigationPill() {
  return (
    <>
      <span
        className="liquid-glass-navpill"
        data-bs-navpill="1"
        data-glass-refraction=""
        aria-hidden="true"
        style={{ "--liquid-filter": 'url("#liquid-glass-navigation")' } as React.CSSProperties}
      >
        <span className="liquid-glass-backdrop" />
        <span className="liquid-glass-rim" />
      </span>
      <GlassFilter id="liquid-glass-navigation" />
    </>
  )
}
