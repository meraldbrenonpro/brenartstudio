import { animate } from 'motion/mini';
import { spring } from 'motion';

// One vocabulary shared by the page choreography and every interaction.
export const motionTokens = Object.freeze({
  duration: { instant: 0.08, exit: 0.12, fast: 0.18, normal: 0.35, slow: 0.45, crawl: 1 },
  easing: { smooth: [0.22, 1, 0.36, 1], sharp: [0.4, 0, 0.2, 1] },
  distance: { xs: 4, sm: 8, md: 16, lg: 24, xl: 48 },
  scale: { subtle: 0.97, press: 0.97, pop: 1 },
  hero: { stagger: 0.045, compactStagger: 0.03 },
  portfolio: { recession: 0.045, shift: 16, overlap: 0.85, introScale: 0.94, maxParallax: 10, captionThreshold: 0.6 },
});
export const springs = Object.freeze({
  // Damping = 2 * sqrt(stiffness): every resting UI spring is critical.
  snappy: { type: spring, stiffness: 625, damping: 50 },
  gentle: { type: spring, stiffness: 400, damping: 40 },
  // Retained for consumers of the original vocabulary; no decorative bounce.
  bouncy: { type: spring, stiffness: 400, damping: 40 },
  instant: { type: spring, stiffness: 1600, damping: 80 },
  release: { type: spring, stiffness: 625, damping: 50 },
});

// Interactive values keep their position AND velocity when a new input arrives.
// The same Motion generator powers the native entrance springs; this small RAF
// adapter lets a button or menu reverse before its preceding spring has settled.
export function createSpringValue(initial, update, complete = () => {}) {
  let value = initial;
  let target = initial;
  let velocity = 0;
  let started = 0;
  let generator = null;
  let frame = 0;
  const now = () => performance.now();
  const sample = (time) => {
    if (!generator) return;
    const elapsed = Math.max(0, time - started);
    const state = generator.next(elapsed);
    value = state.value;
    velocity = state.done ? 0 : generator.velocity(elapsed);
    if (state.done) generator = null;
  };
  const tick = (time) => {
    frame = 0;
    sample(time);
    update(value);
    if (generator) frame = window.requestAnimationFrame(tick);
    else complete(target);
  };
  return {
    set(next, transition = springs.snappy) {
      const time = now();
      sample(time);
      target = next;
      started = time;
      generator = spring({
        ...transition,
        keyframes: [value, target], velocity,
        restSpeed: 0.001, restDelta: 0.0001,
      });
      update(value);
      if (!frame) frame = window.requestAnimationFrame(tick);
    },
    jump(next) {
      window.cancelAnimationFrame(frame);
      frame = 0;
      generator = null;
      value = target = next;
      velocity = 0;
      update(value);
      complete(target);
    },
    stop() {
      sample(now());
      window.cancelAnimationFrame(frame);
      frame = 0;
      generator = null;
    },
    get value() { sample(now()); return value; },
    get velocity() { sample(now()); return velocity; },
  };
}
export const isLowEnd = () => typeof navigator !== 'undefined' && (
  (navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 4) ||
  (navigator.deviceMemory > 0 && navigator.deviceMemory <= 4)
);

// The site is static HTML: use Motion's DOM entry point, without a React runtime.
if (typeof window !== 'undefined') {
  window.BrenMotionLib = Object.freeze({ animate, motionTokens, springs, createSpringValue, isLowEnd });
}
