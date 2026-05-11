import { useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTranslation } from '../lib/i18n';

interface Props {
  /** When false, the ribbon is removed from the DOM. */
  open: boolean;
  /** Called when the guest taps the Confirm CTA — scrolls to RSVP slide. */
  onConfirm: () => void;
  /** Called when the guest dismisses the ribbon (\u00d7, Escape, or backdrop tap). */
  onDismiss: () => void;
}

/**
 * Replaces the previous full-screen blurred NudgeOverlay modal.
 *
 * Design intent:
 *   - A wedding invitation should never *interrupt* the guest mid-read.
 *     The previous modal demanded an action 5 s after landing and counted
 *     a backdrop click as a confirm, which is a known anti-pattern.
 *   - A soft bottom ribbon coexists with the hero, dismissable in three
 *     ways (\u00d7 button, Escape key, or tapping outside) and never blocks
 *     pointer events on the page.
 *   - It's gated on `sessionStorage` so it shows once per session and
 *     leaves alone any guest who has already responded.
 */
export default function NudgeRibbon({ open, onConfirm, onDismiss }: Props) {
  const t = useTranslation();
  const reduce = useReducedMotion();

  // Escape closes the ribbon.
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onDismiss]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="nudge-ribbon"
          role="status"
          aria-live="polite"
          aria-label={t.nudgeRibbonText}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: reduce ? 0.15 : 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="nudge-ribbon"
        >
          <span className="nudge-ribbon__text">{t.nudgeRibbonText}</span>
          <button
            type="button"
            className="nudge-ribbon__cta"
            onClick={onConfirm}
          >
            {t.nudgeRibbonCta}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button
            type="button"
            className="nudge-ribbon__close"
            onClick={onDismiss}
            aria-label={t.nudgeRibbonDismiss}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 6 L18 18 M18 6 L6 18" />
            </svg>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
