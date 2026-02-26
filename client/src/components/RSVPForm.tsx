import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { rsvpFormSchema, type RSVPFormValues, type Guest } from '@invitation/shared';
import { rsvpApi } from '../lib/api';
import { useTranslation } from '../lib/i18n';
import SuccessScreen from './SuccessScreen';

interface Props {
  prefillData?: Guest;
  isUpdateMode?: boolean;
}

interface SubmitResult {
  guest: Guest;
  updated: boolean;
}

export default function RSVPForm({ prefillData, isUpdateMode = false }: Props) {
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [_existingGuest, setExistingGuest] = useState<Guest | undefined>(prefillData);
  const [showUpdateBanner, setShowUpdateBanner] = useState(isUpdateMode);
  const t = useTranslation();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RSVPFormValues>({
    resolver: zodResolver(rsvpFormSchema),
    defaultValues: prefillData
      ? {
          name: prefillData.name,
          email: prefillData.email,
          status: prefillData.status as 'attending' | 'declined' | 'maybe',
          guestCount: prefillData.guestCount,
          dietary: prefillData.dietary ?? '',
          message: prefillData.message ?? '',
        }
      : {
          guestCount: 1,
          dietary: '',
          message: '',
        },
  });

  const watchedStatus = watch('status');
  const watchedEmail = watch('email');

  const handleEmailBlur = async () => {
    if (!watchedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(watchedEmail) || prefillData) return;

    setCheckingEmail(true);
    try {
      const res = await rsvpApi.check(watchedEmail);
      if (res.exists && res.guest) {
        setExistingGuest(res.guest);
        setShowUpdateBanner(true);
        setValue('name', res.guest.name, { shouldValidate: true });
        setValue('status', res.guest.status as 'attending' | 'declined' | 'maybe', { shouldValidate: true });
        setValue('guestCount', res.guest.guestCount, { shouldValidate: true });
        setValue('dietary', res.guest.dietary ?? '', { shouldValidate: true });
        setValue('message', res.guest.message ?? '', { shouldValidate: true });
      } else {
        setExistingGuest(undefined);
        setShowUpdateBanner(false);
      }
    } catch {
      // Silently fail on check
    } finally {
      setCheckingEmail(false);
    }
  };

  const submitMutation = useMutation({
    mutationFn: rsvpApi.submit,
    onSuccess: (data) => {
      setResult(data);
    },
  });

  const onSubmit = (values: RSVPFormValues) => {
    submitMutation.mutate(values);
  };

  if (result) {
    return (
      <SuccessScreen
        guest={result.guest}
        isUpdate={result.updated}
        onUpdateRsvp={() => {
          setResult(null);
          setShowUpdateBanner(true);
        }}
      />
    );
  }

  const statusOptions = [
    { value: 'attending' as const, label: t.attendingOption, icon: '✓' },
    { value: 'declined' as const, label: t.decliningOption, icon: '✗' },
    { value: 'maybe'    as const, label: t.maybeOption,     icon: '?' },
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
      <AnimatePresence>
        {showUpdateBanner && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-lg px-4 py-3"
            style={{ background: 'rgba(201,165,90,0.08)', border: '1px solid rgba(201,165,90,0.3)' }}
            role="status"
            aria-live="polite"
          >
            <p className="text-elfgold-300 text-sm font-body">
              <span className="font-semibold">{t.rsvpFoundTitle}</span>{' '}
              {t.rsvpFoundSub}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {submitMutation.isError && (
        <div
          className="bg-red-500/10 border border-red-400/30 rounded-lg px-4 py-3"
          role="alert"
          aria-live="assertive"
        >
          <p className="text-red-300 text-sm font-body">
            {(submitMutation.error as Error)?.message ?? t.errorGeneric}
          </p>
        </div>
      )}

      {/* Email */}
      <div>
        <label htmlFor="rsvp-email" className="label-mystic">
          {t.emailLabel} <span aria-hidden="true" className="text-elfgold-400">*</span>
        </label>
        <div className="relative">
          <input
            id="rsvp-email"
            type="email"
            autoComplete="email"
            aria-required="true"
            aria-describedby={errors.email ? 'rsvp-email-error' : undefined}
            aria-invalid={!!errors.email}
            {...register('email')}
            onBlur={handleEmailBlur}
            disabled={!!prefillData}
            className="input-mystic disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder={t.emailPlaceholder}
          />
          {checkingEmail && (
            <div
              className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-elfgold-400 border-t-transparent rounded-full animate-spin"
              aria-hidden="true"
            />
          )}
        </div>
        {errors.email && (
          <p id="rsvp-email-error" className="mt-1.5 text-xs text-red-400 font-body" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Name */}
      <div>
        <label htmlFor="rsvp-name" className="label-mystic">
          {t.nameLabel} <span aria-hidden="true" className="text-elfgold-400">*</span>
        </label>
        <input
          id="rsvp-name"
          type="text"
          autoComplete="name"
          aria-required="true"
          aria-describedby={errors.name ? 'rsvp-name-error' : undefined}
          aria-invalid={!!errors.name}
          {...register('name')}
          className="input-mystic"
          placeholder={t.namePlaceholder}
        />
        {errors.name && (
          <p id="rsvp-name-error" className="mt-1.5 text-xs text-red-400 font-body" role="alert">
            {errors.name.message}
          </p>
        )}
      </div>

      {/* Attendance */}
      <fieldset>
        <legend className="label-mystic">
          {t.attendanceLabel} <span aria-hidden="true" className="text-elfgold-400">*</span>
        </legend>
        <div className="grid grid-cols-3 gap-2" role="group" aria-required="true">
          {statusOptions.map(({ value, label, icon }) => (
            <label
              key={value}
              className={`relative flex flex-col items-center justify-center py-3 px-2 rounded-xl border cursor-pointer transition-all ${
                watchedStatus === value
                  ? 'text-elfgold-300'
                  : 'text-parchment-400/50 hover:text-parchment-200'
              }`}
              style={
                watchedStatus === value
                  ? { background: 'rgba(201,165,90,0.12)', borderColor: 'rgba(201,165,90,0.4)' }
                  : { background: 'rgba(30,27,46,0.4)', borderColor: 'rgba(200,208,216,0.12)' }
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
              <span className="text-xs font-serif font-medium tracking-wide">{label}</span>
            </label>
          ))}
        </div>
        {errors.status && (
          <p className="mt-1.5 text-xs text-red-400 font-body" role="alert">
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
            <label htmlFor="rsvp-guest-count" className="label-mystic">
              {t.guestCountLabel}
            </label>
            <select
              id="rsvp-guest-count"
              aria-describedby={errors.guestCount ? 'rsvp-guest-count-error' : undefined}
              {...register('guestCount', { valueAsNumber: true })}
              className="input-mystic appearance-none cursor-pointer"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n} className="bg-mystic-800 text-parchment-200">
                  {n} {n === 1 ? t.guestCountSingle : t.guestCountPlural}
                </option>
              ))}
            </select>
            {errors.guestCount && (
              <p id="rsvp-guest-count-error" className="mt-1.5 text-xs text-red-400 font-body" role="alert">
                {errors.guestCount.message}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dietary */}
      <div>
        <label htmlFor="rsvp-dietary" className="label-mystic">
          {t.dietaryLabel}{' '}
          <span className="text-parchment-400/40 font-normal normal-case tracking-normal">{t.dietaryOptional}</span>
        </label>
        <input
          id="rsvp-dietary"
          type="text"
          {...register('dietary')}
          className="input-mystic"
          placeholder={t.dietaryPlaceholder}
        />
      </div>

      {/* Message */}
      <div>
        <label htmlFor="rsvp-message" className="label-mystic">
          {t.messageLabel}{' '}
          <span className="text-parchment-400/40 font-normal normal-case tracking-normal">{t.messageOptional}</span>
        </label>
        <textarea
          id="rsvp-message"
          rows={3}
          {...register('message')}
          className="input-mystic resize-none"
          placeholder={t.messagePlaceholder}
        />
      </div>

      {/* Submit */}
      <motion.button
        type="submit"
        disabled={isSubmitting || submitMutation.isPending}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="btn-elfgold w-full disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label={isUpdateMode || showUpdateBanner ? t.updateRsvp : t.sendRsvp}
      >
        {submitMutation.isPending ? (
          <span className="flex items-center justify-center gap-2">
            <span
              className="w-4 h-4 border-2 border-mystic-950/30 border-t-mystic-950 rounded-full animate-spin"
              aria-hidden="true"
            />
            {t.sending}
          </span>
        ) : isUpdateMode || showUpdateBanner ? (
          t.updateRsvp
        ) : (
          t.sendRsvp
        )}
      </motion.button>

      <p className="text-center text-xs text-parchment-500/40 font-body">
        {t.rsvpDeadlineHint}
      </p>
    </motion.form>
  );
}
