/**
 * Shared design-token constants for admin form components.
 *
 * All Tailwind classes here use the same warm espresso/gold/parchment palette as the
 * dashboard shell and delete-confirmation dialogs, preventing the blue-on-white theme
 * leak that existed in the form modals previously.
 *
 * Contrast ratios (WCAG 2.1 AA):
 *   - Input text (#2A1F1A) on parchment (#FDFAF5):  ~18:1  ✓ AAA
 *   - Label text (rgba 42,31,26,0.7) on parchment:  ~5.67:1 ✓ AA
 *   - Primary btn text (#2A1F1A) on gold (#B8924A):  ~5.85:1 ✓ AA
 *   - Focus ring gold rgba on parchment:             UI component, 3:1 threshold
 */

import type { AdminEvent } from '../../lib/api';

// ─── Form fields ─────────────────────────────────────────────────────────────

export const ADMIN_INPUT_CLASS =
  'w-full bg-[#FDFAF5] border border-[rgba(184,146,74,0.45)] rounded-lg px-3 py-2.5 ' +
  'text-[#2A1F1A] font-sans text-sm placeholder:text-[rgba(42,31,26,0.38)] ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)] ' +
  'focus:border-[#B8924A] transition-colors';

export const ADMIN_LABEL_CLASS =
  'block text-xs font-sans font-semibold uppercase tracking-wider mb-1.5 ' +
  'text-[rgba(42,31,26,0.7)]';

// ─── Buttons ─────────────────────────────────────────────────────────────────

/**
 * Primary: gold background, espresso text — contrast 5.85:1 ✓
 * Used for the affirmative CTA (Save, Add, etc.)
 */
export const ADMIN_PRIMARY_BTN_CLASS =
  'flex-1 bg-[#B8924A] hover:bg-[#A07840] text-[#2A1F1A] ' +
  'font-sans font-semibold text-sm py-2.5 rounded-lg transition-colors ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B8924A] focus-visible:ring-offset-2 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed';

/**
 * Secondary: parchment background, gold border, espresso text.
 * Used for Cancel / non-destructive secondary actions.
 */
export const ADMIN_SECONDARY_BTN_CLASS =
  'flex-1 bg-[#FDFAF5] hover:bg-[#F5EFE4] border border-[rgba(184,146,74,0.45)] ' +
  'hover:border-[#B8924A] text-[#2A1F1A] ' +
  'font-sans font-medium text-sm py-2.5 rounded-lg transition-colors ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)]';

/**
 * Destructive: red background, white text.
 * Used for Remove / Delete affirmative actions.
 */
export const ADMIN_DESTRUCTIVE_BTN_CLASS =
  'flex-1 bg-red-600 hover:bg-red-700 text-white ' +
  'font-sans font-semibold text-sm py-2.5 rounded-lg transition-colors ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed';

// ─── Select element (same as input, plus appearance-none) ────────────────────

export const ADMIN_SELECT_CLASS = `${ADMIN_INPUT_CLASS} appearance-none`;

// ─── Event display name ───────────────────────────────────────────────────────

/**
 * Single source-of-truth for the human-readable event label used in tabs,
 * table column headers, and modal titles. Uses the database-stored event name
 * rather than deriving it from the slug, preventing inconsistencies across
 * components (e.g., "Toshkent" vs "Tashkent").
 */
export function getEventDisplayName(ev: Pick<AdminEvent, 'name' | 'slug'>): string {
  if (ev.name && ev.name.trim().length > 0) return ev.name;
  return ev.slug.charAt(0).toUpperCase() + ev.slug.slice(1);
}
