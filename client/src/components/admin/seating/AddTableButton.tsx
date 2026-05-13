import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CREAM, ESPRESSO, ESPRESSO_DIM, GOLD, GOLD_DIM, PARCHMENT } from '../../../garden/tokens';
import { useAdminTranslation } from '../../../lib/i18n/admin';

interface Props {
  /** Suggested table number for the next free slot, pre-filled in the input. */
  suggestedNumber: number;
  isPending: boolean;
  /**
   * Called with one or more table specs. When the admin sets count > 1 the
   * form emits a batch of consecutively-numbered tables sharing the same
   * capacity (and label, when provided), so we let the parent decide how to
   * sequence the API calls.
   */
  onCreate: (
    values: Array<{ tableNumber: number; label: string | null; capacity: number }>,
  ) => void;
}

// ─── "Add table" floating card + inline form ──────────────────────────────
// Renders as a sibling card to TableCards so its visual weight matches the
// rest of the grid. Clicking it expands an in-place form rather than opening
// a modal — adding tables in quick succession is the common case.

const MAX_BATCH = 50;

export default function AddTableButton({ suggestedNumber, isPending, onCreate }: Props) {
  const at = useAdminTranslation();
  const [expanded, setExpanded] = useState(false);
  const [label, setLabel] = useState('');
  const [capacity, setCapacity] = useState(10);
  const [tableNumber, setTableNumber] = useState(suggestedNumber);
  // Count of tables to create in a single submit. Defaults to 1 so the
  // common "add one table" path is unchanged. Cap at MAX_BATCH to prevent
  // accidental fat-fingering (e.g. "100" instead of "10") from issuing a
  // huge burst of requests.
  const [count, setCount] = useState(1);
  const labelInputRef = useRef<HTMLInputElement>(null);

  // When the suggested number changes (e.g. after another table was created),
  // refresh the input value — but only when the form is collapsed so we never
  // wipe out something the admin is actively typing.
  useEffect(() => {
    if (!expanded) setTableNumber(suggestedNumber);
  }, [suggestedNumber, expanded]);

  // Auto-focus the label input on expand so an admin can immediately start
  // naming the table (the common first action).
  useEffect(() => {
    if (expanded) {
      const id = requestAnimationFrame(() => labelInputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
    return undefined;
  }, [expanded]);

  const submit = () => {
    // Defensive parse — the input is type=number but users can still paste
    // arbitrary strings or use the spinner to bottom out at 0.
    const n = Number.isFinite(tableNumber) && tableNumber > 0 ? Math.floor(tableNumber) : suggestedNumber;
    const c = Number.isFinite(capacity) && capacity > 0 ? Math.floor(capacity) : 10;
    const k = Number.isFinite(count) && count > 0 ? Math.min(MAX_BATCH, Math.floor(count)) : 1;
    const trimmedLabel = label.trim() || null;
    // Build a sequential block of tables starting at `n`. Sharing the same
    // optional label is intentional — admins can rename individual tables
    // afterward via the edit modal if they want unique names.
    const batch = Array.from({ length: k }, (_, i) => ({
      tableNumber: n + i,
      label: trimmedLabel,
      capacity: c,
    }));
    onCreate(batch);
    // Reset only the fields that should reset between submits. Keep capacity
    // and count since admins typically have a consistent table size and may
    // want to keep adding more in batches of the same shape.
    setLabel('');
  };

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="rounded-xl flex flex-col items-center justify-center gap-2 min-h-[8rem] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)]"
        style={{
          background: 'transparent',
          border: `2px dashed ${GOLD_DIM}`,
          color: ESPRESSO_DIM,
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = GOLD;
          e.currentTarget.style.background = 'rgba(184,146,74,0.06)';
          e.currentTarget.style.color = ESPRESSO;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = GOLD_DIM;
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = ESPRESSO_DIM;
        }}
        aria-label={at.seatingAddTable}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
        <span className="text-xs font-sans font-medium">{at.seatingAddTable}</span>
      </button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        key="add-table-form"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.15 }}
        className="rounded-xl p-3.5 flex flex-col gap-2.5"
        style={{ background: PARCHMENT, border: `1.5px solid ${GOLD}` }}
      >
        <p
          className="text-[10px] font-sans font-bold uppercase tracking-widest"
          style={{ color: GOLD }}
        >
          {at.seatingAddTable}
        </p>

        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-sans uppercase tracking-wider" style={{ color: ESPRESSO_DIM }}>
            {at.seatingTableLabelPlaceholder}
          </span>
          <input
            ref={labelInputRef}
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); submit(); }
              if (e.key === 'Escape') setExpanded(false);
            }}
            maxLength={100}
            placeholder={at.seatingTableLabel(tableNumber)}
            className="px-2 py-1 rounded-md text-xs font-sans focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)]"
            style={{ background: CREAM, border: `1px solid ${GOLD_DIM}`, color: ESPRESSO }}
          />
        </label>

        <div className="flex gap-2">
          <label className="flex flex-col gap-1 flex-1">
            <span className="text-[10px] font-sans uppercase tracking-wider" style={{ color: ESPRESSO_DIM }}>
              #
            </span>
            <input
              type="number"
              min={1}
              max={500}
              value={tableNumber}
              onChange={(e) => setTableNumber(parseInt(e.target.value, 10) || suggestedNumber)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); submit(); }
                if (e.key === 'Escape') setExpanded(false);
              }}
              className="px-2 py-1 rounded-md text-xs font-sans tabular-nums focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)]"
              style={{ background: CREAM, border: `1px solid ${GOLD_DIM}`, color: ESPRESSO }}
            />
          </label>
          <label className="flex flex-col gap-1 flex-1">
            <span className="text-[10px] font-sans uppercase tracking-wider" style={{ color: ESPRESSO_DIM }}>
              {at.seatingCapacity}
            </span>
            <input
              type="number"
              min={1}
              max={50}
              value={capacity}
              onChange={(e) => setCapacity(parseInt(e.target.value, 10) || 10)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); submit(); }
                if (e.key === 'Escape') setExpanded(false);
              }}
              className="px-2 py-1 rounded-md text-xs font-sans tabular-nums focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)]"
              style={{ background: CREAM, border: `1px solid ${GOLD_DIM}`, color: ESPRESSO }}
            />
          </label>
          <label className="flex flex-col gap-1 flex-1">
            <span className="text-[10px] font-sans uppercase tracking-wider" style={{ color: ESPRESSO_DIM }}>
              {at.seatingTableCount}
            </span>
            <input
              type="number"
              min={1}
              max={MAX_BATCH}
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value, 10) || 1)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); submit(); }
                if (e.key === 'Escape') setExpanded(false);
              }}
              className="px-2 py-1 rounded-md text-xs font-sans tabular-nums focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)]"
              style={{ background: CREAM, border: `1px solid ${GOLD_DIM}`, color: ESPRESSO }}
            />
          </label>
        </div>

        <div className="flex gap-2 mt-1">
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="flex-1 px-2 py-1.5 rounded-md text-xs font-sans font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)]"
            style={{ background: 'transparent', border: `1px solid ${GOLD_DIM}`, color: ESPRESSO_DIM }}
          >
            {at.cancel}
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={isPending}
            className="flex-1 px-2 py-1.5 rounded-md text-xs font-sans font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: GOLD, color: '#FFFFFF' }}
          >
            {isPending ? at.adding : at.seatingAddTable}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
