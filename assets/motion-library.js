import { animate } from 'motion/mini';
import { spring } from 'motion';

// One vocabulary shared by the page choreography and every interaction.
export const motionTokens = Object.freeze({
  duration: { instant: 0.08, fast: 0.18, normal: 0.35, slow: 0.6, crawl: 1 },
  easing: { smooth: [0.22, 1, 0.36, 1], sharp: [0.4, 0, 0.2, 1] },
  distance: { xs: 4, sm: 8, md: 16, lg: 24, xl: 48 },
  scale: { subtle: 0.98, press: 0.95, pop: 1.04 },
});
export const springs = Object.freeze({
  snappy: { type: spring, stiffness: 300, damping: 30 },
  gentle: { type: spring, stiffness: 120, damping: 14 },
  bouncy: { type: spring, stiffness: 400, damping: 10 },
  instant: { type: spring, stiffness: 600, damping: 35 },
  release: { type: spring, stiffness: 200, damping: 20, restDelta: 0.001 },
});
export const isLowEnd = () => typeof navigator !== 'undefined' && (
  (navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 4) ||
  (navigator.deviceMemory > 0 && navigator.deviceMemory <= 4)
);

// The site is static HTML: use Motion's DOM entry point, without a React runtime.
if (typeof window !== 'undefined') {
  window.BrenMotionLib = Object.freeze({ animate, motionTokens, springs, isLowEnd });
}
