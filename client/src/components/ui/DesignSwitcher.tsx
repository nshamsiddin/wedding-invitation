import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

// Only rendered in development — tree-shaken from production builds.
// Resolves the current design from URL prefix and offers a 3-way toggle.

type DesignKey = 'new' | 'garden';

interface Design {
  key: DesignKey;
  label: string;
  prefix: string;
  icon: string;
}

const DESIGNS: Design[] = [
  { key: 'new',    label: 'New 2026', prefix: '',        icon: '◈' },
  { key: 'garden', label: 'Garden',   prefix: '/garden', icon: '✿' },
];

const PREFIXES: DesignKey[] = ['garden'];

function detectDesign(pathname: string): DesignKey {
  for (const key of PREFIXES) {
    const design = DESIGNS.find(d => d.key === key)!;
    if (pathname === design.prefix || pathname.startsWith(design.prefix + '/')) {
      return key;
    }
  }
  return 'new';
}

function stripPrefix(pathname: string): string {
  for (const design of DESIGNS) {
    if (!design.prefix) continue;
    if (pathname === design.prefix) return '/';
    if (pathname.startsWith(design.prefix + '/')) {
      return pathname.slice(design.prefix.length);
    }
  }
  return pathname;
}

function buildPath(base: string, prefix: string): string {
  if (!prefix) return base;
  return prefix + (base === '/' ? '' : base);
}

export default function DesignSwitcher() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const current = detectDesign(pathname);
  const basePath = stripPrefix(pathname);
  const currentDesign = DESIGNS.find(d => d.key === current)!;

  function switchTo(key: DesignKey) {
    const target = DESIGNS.find(d => d.key === key)!;
    navigate(buildPath(basePath, target.prefix));
    setOpen(false);
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '0.5rem',
      }}
    >
      {/* Option pills */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
              alignItems: 'flex-end',
            }}
            role="menu"
            aria-label="Switch design"
          >
            {DESIGNS.map(design => {
              const isActive = design.key === current;
              return (
                <motion.button
                  key={design.key}
                  onClick={() => switchTo(design.key)}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  role="menuitem"
                  aria-current={isActive ? 'true' : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.45rem 0.9rem',
                    borderRadius: '999px',
                    background: isActive
                      ? 'rgba(196,151,90,0.9)'
                      : 'rgba(18,15,12,0.88)',
                    border: `1px solid ${isActive ? 'rgba(196,151,90,0.9)' : 'rgba(237,232,224,0.18)'}`,
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    color: isActive ? '#080706' : '#EDE8E0',
                    fontSize: '0.62rem',
                    fontFamily: '"DM Sans", system-ui, sans-serif',
                    fontWeight: isActive ? 700 : 400,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                  }}
                >
                  <span aria-hidden="true" style={{ fontSize: '0.7rem' }}>{design.icon}</span>
                  {design.label}
                  {isActive && <span aria-hidden="true" style={{ fontSize: '0.55rem', opacity: 0.7 }}>✓</span>}
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <motion.button
        onClick={() => setOpen(v => !v)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        aria-label={open ? 'Close design switcher' : 'Switch design'}
        aria-expanded={open}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          borderRadius: '999px',
          background: 'rgba(18,15,12,0.88)',
          border: '1px solid rgba(196,151,90,0.35)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          color: '#C4975A',
          fontSize: '0.62rem',
          fontFamily: '"DM Sans", system-ui, sans-serif',
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          cursor: 'pointer',
          boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
        }}
      >
        <span aria-hidden="true" style={{ fontSize: '0.72rem' }}>{currentDesign.icon}</span>
        {currentDesign.label}
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          aria-hidden="true"
          style={{ fontSize: '0.55rem', opacity: 0.6, display: 'inline-block' }}
        >
          ▲
        </motion.span>
      </motion.button>
    </div>
  );
}
