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
import {
  FormCard, FormField, FormInput, FormTextarea,
  AttendancePicker, GuestCountSelect, FormSubmitButton,
  formInputStyle,
} from './ui/FormPrimitives';

interface PrefillData {
  name: string;
  status: AttendanceStatus;
  guestCount: number;
  dietary: string | null;
  partnerDietary?: string | null;
  message: string | null;
}

interface Props {
  token: string;
  eventName?: string;
  prefillData?: PrefillData;
  partnerName?: string | null;
  /** Pre-built Google Calendar URL for the "Add to Calendar" CTA on the success screen */
  calendarUrl?: string;
}

export default function RSVPForm({ token, eventName = '', prefillData, partnerName, calendarUrl }: Props) {
  const [successResult, setSuccessResult] = useState<{
    name: string;
    status: 'attending' | 'declined' | 'maybe';
    guestCount: number;
    updated: boolean;
  } | null>(null);

  const [editingNames, setEditingNames] = useState(false);
  const showUpdateBanner = !!prefillData;
  const t = useTranslation();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RSVPFormValues>({
    resolver: zodResolver(rsvpFormSchema),
    mode: 'onBlur',
    defaultValues: prefillData
      ? {
          name:           prefillData.name,
          status:         prefillData.status as 'attending' | 'declined' | 'maybe',
          guestCount:     prefillData.guestCount,
          dietary:        prefillData.dietary ?? '',
          partnerDietary: prefillData.partnerDietary ?? '',
          partnerName:    partnerName ?? '',
          message:        prefillData.message ?? '',
        }
      : { guestCount: 1, dietary: '', partnerDietary: '', partnerName: '', message: '' },
  });

  const watchedStatus  = watch('status');
  const watchedCount   = watch('guestCount') ?? 1;

  const submitMutation = useMutation({
    mutationFn: (values: RSVPFormValues) =>
      rsvpApi.submit({
        token,
        status: values.status,
        guestCount: values.guestCount,
        dietary: values.dietary,
        partnerDietary: values.partnerDietary,
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
        onUpdateRsvp={() => setSuccessResult(null)}
      />
    );
  }

  const attendanceLabels = {
    attending: t.attendingOption,
    declined:  t.decliningOption,
    maybe:     t.maybeOption,
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      onSubmit={handleSubmit(onSubmit)}
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
        {/* Name row */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
            <label style={{ fontFamily: '"DM Sans", system-ui, sans-serif', fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
              {partnerName ? t.guestsShortLabel : t.nameLabel}
            </label>
            <button
              type="button"
              onClick={() => setEditingNames((v) => !v)}
              aria-label={editingNames ? 'Lock name fields' : 'Edit name'}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem 0.4rem', color: editingNames ? 'var(--accent-gold)' : 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '0.3rem', transition: 'color 0.2s' }}
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
              <span style={{ fontSize: '0.72rem', fontFamily: '"DM Sans", system-ui, sans-serif', fontWeight: 500, letterSpacing: '0.05em' }}>
                {editingNames ? t.lockName : t.editName}
              </span>
            </button>
          </div>

          {editingNames ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <FormInput id="rsvp-name" type="text" autoComplete="name" {...register('name')} placeholder={t.namePlaceholder} />
              {errors.name && <p style={{ fontSize: '0.72rem', color: 'var(--accent-rose)' }} role="alert">{errors.name.message}</p>}
              {partnerName !== undefined && partnerName !== null && (
                <FormInput id="rsvp-partner-name" type="text" autoComplete="off" {...register('partnerName')} placeholder={t.partnerNamePlaceholder} />
              )}
            </div>
          ) : partnerName ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0', borderBottom: '1px solid var(--border-warm)', fontFamily: '"DM Sans", system-ui, sans-serif', fontSize: '0.9rem', color: 'var(--text-primary)', opacity: 0.85 }}
              aria-label={`Guests: ${prefillData?.name} and ${partnerName}`}
            >
              <span>{prefillData?.name}</span>
              <span style={{ color: 'var(--accent-rose)', fontSize: '0.75rem', flexShrink: 0 }}>&amp;</span>
              <span>{partnerName}</span>
            </div>
          ) : (
            <input id="rsvp-name" type="text" autoComplete="name" {...register('name')} disabled
              style={{ ...formInputStyle, opacity: 0.5 }}
              placeholder={t.namePlaceholder}
            />
          )}
        </div>

        {/* Attendance */}
        <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
          <legend style={{ fontFamily: '"DM Sans", system-ui, sans-serif', fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '0.5rem' }}>
            {t.attendanceLabel} <span aria-hidden="true" style={{ color: 'var(--accent-rose)' }}>*</span>
          </legend>
          <AttendancePicker
            value={watchedStatus ?? ''}
            onChange={(v) => setValue('status', v, { shouldValidate: true })}
            labels={attendanceLabels}
            name="rsvp-status"
          />
          {errors.status && <p style={{ marginTop: '0.4rem', fontSize: '0.72rem', color: 'var(--accent-rose)' }} role="alert">{errors.status.message}</p>}
        </fieldset>

        {/* Guest count + dietary (only when attending) */}
        <AnimatePresence>
          {watchedStatus === 'attending' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}
            >
              <GuestCountSelect
                id="rsvp-guest-count"
                label={t.guestCountLabel}
                singleLabel={t.guestCountSingle}
                pluralLabel={t.guestCountPlural}
                value={watchedCount}
                onChange={(n) => setValue('guestCount', n)}
              />
              <FormField
                htmlFor="rsvp-dietary"
                label={t.dietaryLabel}
                optional={t.dietaryOptional}
                error={errors.dietary?.message}
              >
                <FormInput
                  id="rsvp-dietary"
                  type="text"
                  {...register('dietary')}
                  placeholder={t.dietaryPlaceholder}
                />
              </FormField>
              {(watchedCount > 1 || (partnerName !== null && partnerName !== undefined)) && (
                <FormField
                  htmlFor="rsvp-partner-dietary"
                  label={t.partnerDietaryLabel}
                  optional={t.dietaryOptional}
                  error={errors.partnerDietary?.message}
                >
                  <FormInput
                    id="rsvp-partner-dietary"
                    type="text"
                    {...register('partnerDietary')}
                    placeholder={t.dietaryPlaceholder}
                  />
                </FormField>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </FormCard>

      {/* ── A NOTE TO US ── */}
      <FormCard title={t.aNoteToUs}>
        <FormField htmlFor="rsvp-message" label={t.messageLabel} optional={t.messageOptional}>
          <FormTextarea id="rsvp-message" rows={2} {...register('message')} placeholder={t.messagePlaceholder} />
        </FormField>
      </FormCard>

      <FormSubmitButton
        pending={submitMutation.isPending}
        label={showUpdateBanner ? t.updateRsvp : t.sendRsvp}
        pendingLabel={t.sending}
      />

      <p style={{ textAlign: 'center', fontSize: '0.68rem', color: 'var(--text-tertiary)', fontFamily: '"DM Sans", system-ui, sans-serif', marginTop: '0.25rem' }}>
        {t.rsvpDeadlineHint}
      </p>
    </motion.form>
  );
}
