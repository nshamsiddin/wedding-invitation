// ─── Shared design tokens for the garden aesthetic ────────────────────────────
// Single source of truth for palette, typography, and shared asset references.
// Import from here instead of duplicating constants across page files.

export const PARCHMENT      = '#FDFAF5';
export const CREAM          = '#F5EFE4';
export const ESPRESSO       = '#2A1F1A';
// Raised from 0.6 → 0.7 to reach 5.67:1 contrast on PARCHMENT (WCAG AA 4.5:1)
export const ESPRESSO_DIM   = 'rgba(42,31,26,0.7)';
export const ESPRESSO_FAINT = 'rgba(42,31,26,0.28)';
export const GOLD           = '#B8924A';
export const GOLD_DIM       = 'rgba(184,146,74,0.45)';
// Darkened gold for use as foreground text — passes 4.07:1 on PARCHMENT (large text AA 3:1)
export const GOLD_ACCESSIBLE = '#9A7535';
export const ROSE           = '#C4848C';

export const COUPLE_PHOTO = '/IMG_2524.jpg';
