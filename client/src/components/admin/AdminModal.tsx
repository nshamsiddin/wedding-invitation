/**
 * AdminModal — consistent modal shell for all admin form dialogs.
 *
 * Consolidates the three previously-divergent form modals (AddGuest, EditGuest,
 * EditInvitation) into a single design-token–consistent pattern.
 *
 * Guarantees:
 *   - Parchment/gold/espresso design language (matches dashboard shell)
 *   - WCAG 2.1 focus trap (SC 2.1.1) via useFocusTrap
 *   - Focus restored to trigger element on close
 *   - Escape key dismissal
 *   - Backdrop click dismissal
 *   - role="dialog" + aria-modal + aria-labelledby semantics
 */
import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PARCHMENT, GOLD_DIM, ESPRESSO } from '../../garden/tokens';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Used as the accessible modal title (aria-labelledby target). */
  title: string;
  /** Optional subtitle line rendered below the title. */
  subtitle?: string;
  /** Modal panel width: 'sm' ≈ 384px (default), 'md' ≈ 448px */
  size?: 'sm' | 'md';
  /** Content rendered inside the panel, below the header. */
  children: React.ReactNode;
  /** Stable id for the title element; auto-generated from title if omitted. */
  titleId?: string;
}

const SIZE_CLASS: Record<NonNullable<AdminModalProps['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
};

export default function AdminModal({
  isOpen,
  onClose,
  title,
  subtitle,
  size = 'sm',
  children,
  titleId,
}: AdminModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, isOpen);

  const id = titleId ?? `modal-title-${title.toLowerCase().replace(/\s+/g, '-')}`;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40"
            aria-hidden="true"
          />

          {/* Centering layer — not the dialog itself, to avoid nesting issues */}
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="presentation"
          >
            {/* Dialog panel */}
            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={id}
              tabIndex={-1}
              initial={{ opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className={`w-full ${SIZE_CLASS[size]} max-h-[90vh] overflow-y-auto rounded-xl shadow-xl focus:outline-none`}
              style={{ background: PARCHMENT, border: `1px solid ${GOLD_DIM}` }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-6 py-4"
                style={{ borderBottom: `1px solid ${GOLD_DIM}` }}
              >
                <div>
                  <h2
                    id={id}
                    className="font-sans font-semibold text-base"
                    style={{ color: ESPRESSO }}
                  >
                    {title}
                  </h2>
                  {subtitle && (
                    <p className="text-xs font-sans mt-0.5 text-[rgba(42,31,26,0.7)]">
                      {subtitle}
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)] text-[rgba(42,31,26,0.5)] hover:text-[#2A1F1A] hover:bg-[rgba(184,146,74,0.12)]"
                  aria-label="Close dialog"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Body */}
              {children}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
