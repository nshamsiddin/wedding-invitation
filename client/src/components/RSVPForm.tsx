import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { rsvpFormSchema, type RSVPFormValues } from '@invitation/shared';
import type { AttendanceStatus } from '@invitation/shared';
import { rsvpApi } from '../lib/api';
import { useTranslation } from '../lib/i18n';
import SuccessScreen from './SuccessScreen';

interface PrefillData {
  name: string;
  email: string;
  status: AttendanceStatus;
  guestCount: number;
  dietary: string | null;
  message: string | null;
}

interface Props {
  token: string;
  eventName?: string;
  prefillData?: PrefillData;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'transparent',
  border: 'none',
  borderBottom: '1px solid var(--border-warm)',
  padding: '0.75rem 0',
  color: 'var(--text-primary)',
  fontFamily: '"DM Sans", system-ui, sans-serif',
  fontSize: '0.9rem',
  outline: 'none',
  appearance: 'none' as const,
  WebkitAppearance: 'none',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: '"DM Sans", system-ui, sans-serif',
  fontSize: '0.62rem',
  fontWeight: 500,
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  color: 'var(--text-tertiary)',
  marginBottom: '0.4rem',
};

export default function RSVPForm({ token, eventName = '', prefillData }: Props) {
  const [successResult, setSuccessResult] = useState<{
    name: string;
    status: 'attending' | 'declined' | 'maybe';
    guestCount: number;
    updated: boolean;
  } | null>(null);

  const [focusedField, setFocusedField] = useState<string | null>(null);
  const showUpdateBanner = !!prefillData;
  const t = useTranslation();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RSVPFormValues>({
    resolver: zodResolver(rsvpFormSchema),
    defaultValues: prefillData
      ? {
          name:       prefillData.name,
          email:      prefillData.email,
          status:     prefillData.status as 'attending' | 'declined' | 'maybe',
          guestCount: prefillData.guestCount,
          dietary:    prefillData.dietary ?? '',
          message:    prefillData.message ?? '',
        }
      : { guestCount: 1, dietary: '', message: '' },
  });

  const watchedStatus = watch('status');

  const submitMutation = useMutation({
    mutationFn: (values: RSVPFormValues) =>
      rsvpApi.submit({
        token,
        status: values.status,
        guestCount: values.guestCount,
        dietary: values.dietary,
        message: values.message,
      }),
    onSuccess: (data, variables) => {
      setSuccessResult({
        name: prefillData?.name ?? '',
        status: variables.status,
        guestCount: variables.guestCount ?? 1,
        updated: data.updated,
      });
    },
  });

  const onSubmit = (values: RSVPFormValues) => submitMutation.mutate(values);

  if (successResult) {
    return (
      <SuccessScreen
        guestName={successResult.name}
        status={successResult.status}
        guestCount={successResult.guestCount}
        eventName={eventName}
        isUpdate={successResult.updated}
        onUpdateRsvp={() => setSuccessResult(null)}
      />
    );
  }

  const statusOptions = [
    { value: 'attending' as const, label: t.attendingOption,  symbol: '✓' },
    { value: 'declined'  as const, label: t.decliningOption,  symbol: '✕' },
    { value: 'maybe'     as const, label: t.maybeOption,      symbol: '◎' },
  ];

  const getFocusedInputStyle = (field: string): React.CSSProperties => ({
    ...inputStyle,
    borderBottomColor: focusedField === field ? 'var(--accent-gold)' : 'var(--border-warm)',
    transition: 'border-color 0.3s ease',
  });

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="space-y-7"
      aria-label={t.rsvpHeading}
    >
      {/* Update banner */}
      <AnimatePresence>
        {showUpdateBanner && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-xl px-4 py-3"
            style={{
              background: 'rgba(196,151,90,0.08)',
              border: '1px solid var(--border-warm)',
            }}
            role="status"
            aria-live="polite"
          >
            <p style={{ fontSize: '0.8rem', color: 'var(--accent-gold)', fontFamily: '"DM Sans", system-ui, sans-serif' }}>
              <span style={{ fontWeight: 600 }}>{t.rsvpFoundTitle}</span>{' '}
              {t.rsvpFoundSub}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {submitMutation.isError && (
        <div
          className="rounded-xl px-4 py-3"
          style={{ background: 'rgba(201,128,138,0.08)', border: '1px solid rgba(201,128,138,0.2)' }}
          role="alert"
          aria-live="assertive"
        >
          <p style={{ fontSize: '0.8rem', color: 'var(--accent-rose)', fontFamily: '"DM Sans", system-ui, sans-serif' }}>
            {(submitMutation.error as Error)?.message ?? t.errorGeneric}
          </p>
        </div>
      )}

      {/* Name */}
      <div>
        <label htmlFor="rsvp-name" style={labelStyle}>{t.nameLabel}</label>
        <input
          id="rsvp-name"
          type="text"
          autoComplete="name"
          {...register('name')}
          disabled
          style={{ ...getFocusedInputStyle('name'), opacity: 0.5 }}
          placeholder={t.namePlaceholder}
        />
        {errors.name && (
          <p style={{ marginTop: '0.35rem', fontSize: '0.72rem', color: 'var(--accent-rose)' }} role="alert">
            {errors.name.message}
          </p>
        )}
      </div>

      {/* Attendance */}
      <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
        <legend style={{ ...labelStyle, marginBottom: '0.75rem' }}>
          {t.attendanceLabel} <span aria-hidden="true" style={{ color: 'var(--accent-rose)' }}>*</span>
        </legend>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {statusOptions.map(({ value, label, symbol }) => {
            const isSelected = watchedStatus === value;
            return (
              <label
                key={value}
                className="relative flex flex-col items-center justify-center py-3.5 px-2 rounded-2xl transition-all"
                style={{
                  background: isSelected
                    ? 'rgba(196,151,90,0.1)'
                    : 'rgba(0,0,0,0.02)',
                  border: `1px solid ${isSelected ? 'var(--accent-gold)' : 'var(--border-warm)'}`,
                  color: isSelected ? 'var(--accent-gold)' : 'var(--text-secondary)',
                  transition: 'all 0.25s ease',
                  cursor: 'none',
                }}
              >
                <input
                  type="radio"
                  value={value}
                  {...register('status')}
                  className="sr-only"
                  aria-label={label}
                />
                <span
                  style={{
                    fontSize: '1rem',
                    marginBottom: '0.25rem',
                    display: 'block',
                    fontFamily: 'inherit',
                  }}
                  aria-hidden="true"
                >
                  {symbol}
                </span>
                <span style={{
                  fontSize: '0.65rem',
                  fontFamily: '"DM Sans", system-ui, sans-serif',
                  fontWeight: 500,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase' as const,
                }}>
                  {label}
                </span>
              </label>
            );
          })}
        </div>
        {errors.status && (
          <p style={{ marginTop: '0.5rem', fontSize: '0.72rem', color: 'var(--accent-rose)' }} role="alert">
            {errors.status.message}
          </p>
        )}
      </fieldset>

      {/* Guest count */}
      <AnimatePresence>
        {watchedStatus === 'attending' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <label htmlFor="rsvp-guest-count" style={labelStyle}>{t.guestCountLabel}</label>
            <select
              id="rsvp-guest-count"
              {...register('guestCount', { valueAsNumber: true })}
              style={getFocusedInputStyle('guestCount')}
              onFocus={() => setFocusedField('guestCount')}
              onBlur={() => setFocusedField(null)}
            >
              {[1, 2, 3, 4, 5].map(n => (
                <option key={n} value={n}>
                  {n} {n === 1 ? t.guestCountSingle : t.guestCountPlural}
                </option>
              ))}
            </select>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dietary */}
      <div>
        <label htmlFor="rsvp-dietary" style={labelStyle}>
          {t.dietaryLabel}{' '}
          <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--text-tertiary)' }}>
            {t.dietaryOptional}
          </span>
        </label>
        <input
          id="rsvp-dietary"
          type="text"
          {...register('dietary')}
          style={getFocusedInputStyle('dietary')}
          onFocus={() => setFocusedField('dietary')}
          onBlur={() => setFocusedField(null)}
          placeholder={t.dietaryPlaceholder}
        />
      </div>

      {/* Message */}
      <div>
        <label htmlFor="rsvp-message" style={labelStyle}>
          {t.messageLabel}{' '}
          <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--text-tertiary)' }}>
            {t.messageOptional}
          </span>
        </label>
        <textarea
          id="rsvp-message"
          rows={3}
          {...register('message')}
          style={{
            ...getFocusedInputStyle('message'),
            resize: 'none',
            paddingTop: '0.75rem',
          }}
          onFocus={() => setFocusedField('message')}
          onBlur={() => setFocusedField(null)}
          placeholder={t.messagePlaceholder}
        />
      </div>

      {/* Submit */}
      <motion.button
        type="submit"
        disabled={submitMutation.isPending}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        className="btn-primary w-full"
        style={{
          opacity: submitMutation.isPending ? 0.7 : 1,
        }}
        aria-label={showUpdateBanner ? t.updateRsvp : t.sendRsvp}
      >
        {submitMutation.isPending ? (
          <span className="flex items-center justify-center gap-2">
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{
                display: 'inline-block',
                width: 14,
                height: 14,
                border: '2px solid rgba(12,10,9,0.2)',
                borderTopColor: 'rgba(12,10,9,0.8)',
                borderRadius: '50%',
              }}
              aria-hidden="true"
            />
            {t.sending}
          </span>
        ) : showUpdateBanner ? t.updateRsvp : t.sendRsvp}
      </motion.button>

      <p style={{
        textAlign: 'center',
        fontSize: '0.72rem',
        color: 'var(--text-tertiary)',
        fontFamily: '"DM Sans", system-ui, sans-serif',
      }}>
        {t.rsvpDeadlineHint}
      </p>
    </motion.form>
  );
}
