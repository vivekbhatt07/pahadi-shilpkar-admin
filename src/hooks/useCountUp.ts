import { useEffect, useRef, useState } from 'react';

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

/**
 * Animates from the previously shown value to `target` (0 on first run).
 * Returns `undefined` until a target exists; honours reduced motion.
 */
export const useCountUp = (target: number | undefined, durationMs = 700) => {
  const [display, setDisplay] = useState<number | undefined>(undefined);
  const fromRef = useRef(0);

  useEffect(() => {
    if (target === undefined) return;

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    const from = fromRef.current;
    let frame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      // rAF's timestamp can precede `start` slightly; clamp so the first
      // frame never eases to a negative value (rendered as "-0").
      const progress = reduceMotion
        ? 1
        : Math.min(1, Math.max(0, (now - start) / durationMs));
      const value = Math.round(from + (target - from) * easeOutCubic(progress));
      setDisplay(value);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);

  return display;
};
