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

export default function RSVPForm({ token, eventName = '', prefillData }: Props) {
  const [successResult, setSuccessResult] = useState<{
    name: string;
    status: 'attending' | 'declined' | 'maybe';
    guestCount: number;
    updated: boolean;
  } | null>(null);
  const [showUpdateBanner] = useState(!!prefillData);
  const t = useTranslation();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
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
    { value: 'attending' as const, label: t.attendingOption, icon: '✓' },
    { value: 'declined'  as const, label: t.decliningOption, icon: '✗' },
    { value: 'maybe'     as const, label: t.maybeOption,     icon: '?' },
  ];

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="space-y-5"
      aria-label={t.rsvpHeading}
    >
      {/* Update banner */}
      <AnimatePresence>
        {showUpdateBanner && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-2xl px-4 py-3"
            style={{ background: 'rgba(196,154,108,0.10)', border: '1px solid rgba(196,154,108,0.30)' }}
            role="status"
            aria-live="polite"
          >
            <p className="text-gold-700 text-sm font-sans">
              <span className="font-bold">{t.rsvpFoundTitle}</span>{' '}
              {t.rsvpFoundSub}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {submitMutation.isError && (
        <div
          className="rounded-2xl px-4 py-3"
          style={{ background: 'rgba(201,112,122,0.08)', border: '1px solid rgba(201,112,122,0.25)' }}
          role="alert"
          aria-live="assertive"
        >
          <p className="text-tulip-700 text-sm font-sans">
            {(submitMutation.error as Error)?.message ?? t.errorGeneric}
          </p>
        </div>
      )}

      {/* Name (read-only, pre-filled from invite) */}
      <div>
        <label htmlFor="rsvp-name" className="label-ottoman">
          {t.nameLabel}
        </label>
        <input
          id="rsvp-name"
          type="text"
          autoComplete="name"
          aria-describedby={errors.name ? 'rsvp-name-error' : undefined}
          aria-invalid={!!errors.name}
          {...register('name')}
          disabled
          className="input-ottoman disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder={t.namePlaceholder}
        />
      </div>

      {/* Attendance */}
      <fieldset>
        <legend className="label-ottoman">
          {t.attendanceLabel} <span aria-hidden="true" className="text-tulip-400">*</span>
        </legend>
        <div className="grid grid-cols-3 gap-2">
          {statusOptions.map(({ value, label, icon }) => (
            <label
              key={value}
              className="relative flex flex-col items-center justify-center py-3 px-2 rounded-2xl border cursor-pointer transition-all"
              style={
                watchedStatus === value
                  ? { background: 'rgba(201,112,122,0.09)', borderColor: 'rgba(201,112,122,0.45)', color: '#B85A64' }
                  : { background: 'rgba(253,248,240,0.7)', borderColor: 'rgba(196,154,108,0.2)', color: '#A0938A' }
              }
            >
              <input
                type="radio"
                value={value}
                {...register('status')}
                className="sr-only"
                aria-label={label}
              />
              <span className="text-lg mb-0.5" aria-hidden="true">{icon}</span>
              <span className="text-xs font-sans font-semibold tracking-wide">{label}</span>
            </label>
          ))}
        </div>
        {errors.status && (
          <p className="mt-1.5 text-xs text-tulip-600 font-sans" role="alert">
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
            transition={{ duration: 0.2 }}
          >
            <label htmlFor="rsvp-guest-count" className="label-ottoman">
              {t.guestCountLabel}
            </label>
            <select
              id="rsvp-guest-count"
              aria-describedby={errors.guestCount ? 'rsvp-guest-count-error' : undefined}
              {...register('guestCount', { valueAsNumber: true })}
              className="input-ottoman appearance-none cursor-pointer"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n} className="bg-ivory-100 text-stone-700">
                  {n} {n === 1 ? t.guestCountSingle : t.guestCountPlural}
                </option>
              ))}
            </select>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dietary */}
      <div>
        <label htmlFor="rsvp-dietary" className="label-ottoman">
          {t.dietaryLabel}{' '}
          <span className="text-stone-400/60 font-normal normal-case">{t.dietaryOptional}</span>
        </label>
        <input
          id="rsvp-dietary"
          type="text"
          {...register('dietary')}
          className="input-ottoman"
          placeholder={t.dietaryPlaceholder}
        />
      </div>

      {/* Message */}
      <div>
        <label htmlFor="rsvp-message" className="label-ottoman">
          {t.messageLabel}{' '}
          <span className="text-stone-400/60 font-normal normal-case">{t.messageOptional}</span>
        </label>
        <textarea
          id="rsvp-message"
          rows={3}
          {...register('message')}
          className="input-ottoman resize-none"
          placeholder={t.messagePlaceholder}
        />
      </div>

      {/* Submit */}
      <motion.button
        type="submit"
        disabled={isSubmitting || submitMutation.isPending}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="btn-tulip w-full disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label={showUpdateBanner ? t.updateRsvp : t.sendRsvp}
      >
        {submitMutation.isPending ? (
          <span className="flex items-center justify-center gap-2">
            <span
              className="w-4 h-4 border-2 border-ivory-100/40 border-t-ivory-100 rounded-full animate-spin"
              aria-hidden="true"
            />
            {t.sending}
          </span>
        ) : showUpdateBanner ? (
          t.updateRsvp
        ) : (
          t.sendRsvp
        )}
      </motion.button>

      <p className="text-center text-xs text-stone-400 font-sans">
        {t.rsvpDeadlineHint}
      </p>
    </motion.form>
  );
}
