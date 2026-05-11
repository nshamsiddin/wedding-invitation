import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { rsvpFormSchema, type RSVPFormValues } from '@invitation/shared';
import type { AttendanceStatus } from '@invitation/shared';
import { rsvpApi } from '../lib/api';
import { useTranslation } from '../lib/i18n';
import SuccessScreen from './SuccessScreen';
import {
  FormCard, FormField, FormInput, FormTextarea,
  AttendancePicker, GuestCountSelect, FormSubmitButton,
  FormCharCounter,
} from './ui/FormPrimitives';

interface PrefillData {
  name: string;
  status: AttendanceStatus;
  guestCount: number;
  message: string | null;
}

interface Props {
  token: string;
  eventName?: string;
  prefillData?: PrefillData;
  partnerName?: string | null;
  /** Pre-built Google Calendar URL for the "Add to Calendar" CTA on the success screen */
  calendarUrl?: string;
  /** Pre-built .ics blob URL (Apple Calendar) for the success screen */
  icsUrl?: string;
  /** Assigned table number — surfaced on the success screen as a gold pill */
  tableNumber?: number | null;
  /** Sharable URL of the current invitation — enables the share CTA on success */
  shareUrl?: string;
  /** Couple/event name used in the share text on the success screen */
  shareCoupleName?: string;
}

const MESSAGE_MAX = 1000;

export default function RSVPForm({
  token,
  eventName = '',
  prefillData,
  partnerName,
  calendarUrl,
  icsUrl,
  tableNumber,
  shareUrl,
  shareCoupleName,
}: Props) {
  const [successResult, setSuccessResult] = useState<{
    name: string;
    status: 'attending' | 'declined';
    guestCount: number;
    updated: boolean;
  } | null>(null);

  const [editingNames, setEditingNames] = useState(false);
  const showUpdateBanner = !!prefillData;
  const t = useTranslation();

  // We intentionally do not pre-fill `status` from `prefillData` when it is
  // `pending` or `maybe` — those are admin-only / legacy values and must
  // force the guest to make a definite choice.
  const prefillStatus: 'attending' | 'declined' | undefined =
    prefillData?.status === 'attending' || prefillData?.status === 'declined'
      ? prefillData.status
      : undefined;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setFocus,
    formState: { errors },
  } = useForm<RSVPFormValues>({
    resolver: zodResolver(rsvpFormSchema),
    mode: 'onBlur',
    defaultValues: prefillData
      ? {
          name:           prefillData.name,
          status:         prefillStatus,
          guestCount:     prefillData.guestCount,
          partnerName:    partnerName ?? '',
          message:        prefillData.message ?? '',
        }
      : { guestCount: 1, partnerName: '', message: '' },
  });

  const watchedStatus      = watch('status');
  const watchedCount       = watch('guestCount') ?? 1;
  const watchedPartnerName = watch('partnerName');
  const watchedMessage     = watch('message') ?? '';

  // When the guest types a partner name we bump the headcount to 2 the first
  // time (so they don't have to manually flip the selector). We intentionally
  // do NOT auto-decrement when the partner field is cleared — the previous
  // behaviour silently dropped the guest's chosen count, which felt buggy.
  const hasBumpedForPartner = useRef(false);
  useEffect(() => {
    if (watchedPartnerName?.trim()) {
      if (!hasBumpedForPartner.current && watchedCount < 2) {
        setValue('guestCount', 2);
      }
      hasBumpedForPartner.current = true;
    }
  }, [watchedPartnerName]); // eslint-disable-line react-hooks/exhaustive-deps

  const submitMutation = useMutation({
    mutationFn: (values: RSVPFormValues) =>
      rsvpApi.submit({
        token,
        status: values.status,
        guestCount: values.guestCount,
        message: values.message,
        ...(editingNames && values.name ? { name: values.name } : {}),
        ...(editingNames && partnerName !== undefined && values.partnerName !== undefined
          ? { partnerName: values.partnerName }
          : {}),
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

  // Move focus to the first invalid field on submit failure. On iOS the
  // soft keyboard is already up; without this, validation errors can be
  // hidden behind the keyboard or off-screen entirely.
  const onInvalid = (errs: Record<string, unknown>) => {
    const order = ['status', 'name', 'partnerName', 'message', 'guestCount'] as const;
    const first = order.find((k) => k in errs);
    if (first) {
      try { setFocus(first as keyof RSVPFormValues); } catch { /* ignore */ }
    }
  };

  if (successResult) {
    return (
      <SuccessScreen
        guestName={successResult.name}
        partnerName={partnerName}
        status={successResult.status}
        guestCount={successResult.guestCount}
        eventName={eventName}
        isUpdate={successResult.updated}
        calendarUrl={calendarUrl}
        icsUrl={icsUrl}
        tableNumber={tableNumber}
        shareUrl={shareUrl}
        shareCoupleName={shareCoupleName}
        onUpdateRsvp={() => setSuccessResult(null)}
      />
    );
  }

  const attendanceLabels = {
    attending: t.attendingOption,
    declined:  t.decliningOption,
  };

  // Editorial "Reserved for · {Name}" replaces the previously-disabled name
  // input. The label is shown to anyone who isn't in edit mode and provides
  // an obvious "Edit" affordance when name changes are desired.
  const reservedDisplayName = partnerName
    ? `${prefillData?.name ?? ''} & ${partnerName}`
    : prefillData?.name ?? '';

  return (
    <motion.form
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      onSubmit={handleSubmit(onSubmit, onInvalid)}
      noValidate
      className="space-y-3"
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
            style={{ background: 'rgba(196,151,90,0.08)', border: '1px solid var(--border-warm)' }}
            role="status"
            aria-live="polite"
          >
            <p style={{ fontSize: '0.8rem', color: 'var(--accent-gold)', fontFamily: '"DM Sans", system-ui, sans-serif' }}>
              <span style={{ fontWeight: 600 }}>{t.rsvpFoundTitle}</span>{' '}{t.rsvpFoundSub}
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
        >
          <p style={{ fontSize: '0.8rem', color: 'var(--accent-rose)', fontFamily: '"DM Sans", system-ui, sans-serif' }}>
            {(submitMutation.error as Error)?.message ?? t.errorGeneric}
          </p>
        </div>
      )}

      {/* ── WHO'S COMING ── */}
      <FormCard title={t.whosComing}>
        {/* Name row — editorial "Reserved for" line by default, inputs on edit */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <label style={{ fontFamily: '"DM Sans", system-ui, sans-serif', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
              {editingNames || !prefillData ? (partnerName ? t.guestsShortLabel : t.nameLabel) : t.reservedFor}
            </label>
            {prefillData && (
              <button
                type="button"
                onClick={() => setEditingNames((v) => !v)}
                aria-label={editingNames ? t.lockName : t.editName}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.2rem 0.4rem',
                  color: editingNames ? 'var(--accent-gold)' : 'var(--text-tertiary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  transition: 'color 0.2s',
                  borderRadius: '999px',
                  minHeight: '32px',
                }}
              >
                {editingNames ? (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                ) : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                )}
                <span style={{ fontSize: '0.78rem', fontFamily: '"DM Sans", system-ui, sans-serif', fontWeight: 500, letterSpacing: '0.05em' }}>
                  {editingNames ? t.lockName : t.editName}
                </span>
              </button>
            )}
          </div>

          {editingNames || !prefillData ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <FormInput id="rsvp-name" type="text" autoComplete="name" {...register('name')} placeholder={t.namePlaceholder} />
              {errors.name && <p style={{ fontSize: '0.78rem', color: 'var(--accent-rose)' }} role="alert">{errors.name.message}</p>}
              {partnerName !== undefined && partnerName !== null && (
                <FormInput id="rsvp-partner-name" type="text" autoComplete="off" {...register('partnerName')} placeholder={t.partnerNamePlaceholder} />
              )}
            </div>
          ) : (
            <p
              style={{
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                fontStyle: 'italic',
                fontSize: 'clamp(1.15rem, 3.4vw, 1.4rem)',
                color: 'var(--text-primary)',
                margin: 0,
                lineHeight: 1.3,
                overflowWrap: 'anywhere',
              }}
              aria-label={`${t.reservedFor}: ${reservedDisplayName}`}
            >
              {reservedDisplayName}
            </p>
          )}
        </div>

        {/* Attendance */}
        <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
          <legend style={{ fontFamily: '"DM Sans", system-ui, sans-serif', fontSize: '0.78rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '0.5rem' }}>
            {t.attendanceLabel} <span aria-hidden="true" style={{ color: 'var(--accent-rose)' }}>*</span>
          </legend>
          <AttendancePicker
            value={watchedStatus ?? ''}
            onChange={(v) => setValue('status', v, { shouldValidate: true })}
            labels={attendanceLabels}
            name="rsvp-status"
          />
          {errors.status && <p style={{ marginTop: '0.4rem', fontSize: '0.78rem', color: 'var(--accent-rose)' }} role="alert">{errors.status.message}</p>}
        </fieldset>

        {/* Guest count (only when attending) */}
        <AnimatePresence>
          {watchedStatus === 'attending' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <GuestCountSelect
                id="rsvp-guest-count"
                label={t.guestCountLabel}
                hint={t.guestCountHint}
                singleLabel={t.guestCountSingle}
                pluralLabel={t.guestCountPlural}
                value={watchedCount}
                onChange={(n) => setValue('guestCount', n)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </FormCard>

      {/* ── A NOTE TO US ── */}
      <FormCard title={t.aNoteToUs}>
        <FormField htmlFor="rsvp-message" label={t.messageLabel} optional={t.messageOptional}>
          <FormTextarea
            id="rsvp-message"
            rows={2}
            maxLength={MESSAGE_MAX}
            {...register('message')}
            placeholder={t.messagePlaceholder}
          />
          <FormCharCounter value={watchedMessage} max={MESSAGE_MAX} />
        </FormField>
      </FormCard>

      <div className="rsvp-submit-sticky">
        <FormSubmitButton
          pending={submitMutation.isPending}
          label={showUpdateBanner ? t.updateRsvp : t.sendRsvp}
          pendingLabel={t.sending}
        />
      </div>

      <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-tertiary)', fontFamily: '"DM Sans", system-ui, sans-serif', marginTop: '0.25rem' }}>
        {t.rsvpDeadlineHint}
      </p>
    </motion.form>
  );
}
