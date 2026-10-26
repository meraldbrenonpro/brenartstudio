/** Optional pointer enhancement. Movable controls receive a bounded translate;
 * optional accent compensation is temporary and fully restored on release. */
export interface MagneticCursorOptions {
  magneticFactor?: number
  lerpAmount?: number
  hoverPadding?: number
  hoverAttribute?: string
  magneticSelector?: string
  magneticMoveSelector?: string
  cursorSize?: number
  cursorColor?: string
  /** Preserve the site accent under white exclusion blending on controls. */
  preserveAccentColor?: string
  blendMode?: "difference" | "exclusion" | "normal" | "screen" | "overlay"
  shape?: "circle" | "square" | "rounded-square"
  /** Compatibility prop: actual touch pointers always retain native controls. */
  disableOnTouch?: boolean
  speedMultiplier?: number
  maxScaleX?: number
  maxScaleY?: number
  contrastBoost?: number
}

interface SpringValue {
  set(value: number, transition?: unknown): void
  stop(): void
}
interface MotionLibrary {
  createSpringValue(initial: number, update: (value: number) => void, complete?: (target: number) => void): SpringValue
  springs?: { gentle?: unknown; release?: unknown }
  motionTokens?: { duration?: { fast?: number } }
}
interface MoveState {
  node: HTMLElement
  original: string
  priority: string
  x: number
  y: number
  targetX: number
  targetY: number
  doneX: boolean
  doneY: boolean
  releasing: boolean
  stopped: boolean
  springX?: SpringValue
  springY?: SpringValue
}

interface CursorOwner { active: boolean; previous?: CursorOwner }
const cursorOwners = new WeakMap<Document, CursorOwner>()

const bounded = (value: number | undefined, fallback: number, min: number, max: number) =>
  typeof value === "number" && Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback
const nativeSelector = 'input,textarea,select,option,[contenteditable]:not([contenteditable="false"]),iframe,video,audio,[role="textbox"],[role="slider"],[data-cursor="text"],[disabled],[aria-disabled="true"],[inert],[data-no-magnetic]'
const textSelector = "p,h1,h2,h3,h4,h5,h6,blockquote,label"
const ownedStyles = ["position", "top", "left", "z-index", "pointer-events", "opacity", "visibility", "background-color", "mix-blend-mode", "width", "height", "border-radius", "transform", "transform-origin", "will-change", "backdrop-filter", "-webkit-backdrop-filter"]

/** The caller owns appending/removing `element`, and can share this controller
 * between an ordinary HTML bootstrap and a React wrapper. Safe to import in SSR. */
export function createMagneticCursor(element: HTMLElement, options: MagneticCursorOptions = {}) {
  const doc = element.ownerDocument
  const win = doc?.defaultView
  if (!win || !doc.documentElement || typeof win.matchMedia !== "function") {
    return { reset() {}, destroy() {} }
  }
  const root = doc.documentElement
  const previousRoot = root.getAttribute("data-br-cursor")
  const previousState = element.getAttribute("data-br-cursor-state")
  const previousTarget = element.getAttribute("data-br-cursor-target")
  const savedStyles = ownedStyles.map(name => [name, element.style.getPropertyValue(name), element.style.getPropertyPriority(name)])
  const size = bounded(options.cursorSize, 24, 4, 96)
  const lerp = bounded(options.lerpAmount, .1, .02, 1)
  const padding = bounded(options.hoverPadding, 12, 0, 24)
  const factor = bounded(options.magneticFactor, .2, 0, .6)
  const speedMultiplier = bounded(options.speedMultiplier, .02, 0, .1)
  const maxScaleX = bounded(options.maxScaleX, 1, 0, 1)
  const maxScaleY = bounded(options.maxScaleY, .3, 0, .8)
  const contrast = bounded(options.contrastBoost, 1, 1, 2)
  const color = options.cursorColor || "white"
  const blend = options.blendMode || "exclusion"
  const accentHex = /^#([0-9a-f]{6})$/i.exec(options.preserveAccentColor || "")?.[1]
  const accentRgb = accentHex && blend === "exclusion" && /^(?:white|#fff|#ffffff)$/i.test(color)
    ? [0, 2, 4].map(offset => parseInt(accentHex.slice(offset, offset + 2), 16)) : null
  let restoreAccent: (() => void) | null = null
  const baseRadius = options.shape === "square" ? 0 : options.shape === "rounded-square" ? Math.min(8, size / 2) : size / 2
  const attribute = /^[a-zA-Z_][\w:.-]*$/.test(options.hoverAttribute || "") ? options.hoverAttribute! : "data-magnetic"
  const selector = options.magneticSelector || `[${attribute}]`
  const moveSelector = options.magneticMoveSelector || `[${attribute}]`
  const fine = win.matchMedia("(hover: hover) and (pointer: fine)")
  const coarse = win.matchMedia("(pointer: coarse)")
  const reduced = win.matchMedia("(prefers-reduced-motion: reduce)")
  const forced = win.matchMedia("(forced-colors: active)")
  const queries = [fine, coarse, reduced, forced]
  const css = (win as Window & { CSS?: { supports(property: string, value: string): boolean } }).CSS
  const supported = !!css?.supports("mix-blend-mode", blend)
  const library = (win as Window & { BrenMotionLib?: MotionLibrary }).BrenMotionLib
  const geometryTime = Math.max(40, (library?.motionTokens?.duration?.fast || .18) * 1000 / 3)
  const moves = new Map<HTMLElement, MoveState>()
  const listeners: Array<[EventTarget, string, EventListener, AddEventListenerOptions | boolean | undefined]> = []
  let destroyed = false
  let failed = false
  let ownsRoot = false
  let rootBeforeActivation = previousRoot
  const owner: CursorOwner = { active: false }
  let seen = false
  let frame = 0
  let lastTime = 0
  let pointerX = 0
  let pointerY = 0
  let hit: Element | null = null
  let magnetic: HTMLElement | null = null
  let bounds: DOMRect | null = null
  let mode = "hidden"
  const current = { x: 0, y: 0, width: size, height: size, radius: baseRadius, angle: 0, scaleX: 1, scaleY: 1 }

  const write = (name: string, value: string) => element.style.setProperty(name, value)
  write("position", "fixed"); write("top", "0px"); write("left", "0px")
  write("z-index", "10000"); write("pointer-events", "none")
  write("opacity", "0"); write("visibility", "hidden")
  write("background-color", color); write("mix-blend-mode", blend)
  write("width", `${size}px`); write("height", `${size}px`)
  write("border-radius", `${baseRadius}px`); write("transform-origin", "center")
  write("will-change", "transform,width,height,border-radius")
  write("backdrop-filter", contrast === 1 ? "none" : `contrast(${contrast})`)
  write("-webkit-backdrop-filter", contrast === 1 ? "none" : `contrast(${contrast})`)
  element.setAttribute("data-br-cursor-state", "hidden")

  function allowed() {
    return !destroyed && !failed && supported && element.isConnected && !doc.hidden &&
      fine.matches && !coarse.matches && !reduced.matches && !forced.matches && !doc.fullscreenElement
  }
  function closest(target: Element | null, query: string) {
    try { return target?.closest(query) as HTMLElement | null } catch { return null }
  }
  function setMode(next: string) {
    if (next === mode) return
    mode = next
    element.setAttribute("data-br-cursor-state", next)
  }
  function restoreRoot() {
    if (!ownsRoot) return
    owner.active = false
    if (cursorOwners.get(doc) === owner) {
      const visited = new Set<CursorOwner>()
      let previous = owner.previous
      while (previous && !previous.active && !visited.has(previous)) {
        visited.add(previous); previous = previous.previous
      }
      if (previous?.active) cursorOwners.set(doc, previous)
      else {
        cursorOwners.delete(doc)
        if (root.getAttribute("data-br-cursor") === "active") {
          // A prior controller which has since reset cannot leave the OS pointer hidden.
          const restore = rootBeforeActivation === "active" && owner.previous ? null : rootBeforeActivation
          if (restore === null) root.removeAttribute("data-br-cursor")
          else root.setAttribute("data-br-cursor", restore)
        }
      }
    }
    ownsRoot = false
  }
  function restoreMove(state: MoveState) {
    if (state.stopped) return
    state.stopped = true
    state.springX?.stop(); state.springY?.stop()
    if (state.original) state.node.style.setProperty("translate", state.original, state.priority)
    else state.node.style.removeProperty("translate")
    moves.delete(state.node)
  }
  function reset() {
    if (destroyed) return
    clearAccent()
    seen = false; hit = null; magnetic = null; bounds = null; lastTime = 0
    win!.cancelAnimationFrame(frame); frame = 0
    moves.forEach(restoreMove)
    try { write("opacity", "0"); write("visibility", "hidden") } finally { restoreRoot() }
    setMode("hidden")
    element.removeAttribute("data-br-cursor-target")
  }
  function schedule() {
    if (!frame && seen && allowed()) frame = win!.requestAnimationFrame(tick)
  }
  function moveControl(node: HTMLElement) {
    if (!library?.createSpringValue || !css?.supports("translate", "1px 1px") || !closest(node, moveSelector)) return null
    const cached = moves.get(node)
    if (cached) { cached.releasing = false; return cached }
    const original = node.style.getPropertyValue("translate")
    const computed = win!.getComputedStyle(node).getPropertyValue("translate")
    // A pre-existing translation belongs to its component, and is left intact.
    if ((original && original !== "none") || (computed && computed !== "none")) return null
    const state: MoveState = {
      node, original, priority: node.style.getPropertyPriority("translate"), x: 0, y: 0,
      targetX: 0, targetY: 0, doneX: true, doneY: true, releasing: false, stopped: false,
    }
    const apply = () => {
      if (destroyed || state.stopped || !node.isConnected) { restoreMove(state); return }
      node.style.setProperty("translate", `${state.x.toFixed(3)}px ${state.y.toFixed(3)}px`)
      schedule()
    }
    const complete = (axis: "X" | "Y") => {
      state[axis === "X" ? "doneX" : "doneY"] = true
      if (state.releasing && state.doneX && state.doneY) restoreMove(state)
    }
    state.springX = library.createSpringValue(0, value => { state.x = value; apply() }, () => complete("X"))
    state.springY = library.createSpringValue(0, value => { state.y = value; apply() }, () => complete("Y"))
    moves.set(node, state)
    return state
  }
  function setMove(state: MoveState, x: number, y: number) {
    if (Math.abs(state.targetX - x) > .01) {
      state.targetX = x; state.doneX = false
      state.springX?.set(x, state.releasing ? library?.springs?.release : library?.springs?.gentle)
    }
    if (Math.abs(state.targetY - y) > .01) {
      state.targetY = y; state.doneY = false
      state.springY?.set(y, state.releasing ? library?.springs?.release : library?.springs?.gentle)
    }
  }
  function clearAccent() {
    restoreAccent?.()
    restoreAccent = null
  }
  function preserveAccent(node: HTMLElement | null) {
    if (!node || !accentRgb) return
    const computed = win!.getComputedStyle(node)
    const matchesAccent = (property: string) => {
      const values = computed.getPropertyValue(property).match(/[\d.]+/g)?.map(Number)
      return !!values && values.length >= 3 && (values.length < 4 || values[3] >= .99) &&
        Math.hypot(...accentRgb.map((channel, index) => channel - values[index])) < 70
    }
    const slots = [
      matchesAccent("color") ? "foreground" : "",
      matchesAccent("background-color") ? "background" : "",
      matchesAccent("border-top-color") ? "border" : "",
    ].filter(Boolean)
    if (!slots.length) return
    const attributeBefore = node.getAttribute("data-br-cursor-accent")
    const sourceBefore = node.style.getPropertyValue("--br-cursor-accent-source")
    const priorityBefore = node.style.getPropertyPriority("--br-cursor-accent-source")
    const transitionBefore = node.style.getPropertyValue("transition")
    const transitionPriority = node.style.getPropertyPriority("transition")
    // Compensation must be instantaneous; an eased source colour would briefly
    // expose its complement and could be sampled on a rapid re-entry.
    node.style.setProperty("transition", "none", "important")
    restoreAccent = () => {
      if (attributeBefore === null) node.removeAttribute("data-br-cursor-accent")
      else node.setAttribute("data-br-cursor-accent", attributeBefore)
      if (sourceBefore) node.style.setProperty("--br-cursor-accent-source", sourceBefore, priorityBefore)
      else node.style.removeProperty("--br-cursor-accent-source")
      try { win!.getComputedStyle(node).getPropertyValue("color") } finally {
        if (transitionBefore) node.style.setProperty("transition", transitionBefore, transitionPriority)
        else node.style.removeProperty("transition")
      }
    }
    node.style.setProperty("--br-cursor-accent-source", `rgb(${accentRgb.map(channel => 255 - channel).join(",")})`)
    node.setAttribute("data-br-cursor-accent", slots.join(" "))
  }
  function releaseTarget() {
    clearAccent()
    if (!magnetic) return
    const previous = moves.get(magnetic)
    if (previous) {
      previous.releasing = true
      setMove(previous, 0, 0)
      if (previous.doneX && previous.doneY) restoreMove(previous)
    }
    magnetic = null; bounds = null
    element.removeAttribute("data-br-cursor-target")
  }
  function tick(time: number) {
    frame = 0
    if (!seen || !allowed()) { reset(); return }
    try {
      const target = hit?.isConnected ? hit : null
      if (!target || closest(target, nativeSelector)) { reset(); return }
      const selected = closest(target, selector)
      if (selected !== magnetic) {
        releaseTarget()
        magnetic = selected
        preserveAccent(selected)
        bounds = selected?.getBoundingClientRect() || null
        // A control still returning from an earlier hover includes our offset.
        const existing = selected && moves.get(selected)
        if (bounds && existing) bounds = new win!.DOMRect(bounds.x - existing.x, bounds.y - existing.y, bounds.width, bounds.height)
        if (selected) element.setAttribute("data-br-cursor-target", selected.tagName.toLowerCase())
      }
      const dt = Math.max(1, Math.min(48, lastTime ? time - lastTime : 1000 / 60))
      lastTime = time
      const alpha = 1 - Math.pow(1 - lerp, dt / (1000 / 60))
      const shapeAlpha = 1 - Math.exp(-dt / geometryTime)
      let x = pointerX, y = pointerY, width = size, height = size, radius = baseRadius
      let nextMode = "free"
      if (magnetic && bounds && bounds.width > 0 && bounds.height > 0) {
        const state = moveControl(magnetic)
        if (state) setMove(state,
          Math.max(-8, Math.min(8, (pointerX - bounds.left - bounds.width / 2) * factor)),
          Math.max(-8, Math.min(8, (pointerY - bounds.top - bounds.height / 2) * factor)))
        x = bounds.left + bounds.width / 2 + (state?.x || 0)
        y = bounds.top + bounds.height / 2 + (state?.y || 0)
        width = bounds.width + padding * 2; height = bounds.height + padding * 2
        const corner = parseFloat(win!.getComputedStyle(magnetic).borderTopLeftRadius) || 0
        radius = Math.min(width / 2, height / 2, corner + padding)
        nextMode = "magnetic"
      } else if (!closest(target, "a,button,summary") && (closest(target, textSelector) || target.tagName === "SPAN")) {
        width = 3; height = size; radius = 2; nextMode = "text"
      }
      setMode(nextMode)
      const previousX = current.x, previousY = current.y
      current.x += (x - current.x) * alpha; current.y += (y - current.y) * alpha
      const dx = current.x - previousX, dy = current.y - previousY
      const speed = Math.hypot(dx, dy) * (1000 / 60) / dt * speedMultiplier
      const stretchX = nextMode === "free" ? 1 + Math.min(maxScaleX, speed) : 1
      const stretchY = nextMode === "free" ? 1 - Math.min(maxScaleY, speed) : 1
      const angle = nextMode === "free" && speed > .005 ? Math.atan2(dy, dx) * 180 / Math.PI : 0
      const angleDelta = (((angle - current.angle) % 360 + 540) % 360) - 180
      current.angle += angleDelta * shapeAlpha
      current.scaleX += (stretchX - current.scaleX) * shapeAlpha
      current.scaleY += (stretchY - current.scaleY) * shapeAlpha
      current.width += (width - current.width) * shapeAlpha
      current.height += (height - current.height) * shapeAlpha
      current.radius += (radius - current.radius) * shapeAlpha
      write("width", `${current.width.toFixed(3)}px`); write("height", `${current.height.toFixed(3)}px`)
      write("border-radius", `${current.radius.toFixed(3)}px`)
      write("transform", `translate3d(${current.x.toFixed(3)}px,${current.y.toFixed(3)}px,0) translate(-50%,-50%) rotate(${current.angle.toFixed(3)}deg) scale(${current.scaleX.toFixed(4)},${current.scaleY.toFixed(4)})`)
      write("visibility", "visible"); write("opacity", "1")
      const visible = win!.getComputedStyle(element)
      if (visible.display !== "none" && visible.visibility !== "hidden" && Number(visible.opacity) > 0) {
        if (!ownsRoot) {
          rootBeforeActivation = root.getAttribute("data-br-cursor")
          owner.previous = cursorOwners.get(doc)
          owner.active = true
          cursorOwners.set(doc, owner)
        }
        if (root.getAttribute("data-br-cursor") !== "active") root.setAttribute("data-br-cursor", "active")
        ownsRoot = true
      } else restoreRoot()
      const settled = Math.abs(x - current.x) < .08 && Math.abs(y - current.y) < .08 &&
        Math.abs(width - current.width) < .08 && Math.abs(height - current.height) < .08 && Math.abs(radius - current.radius) < .08 &&
        Math.abs(current.scaleX - 1) < .002 && Math.abs(current.scaleY - 1) < .002 && Math.abs(angleDelta) < .1
      if (!settled) schedule()
      else lastTime = 0
    } catch {
      failed = true
      reset()
    }
  }
  function onPointer(event: Event) {
    const pointer = event as PointerEvent
    if ((pointer.pointerType && pointer.pointerType !== "mouse") || !allowed()) { reset(); return }
    if (!Number.isFinite(pointer.clientX) || !Number.isFinite(pointer.clientY) ||
      pointer.clientX < 0 || pointer.clientY < 0 || pointer.clientX > win!.innerWidth || pointer.clientY > win!.innerHeight) { reset(); return }
    const node = pointer.target as Element | null
    const target = typeof node?.closest === "function" ? node : node?.parentElement || null
    const selection = win!.getSelection?.()
    if (!target || closest(target, nativeSelector) || (selection && !selection.isCollapsed)) { reset(); return }
    pointerX = pointer.clientX; pointerY = pointer.clientY; hit = target
    if (!seen) {
      Object.assign(current, { x: pointerX, y: pointerY, width: size, height: size, radius: baseRadius, angle: 0, scaleX: 1, scaleY: 1 })
      seen = true
    }
    schedule()
  }
  function onExit(event: Event) {
    if (event.type === "pointerout" && (event as PointerEvent).relatedTarget) return
    reset()
  }
  function listen(target: EventTarget, name: string, callback: EventListener, options?: AddEventListenerOptions | boolean) {
    target.addEventListener(name, callback, options)
    listeners.push([target, name, callback, options])
  }
  listen(win, "pointermove", onPointer, { passive: true })
  listen(win, "pointerup", onPointer, { passive: true })
  listen(win, "pointercancel", reset)
  listen(doc, "pointerover", onPointer, { passive: true })
  listen(doc, "pointerout", onExit, { passive: true })
  listen(doc, "pointerleave", onExit)
  listen(win, "blur", reset)
  listen(win, "resize", reset, { passive: true })
  listen(doc, "scroll", reset, { passive: true, capture: true })
  listen(doc, "visibilitychange", reset)
  listen(doc, "fullscreenchange", reset)
  listen(doc, "keydown", reset)
  listen(doc, "selectstart", reset)
  listen(doc, "dragstart", reset)
  queries.forEach(query => {
    if (typeof query.addEventListener === "function") listen(query, "change", reset)
    else query.addListener(reset)
  })

  return {
    reset,
    destroy() {
      if (destroyed) return
      reset(); destroyed = true
      listeners.forEach(([target, name, callback, options]) => target.removeEventListener(name, callback, options))
      queries.forEach(query => { if (typeof query.addEventListener !== "function") query.removeListener(reset) })
      savedStyles.forEach(([name, value, priority]) => {
        if (value) element.style.setProperty(name, value, priority)
        else element.style.removeProperty(name)
      })
      if (previousState === null) element.removeAttribute("data-br-cursor-state")
      else element.setAttribute("data-br-cursor-state", previousState)
      if (previousTarget === null) element.removeAttribute("data-br-cursor-target")
      else element.setAttribute("data-br-cursor-target", previousTarget)
    },
  }
}
