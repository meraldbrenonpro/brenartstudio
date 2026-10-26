"use client";

import * as React from "react";

export interface DotFieldProps extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  /** The headline remains available as HTML for assistive technology and fallback. */
  headline: string;
  eyebrow?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  accent?: string;
  grid?: [number, number];
  fontFamily?: string;
  fontWeight?: number;
  repelRadius?: number;
  scrollScatter?: boolean;
  scrollHint?: { scatter: string; gather: string } | false;
  onReady?: () => void;
  /** First usable canvas frame, or onReady for a static fallback. */
  onFirstFrame?: () => void;
  /** Enhance an existing title without replacing its content or changing its layout. */
  headlineElement?: HTMLElement;
  /** Section whose passage through the viewport scatters the particles. */
  scrollElement?: HTMLElement;
}

export interface DotFieldHandle {
  replay: () => void;
  setScattered: (scattered: boolean) => void;
}

interface EngineControls {
  replay: () => void;
  setScattered: (scattered: boolean) => void;
}

interface TextLine {
  text: string;
  x: number;
  top: number;
  height: number;
  font: string;
  fontSize: number;
  letterSpacing: string;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const flow = (x: number, y: number, time: number) => (
  Math.sin(x * 0.004 + time * 0.7)
  + Math.cos(y * 0.005 - time * 0.5)
  + Math.sin((x + y) * 0.002 + time * 0.3)
) * Math.PI;

function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/** Read the browser's real line breaks instead of approximating them with a second layout. */
function readTextLines(headline: HTMLElement, stageBounds: DOMRect): TextLine[] {
  const lines: TextLine[] = [];
  const walker = document.createTreeWalker(headline, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const parent = node.parentElement;
    if (!parent || !node.textContent?.trim()) continue;
    const css = getComputedStyle(parent);
    if (css.display === "none" || css.visibility === "hidden") continue;
    const fontSize = parseFloat(css.fontSize) || 64;
    const font = `${css.fontStyle} ${css.fontWeight} ${css.fontSize} ${css.fontFamily}`;
    let line: TextLine | null = null;
    // Range rectangles follow wrapping, inline spans, tracking, and the loaded font.
    // Accumulate complete lines to preserve kerning when drawing the text mask.
    for (let index = 0; index < node.textContent.length; index += 1) {
      range.setStart(node, index);
      range.setEnd(node, index + 1);
      const rect = range.getBoundingClientRect();
      if (!rect.width || !rect.height) continue;
      const top = rect.top - stageBounds.top;
      if (!line || Math.abs(line.top - top) > Math.max(2, fontSize * 0.08)) {
        line = {
          text: "", x: rect.left - stageBounds.left, top, height: rect.height,
          font, fontSize, letterSpacing: css.letterSpacing,
        };
        lines.push(line);
      }
      line.text += node.textContent[index];
    }
  }
  range.detach();
  return lines;
}

export const DotField = React.forwardRef<DotFieldHandle, DotFieldProps>(function DotField(
  {
    headline,
    eyebrow,
    description,
    actions,
    accent = "#2458e6",
    grid = [20, 13],
    fontFamily = "inherit",
    fontWeight = 500,
    repelRadius = 120,
    scrollScatter = true,
    scrollHint = { scatter: "Scroll to scatter", gather: "Scroll up to gather" },
    onReady,
    onFirstFrame,
    headlineElement,
    scrollElement,
    className = "",
    style,
    ...rest
  },
  ref,
) {
  const outerRef = React.useRef<HTMLElement>(null);
  const stageRef = React.useRef<HTMLDivElement>(null);
  const ownHeadlineRef = React.useRef<HTMLHeadingElement>(null);
  const dotsRef = React.useRef<HTMLCanvasElement>(null);
  const glowRef = React.useRef<HTMLCanvasElement>(null);
  const hintRef = React.useRef<HTMLSpanElement>(null);
  const controls = React.useRef<EngineControls>({ replay: () => {}, setScattered: () => {} });
  const options = React.useRef({ accent, repelRadius, onReady, onFirstFrame, scrollHint });
  options.current = { accent, repelRadius, onReady, onFirstFrame, scrollHint };

  React.useImperativeHandle(ref, () => ({
    replay: () => controls.current.replay(),
    setScattered: (scattered) => controls.current.setScattered(scattered),
  }), []);

  React.useEffect(() => {
    const outer = outerRef.current;
    const stage = stageRef.current;
    const canvas = dotsRef.current;
    const glow = glowRef.current;
    const title = headlineElement || ownHeadlineRef.current;
    if (!outer || !stage || !canvas || !glow || !title) return;
    const pointerSurface = headlineElement?.parentElement || stage;

    let alive = true;
    let failed = false;
    let intersecting = false;
    let built = false;
    let needsBuild = true;
    let raf = 0;
    let resizeTimer = 0;
    let width = 0;
    let height = 0;
    let count = 0;
    let particles = new Float32Array(0);
    let elapsed = 0;
    let previousTime = 0;
    let foreground = "#171717";
    let readyReported = false;
    let firstDraw = false;
    let scrollProgress = 0;
    let buttonProgress = 0;
    let buttonTarget = 0;
    let previousScatter = 0;
    let kick = 0;
    let frameNumber = 0;
    let minimumFontSize = 48;
    let layoutKey = "";
    const pointer = { x: 0, y: 0, active: false };
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    let reducedMotion = motionQuery.matches;
    let finePointer = pointerQuery.matches;
    let context: CanvasRenderingContext2D | null = null;
    let glowContext: CanvasRenderingContext2D | null = null;

    const restoreTitle = () => {
      title.removeAttribute("data-dot-field-ready");
      if (!headlineElement) title.style.opacity = "";
    };
    const reportReady = () => {
      if (readyReported || !alive) return;
      readyReported = true;
      options.current.onReady?.();
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      previousTime = 0;
    };
    const showFallback = () => {
      failed = true;
      stop();
      restoreTitle();
      canvas.style.visibility = glow.style.visibility = "hidden";
      stage.dataset.dotFieldState = "fallback";
      reportReady();
    };

    try {
      context = canvas.getContext("2d");
      glowContext = glow.getContext("2d");
    } catch {
      showFallback();
    }
    if (!context || !glowContext) {
      showFallback();
      return () => { alive = false; restoreTitle(); };
    }
    const ctx = context;
    const gtx = glowContext;

    function updateScroll() {
      const section = scrollElement || outer;
      if (!section) return;
      scrollProgress = scrollScatter
        ? clamp(-section.getBoundingClientRect().top / Math.max(1, window.innerHeight * 0.7), 0, 1)
        : 0;
      const hint = options.current.scrollHint;
      if (hintRef.current && hint) {
        hintRef.current.textContent = scrollProgress > 0.85 ? hint.gather : hint.scatter;
      }
    }

    function build() {
      if (!stage || !title || failed) return false;
      const bounds = stage.getBoundingClientRect();
      const titleBounds = title.getBoundingClientRect();
      if (bounds.width < 1 || bounds.height < 1 || titleBounds.width < 1 || titleBounds.height < 1) {
        restoreTitle();
        return false;
      }
      const nextWidth = Math.round(bounds.width);
      const nextHeight = Math.round(bounds.height);
      const lines = readTextLines(title, bounds);
      if (!lines.length) throw new Error("Headline has no rendered text");
      const nextLayoutKey = lines.map((line) =>
        [line.text, line.x, line.top, line.height, line.font, line.letterSpacing].join("|"),
      ).join("\n");
      // ResizeObserver sends an initial notification too. Do not turn that into
      // an instant completed intro or repeatedly rebuild an unchanged canvas.
      if (built && nextWidth === width && nextHeight === height && nextLayoutKey === layoutKey) {
        needsBuild = false;
        return true;
      }
      layoutKey = nextLayoutKey;
      const ratio = Math.min(2, window.devicePixelRatio || 1);
      width = nextWidth;
      height = nextHeight;
      for (const target of [canvas, glow]) {
        if (!target) continue;
        target.width = Math.round(width * ratio);
        target.height = Math.round(height * ratio);
      }
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      gtx.setTransform(ratio, 0, 0, ratio, 0, 0);
      foreground = getComputedStyle(title).color || "#171717";

      const mask = document.createElement("canvas");
      mask.width = width;
      mask.height = height;
      const maskContext = mask.getContext("2d", { willReadFrequently: true });
      if (!maskContext) throw new Error("Canvas text sampling unavailable");
      minimumFontSize = Math.min(...lines.map((line) => line.fontSize));
      maskContext.fillStyle = "#000";
      maskContext.textAlign = "left";
      maskContext.textBaseline = "alphabetic";
      for (const line of lines) {
        maskContext.font = line.font;
        // Supported in current browsers; older browsers retain ordinary tracking.
        if ("letterSpacing" in maskContext) {
          maskContext.letterSpacing = line.letterSpacing === "normal" ? "0px" : line.letterSpacing;
        }
        const metrics = maskContext.measureText(line.text);
        const ascent = metrics.fontBoundingBoxAscent || line.fontSize * 0.8;
        const descent = metrics.fontBoundingBoxDescent || line.fontSize * 0.2;
        const baseline = line.top + (line.height - ascent - descent) / 2 + ascent;
        maskContext.fillText(line.text, line.x, baseline);
      }

      const pixels = maskContext.getImageData(0, 0, width, height).data;
      const cap = window.innerWidth <= 760 ? 2200 : 4500;
      const textCap = Math.floor(cap * 0.8);
      const targets: number[] = [];
      const step = Math.max(2, minimumFontSize / 28);
      for (let y = step / 2; y < height; y += step) {
        for (let x = step / 2; x < width; x += step) {
          if (pixels[(Math.floor(y) * width + Math.floor(x)) * 4 + 3] > 100) targets.push(x, y);
        }
      }
      if (!targets.length) throw new Error("Headline mask is empty");
      const availableText = targets.length / 2;
      const textCount = Math.min(textCap, availableText);
      const gx = Math.max(8, grid[0]);
      const gy = Math.max(8, grid[1]);
      const columns = Math.ceil(width / gx) + 1;
      const rows = Math.ceil(height / gy) + 1;
      const cells = columns * rows;
      const backgroundCount = Math.min(cells, cap - textCount);
      count = textCount + backgroundCount;
      const next = new Float32Array(count * 10);
      const seed = Math.round(width * 31 + height * 17 + headline.length * 101);
      const random = seededRandom(seed);
      const ids = Array.from({ length: count }, (_, index) => index);
      for (let index = count - 1; index > 0; index -= 1) {
        const other = Math.floor(random() * (index + 1));
        [ids[index], ids[other]] = [ids[other], ids[index]];
      }
      for (let index = 0; index < count; index += 1) {
        const cell = cells > count
          ? Math.floor(index * cells / count)
          : index < cells ? index : Math.floor(random() * cells);
        const offset = index * 10;
        const hx = (cell % columns) * gx;
        const hy = Math.floor(cell / columns) * gy;
        next[offset] = next[offset + 4] = hx;
        next[offset + 1] = next[offset + 5] = hy;
      }
      const diagonal = Math.max(1, Math.hypot(width, height));
      const scatter = Math.max(scrollProgress, buttonProgress);
      for (let index = 0; index < textCount; index += 1) {
        const offset = ids[index] * 10;
        const targetIndex = Math.floor(index * availableText / textCount) * 2;
        const x = targets[targetIndex];
        const y = targets[targetIndex + 1];
        next[offset + 6] = x;
        next[offset + 7] = y;
        next[offset + 8] = 0.04 + Math.hypot(x - width / 2, y - height / 2) / diagonal * 0.3 + random() * 0.12;
        next[offset + 9] = 1;
        // Responsive layout changes retain the formed headline instead of replaying.
        if (built) {
          next[offset] = x + (next[offset + 4] - x) * scatter;
          next[offset + 1] = y + (next[offset + 5] - y) * scatter;
        }
      }
      particles = next;
      if (built) elapsed = Math.max(elapsed, 2);
      built = true;
      needsBuild = false;
      return true;
    }

    const canRun = () => alive && !failed && !reducedMotion && intersecting && !document.hidden;
    function schedule() {
      if (canRun() && !raf) raf = requestAnimationFrame(draw);
    }

    function draw(now: number) {
      raf = 0;
      if (!canRun()) return;
      try {
        if (needsBuild && !build()) return;
        const seconds = clamp(previousTime ? (now - previousTime) / 1000 : 1 / 60, 1 / 240, 1 / 30);
        previousTime = now;
        elapsed += seconds;
        const dt = seconds * 60;
        const damping = Math.pow(0.82, dt);
        buttonProgress += (buttonTarget - buttonProgress) * (1 - Math.pow(0.94, dt));
        const scatter = clamp(Math.max(scrollProgress, buttonProgress), 0, 1);
        kick = kick * Math.pow(0.93, dt) + Math.abs(scatter - previousScatter) * 6;
        previousScatter = scatter;
        const sweep = ((elapsed * 0.22) % 1.5) - 0.25;
        const radius = finePointer ? Math.max(0, options.current.repelRadius) : 0;
        const radiusSquared = radius * radius;
        const dotRadius = clamp(minimumFontSize / 62, 0.8, 1.25);
        if (++frameNumber % 90 === 0 && title) foreground = getComputedStyle(title).color || foreground;
        ctx.clearRect(0, 0, width, height);
        gtx.clearRect(0, 0, width, height);
        gtx.fillStyle = options.current.accent;
        const p = particles;
        for (let index = 0; index < count; index += 1) {
          const offset = index * 10;
          const isText = p[offset + 9] === 1;
          const local = elapsed - p[offset + 8];
          let targetX = p[offset + 4];
          let targetY = p[offset + 5];
          let strength = 0.045;
          let turbulence = Math.min(0.8, kick);
          if (isText && local > 0) {
            targetX = p[offset + 6] + (targetX - p[offset + 6]) * scatter;
            targetY = p[offset + 7] + (targetY - p[offset + 7]) * scatter;
            strength = Math.min(0.085, 0.035 + local * 0.06);
            turbulence = Math.max(turbulence, Math.max(0, 1 - local * 1.8));
          }
          let ax = (targetX - p[offset]) * strength;
          let ay = (targetY - p[offset + 1]) * strength;
          if (turbulence > 0.01) {
            const angle = flow(p[offset], p[offset + 1], elapsed);
            ax += Math.cos(angle) * turbulence * 1.8;
            ay += Math.sin(angle) * turbulence * 1.8;
          }
          if (pointer.active && radius > 0) {
            const dx = p[offset] - pointer.x;
            const dy = p[offset + 1] - pointer.y;
            const distanceSquared = dx * dx + dy * dy;
            if (distanceSquared < radiusSquared) {
              const distance = Math.sqrt(distanceSquared) || 1;
              const force = (1 - distance / radius) * 4.5;
              ax += dx / distance * force;
              ay += dy / distance * force;
            }
          }
          p[offset + 2] = (p[offset + 2] + ax * dt) * damping;
          p[offset + 3] = (p[offset + 3] + ay * dt) * damping;
          p[offset] += p[offset + 2] * dt;
          p[offset + 1] += p[offset + 3] * dt;
          const x = p[offset];
          const y = p[offset + 1];
          const speed = Math.abs(p[offset + 2]) + Math.abs(p[offset + 3]);
          const gridAlpha = Math.min(0.25, 0.075 + speed * 0.025);
          if (isText) {
            const settle = clamp(local * 1.6, 0, 1);
            const alpha = (0.3 + settle * 0.67) * (1 - scatter) + gridAlpha * scatter;
            const highlight = Math.max(0, 1 - Math.abs(x / width - sweep) * 9) * (1 - scatter);
            ctx.fillStyle = highlight > 0.35 ? options.current.accent : foreground;
            ctx.globalAlpha = alpha;
            const r = dotRadius * (1 - scatter * 0.2);
            ctx.fillRect(x - r, y - r, r * 2, r * 2);
            if (highlight > 0.02) {
              gtx.globalAlpha = highlight * 0.48;
              gtx.fillRect(x - 2, y - 2, 4, 4);
            }
          } else {
            ctx.fillStyle = foreground;
            ctx.globalAlpha = gridAlpha;
            ctx.fillRect(x - 0.65, y - 0.65, 1.3, 1.3);
          }
        }
        ctx.globalAlpha = gtx.globalAlpha = 1;
        if (!firstDraw) {
          // Hand over from the startup gate only when a usable canvas has drawn.
          firstDraw = true;
          if (title) {
            title.setAttribute("data-dot-field-ready", "true");
            if (!headlineElement) title.style.opacity = "0";
          }
          if (canvas && glow) canvas.style.visibility = glow.style.visibility = "visible";
          options.current.onFirstFrame?.();
        }
        if (stage) stage.dataset.dotFieldState = elapsed >= 1.5 ? "ready" : "forming";
        if (elapsed >= 1.5) reportReady();
        schedule();
      } catch {
        showFallback();
      }
    }

    const onScroll = () => { updateScroll(); schedule(); };
    const onPointerMove = (event: PointerEvent) => {
      if (!finePointer || event.pointerType === "touch" || reducedMotion) return;
      const bounds = stage.getBoundingClientRect();
      pointer.x = event.clientX - bounds.left;
      pointer.y = event.clientY - bounds.top;
      pointer.active = true;
    };
    const onPointerLeave = () => { pointer.active = false; };
    const onVisibility = () => { if (document.hidden) stop(); else schedule(); };
    const onPointerPreference = () => {
      finePointer = pointerQuery.matches;
      pointer.active = false;
    };
    const onMotionPreference = () => {
      reducedMotion = motionQuery.matches;
      if (reducedMotion) {
        stop();
        restoreTitle();
        canvas.style.visibility = glow.style.visibility = "hidden";
        stage.dataset.dotFieldState = "reduced";
        reportReady();
      } else {
        firstDraw = false;
        needsBuild = true;
        elapsed = built ? 2 : 0;
        schedule();
      }
    };
    const resize = new ResizeObserver(() => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => { needsBuild = true; schedule(); }, 80);
    });
    const intersection = new IntersectionObserver(([entry]) => {
      intersecting = entry.isIntersecting;
      if (intersecting) { updateScroll(); schedule(); }
      else stop();
    }, { threshold: 0 });

    controls.current = {
      replay: () => {
        if (!alive || failed || reducedMotion) return;
        elapsed = 0;
        buttonProgress = buttonTarget = 0;
        kick = previousScatter = 0;
        readyReported = false;
        built = false;
        needsBuild = true;
        schedule();
      },
      setScattered: (scattered) => { buttonTarget = scattered ? 1 : 0; schedule(); },
    };
    pointerSurface.addEventListener("pointermove", onPointerMove, { passive: true });
    pointerSurface.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    document.addEventListener("visibilitychange", onVisibility);
    motionQuery.addEventListener("change", onMotionPreference);
    pointerQuery.addEventListener("change", onPointerPreference);
    resize.observe(stage);
    resize.observe(title);
    updateScroll();

    // Waiting for the existing site's fonts avoids drawing a mismatched fallback face.
    const fontsReady = document.fonts?.ready || Promise.resolve();
    void fontsReady.then(() => {
      if (!alive || failed) return;
      intersection.observe(stage);
      onMotionPreference();
    });

    return () => {
      alive = false;
      stop();
      window.clearTimeout(resizeTimer);
      resize.disconnect();
      intersection.disconnect();
      pointerSurface.removeEventListener("pointermove", onPointerMove);
      pointerSurface.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("scroll", onScroll, true);
      document.removeEventListener("visibilitychange", onVisibility);
      motionQuery.removeEventListener("change", onMotionPreference);
      pointerQuery.removeEventListener("change", onPointerPreference);
      restoreTitle();
      controls.current = { replay: () => {}, setScattered: () => {} };
    };
  }, [headline, headlineElement, scrollElement, fontFamily, fontWeight, grid[0], grid[1], scrollScatter]);

  const canvasStyle: React.CSSProperties = {
    position: "absolute", inset: 0, width: "100%", height: "100%",
    pointerEvents: "none", visibility: "hidden",
  };
  const field = (
    <div ref={stageRef} className="dot-field-stage" style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <canvas ref={glowRef} aria-hidden="true" className="dot-field-glow" style={{ ...canvasStyle, filter: "blur(6px)", opacity: 0.65 }} />
      <canvas ref={dotsRef} aria-hidden="true" className="dot-field-canvas" style={canvasStyle} />
    </div>
  );

  if (headlineElement) {
    return <div ref={outerRef as React.Ref<HTMLDivElement>} className={`dot-field dot-field-overlay ${className}`} style={style} aria-hidden="true" {...rest}>{field}</div>;
  }

  return (
    <section ref={outerRef} className={`dot-field ${className}`} style={{ position: "relative", width: "100%", ...style }} {...rest}>
      {eyebrow && <div className="dot-field-eyebrow" style={{ marginBottom: 24 }}>{eyebrow}</div>}
      <div className="dot-field-title" style={{ position: "relative" }}>
        <h1 ref={ownHeadlineRef} style={{ margin: 0, fontFamily, fontWeight, fontSize: "clamp(44px, 8vw, 112px)", lineHeight: 1.04, letterSpacing: "-0.045em", overflowWrap: "anywhere" }}>{headline}</h1>
        {field}
      </div>
      {description && <div className="dot-field-description" style={{ marginTop: 28 }}>{description}</div>}
      {actions && <div className="dot-field-actions" style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 24 }}>{actions}</div>}
      {scrollScatter && scrollHint && <div className="dot-field-hint" style={{ marginTop: 32, fontSize: 12 }} aria-hidden="true"><span ref={hintRef}>{scrollHint.scatter}</span></div>}
    </section>
  );
});

export default DotField;
