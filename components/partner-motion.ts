"use client"

import * as React from "react"
import { useReducedMotion, type Transition } from "motion/react"

interface PartnerMotionTokens {
  duration: { instant: number; fast: number; normal: number }
  scale: { press: number }
}

interface PartnerMotionLibrary {
  motionTokens: PartnerMotionTokens
  springs: { snappy: { stiffness: number; damping: number }; gentle: { stiffness: number; damping: number } }
  isLowEnd(): boolean
}

// The browser already exposes the site's shared DOM motion vocabulary. Its
// generator function becomes the string "spring" expected by motion/react.
// These equivalent defaults also cover a failed or slower DOM-motion bundle.
const fallbackTokens: PartnerMotionTokens = {
  duration: { instant: 0.08, fast: 0.18, normal: 0.35 },
  scale: { press: 0.97 },
}
const fallbackSprings = {
  snappy: { stiffness: 625, damping: 50 },
  gentle: { stiffness: 400, damping: 40 },
}

function readMotionLibrary(): PartnerMotionLibrary | undefined {
  if (typeof window === "undefined") return undefined
  return (window as Window & { BrenMotionLib?: PartnerMotionLibrary }).BrenMotionLib
}

function readLowEnd(): boolean {
  if (typeof navigator === "undefined") return true
  const device = navigator as Navigator & { deviceMemory?: number }
  return (device.hardwareConcurrency > 0 && device.hardwareConcurrency <= 4) ||
    (typeof device.deviceMemory === "number" && device.deviceMemory > 0 && device.deviceMemory <= 4)
}

export function shouldAnimatePartner({ reduced = false, lowEnd = false } = {}): boolean {
  return !reduced && !lowEnd
}

export function usePartnerMotion() {
  const reduced = useReducedMotion()
  // The first client frame stays identical to the static, visible fallback.
  const [lowEnd, setLowEnd] = React.useState(true)
  React.useEffect(() => { setLowEnd(readMotionLibrary()?.isLowEnd() ?? readLowEnd()) }, [])
  const library = readMotionLibrary()
  const tokens = library?.motionTokens ?? fallbackTokens
  const source = library?.springs ?? fallbackSprings
  const springs = {
    snappy: { type: "spring", stiffness: source.snappy.stiffness, damping: source.snappy.damping } as Transition,
    gentle: { type: "spring", stiffness: source.gentle.stiffness, damping: source.gentle.damping } as Transition,
  }
  const animate = shouldAnimatePartner({ reduced: reduced !== false, lowEnd })
  return { tokens, springs, animate, reduced: reduced !== false }
}
