/**
 * Shared visual primitives for all invitation RSVP forms.
 * Every form (personal, public, claim) must use these components
 * so the design is pixel-identical across flows.
 */
import { useState, forwardRef } from 'react';
import type { CSSProperties, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { motion } from 'framer-motion';

// ─── Style tokens ─────────────────────────────────────────────────────────────

export const formLabelStyle: CSSProperties = {
  display: 'block',
  fontFamily: '"DM Sans", system-ui, sans-serif',
  fontSize: '0.7rem',
  fontWeight: 500,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--text-tertiary)',
  marginBottom: '0.25rem',
};

export const formInputStyle: CSSProperties = {
  width: '100%',
  background: 'transparent',
  border: 'none',
  borderBottom: '1px solid var(--border-warm)',
  padding: '0.5rem 0',
  color: 'var(--text-primary)',
  fontFamily: '"DM Sans", system-ui, sans-serif',
  fontSize: '0.9rem',
  outline: 'none',
  appearance: 'none',
  WebkitAppearance: 'none',
  transition: 'border-color 0.3s ease',
};

export const formCardStyle: CSSProperties = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border-warm)',
  borderRadius: '16px',
  padding: '0.9rem 1rem 1.1rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.85rem',
};

export const formErrorStyle: CSSProperties = {
  fontSize: '0.72rem',
  color: 'var(--accent-rose)',
  marginTop: '0.2rem',
};

// ─── FormCard ─────────────────────────────────────────────────────────────────

export function FormCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={formCardStyle}>
      <p style={{
        fontFamily: '"DM Sans", system-ui, sans-serif',
        fontSize: '0.7rem',
        fontWeight: 600,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--text-tertiary)',
      }}>
        {title}
      </p>
      {children}
    </div>
  );
}

// ─── FormField ────────────────────────────────────────────────────────────────

export function FormField({
  label, required, optional, error, children,
}: {
  label: string;
  required?: boolean;
  optional?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label style={formLabelStyle}>
        {label}
        {required && <span style={{ color: 'var(--accent-rose)', marginLeft: '0.2rem' }} aria-hidden="true">*</span>}
        {optional && (
          <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: '0.3rem', opacity: 0.7 }}>
            {optional}
          </span>
        )}
      </label>
      {children}
      {error && <p style={formErrorStyle} role="alert">{error}</p>}
    </div>
  );
}

// ─── FormInput ────────────────────────────────────────────────────────────────

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  focusColor?: boolean;
}
export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  function FormInput({ focusColor, style, onFocus, onBlur, ...props }, ref) {
    const [focused, setFocused] = useState(false);
    return (
      <input
        ref={ref}
        style={{
          ...formInputStyle,
          borderBottomColor: focused ? 'var(--accent-gold)' : 'var(--border-warm)',
          ...style,
        }}
        onFocus={(e) => { setFocused(true); onFocus?.(e); }}
        onBlur={(e)  => { setFocused(false); onBlur?.(e); }}
        {...props}
      />
    );
  }
);

// ─── FormTextarea ─────────────────────────────────────────────────────────────

interface FormTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {}
export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  function FormTextarea({ style, onFocus, onBlur, ...props }, ref) {
    const [focused, setFocused] = useState(false);
    return (
      <textarea
        ref={ref}
        style={{
          ...formInputStyle,
          resize: 'none',
          borderBottomColor: focused ? 'var(--accent-gold)' : 'var(--border-warm)',
          ...style,
        }}
        onFocus={(e) => { setFocused(true); onFocus?.(e); }}
        onBlur={(e)  => { setFocused(false); onBlur?.(e); }}
        {...props}
      />
    );
  }
);

// ─── FormSelect ───────────────────────────────────────────────────────────────

interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {}
export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  function FormSelect({ style, onFocus, onBlur, children, ...props }, ref) {
    const [focused, setFocused] = useState(false);
    return (
      <select
        ref={ref}
        style={{
          ...formInputStyle,
          borderBottomColor: focused ? 'var(--accent-gold)' : 'var(--border-warm)',
          paddingRight: '1.5rem',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%23B8924A' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.25rem center',
          ...style,
        }}
        onFocus={(e) => { setFocused(true); onFocus?.(e); }}
        onBlur={(e)  => { setFocused(false); onBlur?.(e); }}
        {...props}
      >
        {children}
      </select>
    );
  }
);

// ─── AttendancePicker — 3-button radio ────────────────────────────────────────

type AttendanceValue = 'attending' | 'declined' | 'maybe';
const ATTEND_OPTIONS: { value: AttendanceValue; symbol: string }[] = [
  { value: 'attending', symbol: '✓' },
  { value: 'declined',  symbol: '✕' },
  { value: 'maybe',     symbol: '◎' },
];

export function AttendancePicker({
  value, onChange, labels, name = 'status',
}: {
  value: string;
  onChange: (v: AttendanceValue) => void;
  labels: { attending: string; declined: string; maybe: string };
  name?: string;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {ATTEND_OPTIONS.map(({ value: v, symbol }) => {
        const isSelected = value === v;
        return (
          <label
            key={v}
            className="relative flex flex-col items-center justify-center py-2.5 px-1 rounded-xl"
            style={{
              background: isSelected ? 'rgba(196,151,90,0.1)' : 'var(--bg-subtle)',
              border: `1px solid ${isSelected ? 'var(--accent-gold)' : 'var(--border-warm)'}`,
              color: isSelected ? 'var(--accent-gold)' : 'var(--text-secondary)',
              transition: 'all 0.25s ease',
              cursor: 'pointer',
            }}
          >
            <input
              type="radio"
              name={name}
              value={v}
              checked={isSelected}
              onChange={() => onChange(v)}
              className="sr-only"
              aria-label={labels[v]}
            />
            <span style={{ fontSize: '0.9rem', marginBottom: '0.2rem', display: 'block' }} aria-hidden="true">
              {symbol}
            </span>
            <span style={{
              fontSize: '0.72rem',
              fontFamily: '"DM Sans", system-ui, sans-serif',
              fontWeight: 500,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}>
              {labels[v]}
            </span>
          </label>
        );
      })}
    </div>
  );
}

// ─── GuestCountSelect ─────────────────────────────────────────────────────────

export function GuestCountSelect({
  id, label, singleLabel, pluralLabel, value, onChange,
}: {
  id: string;
  label: string;
  singleLabel: string;
  pluralLabel: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <FormField label={label}>
      <FormSelect
        id={id}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <option key={n} value={n}>{n} {n === 1 ? singleLabel : pluralLabel}</option>
        ))}
      </FormSelect>
    </FormField>
  );
}

// ─── FormSubmitButton ─────────────────────────────────────────────────────────

export function FormSubmitButton({ pending, label, pendingLabel }: {
  pending: boolean;
  label: string;
  pendingLabel: string;
}) {
  return (
    <motion.button
      type="submit"
      disabled={pending}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className="btn-primary w-full"
      style={{ opacity: pending ? 0.7 : 1, marginTop: '0.5rem' }}
    >
      {pending ? (
        <span className="flex items-center justify-center gap-2">
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(12,10,9,0.2)', borderTopColor: 'rgba(12,10,9,0.8)', borderRadius: '50%' }}
            aria-hidden="true"
          />
          {pendingLabel}
        </span>
      ) : label}
    </motion.button>
  );
}
