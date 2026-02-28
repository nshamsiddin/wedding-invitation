import { useEffect, useRef } from 'react';
import { useMotionValue } from 'framer-motion';

export function useMousePosition() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rawX = useRef(0);
  const rawY = useRef(0);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      rawX.current = e.clientX;
      rawY.current = e.clientY;
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener('mousemove', handler, { passive: true });
    return () => window.removeEventListener('mousemove', handler);
  }, [x, y]);

  return { x, y, rawX, rawY };
}

export function useNormalizedMousePosition() {
  const nx = useMotionValue(0.5);
  const ny = useMotionValue(0.5);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      nx.set(e.clientX / window.innerWidth);
      ny.set(e.clientY / window.innerHeight);
    };
    window.addEventListener('mousemove', handler, { passive: true });
    return () => window.removeEventListener('mousemove', handler);
  }, [nx, ny]);

  return { nx, ny };
}
