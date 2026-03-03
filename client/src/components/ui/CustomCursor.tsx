import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export default function CustomCursor() {
  const [visible, setVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const springConfig = { damping: 28, stiffness: 280, mass: 0.5 };
  const springX = useSpring(cursorX, springConfig);
  const springY = useSpring(cursorY, springConfig);

  const dotSpring = { damping: 50, stiffness: 500, mass: 0.2 };
  const dotX = useSpring(cursorX, dotSpring);
  const dotY = useSpring(cursorY, dotSpring);

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return;

    const onMove = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      if (!visible) setVisible(true);
    };

    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);

    const onHoverChange = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      setIsHovering(Boolean(
        target.closest('a, button, [role="button"], input, select, textarea, label')
      ));
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseleave', onLeave);
    document.addEventListener('mouseenter', onEnter);
    window.addEventListener('mouseover', onHoverChange, { passive: true });

    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('mouseenter', onEnter);
      window.removeEventListener('mouseover', onHoverChange);
    };
  }, [cursorX, cursorY, visible]);

  if (typeof window === 'undefined') return null;
  // Touch/mobile devices have no mouse — skip rendering the cursor entirely
  if (!window.matchMedia('(pointer: fine)').matches) return null;

  return (
    <>
      {/* Outer ring */}
      <motion.div
        animate={{
          scale: isHovering ? 1.6 : 1,
          opacity: visible ? 1 : 0,
        }}
        transition={{ scale: { type: 'spring', damping: 20, stiffness: 300 } }}
        className="fixed top-0 left-0 z-[9999] pointer-events-none mix-blend-difference"
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.6)',
          x: springX,
          y: springY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        aria-hidden="true"
      />

      {/* Inner dot */}
      <motion.div
        animate={{
          scale: isHovering ? 0.3 : 1,
          opacity: visible ? 1 : 0,
        }}
        transition={{ scale: { type: 'spring', damping: 30, stiffness: 500 } }}
        className="fixed top-0 left-0 z-[9999] pointer-events-none"
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: 'rgba(196, 151, 90, 0.9)',
          x: dotX,
          y: dotY,
          translateX: '-50%',
          translateY: '-50%',
          boxShadow: '0 0 12px rgba(196, 151, 90, 0.6)',
        }}
        aria-hidden="true"
      />
    </>
  );
}
