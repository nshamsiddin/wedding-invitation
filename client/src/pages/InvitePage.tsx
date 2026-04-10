import { useRef, useContext, useState, useEffect, useCallback } from 'react';
import type { CSSProperties } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, useInView } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import CountdownTimer from '../components/CountdownTimer';
import RSVPForm from '../components/RSVPForm';
import SuccessScreen from '../components/SuccessScreen';
import LanguageSwitcher from '../components/LanguageSwitcher';
import MagneticButton from '../components/ui/MagneticButton';
import { rsvpApi } from '../lib/api';
import { useTranslation } from '../lib/i18n';
import { LanguageContext } from '../context/LanguageContext';
import type { Language } from '../lib/i18n';
import { claimInvitationSchema, publicRsvpSchema, type ClaimInvitationValues, type PublicRsvpValues } from '@invitation/shared';
import {
  SideVinesFirefly,
  FloatingPetals,
  VineCornerTL,
  VineCornerBR,
  generatePetals,
} from '../garden/components/GardenAtmosphere';
import {
  PARCHMENT,
  CREAM,
  ESPRESSO,
  ESPRESSO_DIM,
  ESPRESSO_FAINT,
  GOLD,
  GOLD_DIM,
  ROSE,
} from '../garden/tokens';
import { formatEventDate } from '../lib/formatDate';
import {
  FormCard, FormField, FormInput, FormTextarea,
  GuestCountSelect, AttendancePicker, FormSubmitButton,
} from '../components/ui/FormPrimitives';

const serif = 'var(--font-display)';
const serifStyle = 'var(--font-display-style)' as 'normal' | 'italic';
const sans  = '"DM Sans", system-ui, sans-serif';

const HERO_PETALS = generatePetals(14, ['#F0C8CC', '#E8B4B8', '#F9EDE8', '#A8C4AB']);

const NAME_GRADIENT: CSSProperties = {
  background: `linear-gradient(
    174deg,
    rgba(253,250,245,0.68) 0%,
    ${ESPRESSO}            11%,
    rgba(42,31,26,0.92)    50%,
    rgba(42,31,26,0.60)    100%
  )`,
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  color: 'transparent',
};

function parseCoupleName(rawName: string): [string, string | null] {
  const parts = rawName.split(' & ');
  return parts.length >= 2 ? [parts[0], parts[1]] : [rawName, null];
}

function buildMonogram(firstName: string, secondName: string | null): string {
  if (secondName && firstName.length > 0 && secondName.length > 0) {
    return `${firstName[0]} & ${secondName[0]} · 2026`;
  }
  return firstName.length > 0 ? `${firstName[0]} · 2026` : '· 2026';
}

// ─── Scroll cue — bouncing chevron (works on both touch and mouse) ────────────
function ScrollCue({ inView }: { inView: boolean }) {
  const t = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ delay: 2.0 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', marginTop: 'clamp(1.25rem, 3.5vh, 2.5rem)' }}
      aria-hidden="true"
    >
      <span style={{ fontFamily: sans, fontSize: '0.88rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: ESPRESSO_DIM, marginBottom: '0.15rem', fontWeight: 500 }}>
        {t.scrollToRsvp}
      </span>
      {/* Two stacked chevrons, staggered fade — universally understood on both touch and mouse */}
      {[0, 1].map((i) => (
        <motion.svg
          key={i}
          width="26" height="16" viewBox="0 0 26 16" fill="none"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut', delay: i * 0.22 }}
        >
          <path d="M1 1L13 13L25 1" stroke={ROSE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </motion.svg>
      ))}
    </motion.div>
  );
}

// ─── Public RSVP form (permanent, reusable link) ─────────────────────────────
interface PublicInviteFormProps {
  token: string;
  eventId: number;
}

function PublicInviteForm({ token, eventId }: PublicInviteFormProps) {
  const t = useTranslation();

  const LS_KEY = `rsvp_pub_${eventId}`;

  type SuccessResult = {
    name: string;
    partnerName?: string;
    status: 'attending' | 'declined' | 'maybe';
    guestCount: number;
  };

  const [successResult, setSuccessResult] = useState<SuccessResult | null>(() => {
    try {
      const stored = localStorage.getItem(LS_KEY);
      return stored ? (JSON.parse(stored) as SuccessResult) : null;
    } catch {
      return null;
    }
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PublicRsvpValues>({
    resolver: zodResolver(publicRsvpSchema),
    mode: 'onBlur',
    defaultValues: { token, eventId, name: '', partnerName: '', phone: '', status: 'attending', guestCount: 1, message: '' },
  });

  const status    = watch('status') ?? 'attending';
  const guestCount = watch('guestCount') ?? 1;

  useEffect(() => {
    if (guestCount <= 1) setValue('partnerName', '');
  }, [guestCount, setValue]);

  const submitMutation = useMutation({
    mutationFn: rsvpApi.submitPublic,
    onSuccess: (_data, variables) => {
      const result: SuccessResult = {
        name: variables.name,
        partnerName: variables.partnerName || undefined,
        status: variables.status,
        guestCount: variables.guestCount ?? 1,
      };
      try { localStorage.setItem(LS_KEY, JSON.stringify(result)); } catch { /* quota exceeded */ }
      setSuccessResult(result);
    },
    onError: () => { toast.error(t.submitFailed); },
  });

  const attendanceLabels = { attending: t.attendingOption, declined: t.decliningOption, maybe: t.maybeOption };

  if (successResult) {
    return (
      <SuccessScreen
        guestName={successResult.name}
        partnerName={successResult.partnerName}
        status={successResult.status}
        guestCount={successResult.guestCount}
        isUpdate={false}
        onUpdateRsvp={() => { try { localStorage.removeItem(LS_KEY); } catch { /* ignore */ } setSuccessResult(null); }}
      />
    );
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      onSubmit={handleSubmit((v) => submitMutation.mutate(v))}
      noValidate
      className="space-y-3"
    >
      <input type="hidden" {...register('token')} />
      <input type="hidden" {...register('eventId', { valueAsNumber: true })} />

      {/* WHO'S COMING */}
      <FormCard title={t.whosComing}>
        <FormField htmlFor="pub-name" label={t.nameLabel} required error={errors.name?.message}>
          <FormInput id="pub-name" type="text" autoComplete="name" {...register('name')} placeholder={t.namePlaceholder} />
        </FormField>

        {guestCount > 1 && (
          <FormField htmlFor="pub-partner" label={t.partnerNameLabel} optional={t.dietaryOptional}>
            <FormInput id="pub-partner" type="text" {...register('partnerName')} placeholder={t.partnerNamePlaceholder} />
          </FormField>
        )}

        <FormField htmlFor="pub-phone" label={t.phoneLabel} required error={errors.phone?.message} hint={t.phoneHint}>
          <FormInput id="pub-phone" type="tel" autoComplete="tel" {...register('phone')} placeholder="+1 555 000 0000" />
        </FormField>

        <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
          <legend style={{ fontFamily: '"DM Sans", system-ui, sans-serif', fontSize: '0.78rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '0.5rem' }}>
            {t.attendanceLabel} <span aria-hidden="true" style={{ color: 'var(--accent-rose)' }}>*</span>
          </legend>
          <AttendancePicker
            value={status}
            onChange={(v) => setValue('status', v, { shouldValidate: true })}
            labels={attendanceLabels}
            name="pub-status"
          />
          {errors.status && <p style={{ marginTop: '0.4rem', fontSize: '0.78rem', color: 'var(--accent-rose)' }} role="alert">{errors.status.message}</p>}
        </fieldset>

        {status === 'attending' && (
          <GuestCountSelect
            id="pub-count"
            label={t.guestCountLabel}
            hint={t.guestCountHint}
            singleLabel={t.guestCountSingle}
            pluralLabel={t.guestCountPlural}
            value={guestCount}
            onChange={(n) => setValue('guestCount', n)}
          />
        )}
      </FormCard>

      {/* A NOTE TO US */}
      <FormCard title={t.aNoteToUs}>
        <FormField htmlFor="pub-message" label={t.messageLabel} optional={t.messageOptional}>
          <FormTextarea id="pub-message" rows={2} {...register('message')} placeholder={t.messagePlaceholder} />
        </FormField>
      </FormCard>

      <FormSubmitButton pending={submitMutation.isPending} label={t.sendRsvp} pendingLabel={t.sending} />
    </motion.form>
  );
}

// ─── Self-registration form for open invitations ─────────────────────────────
interface OpenInviteFormProps {
  token: string;
  isPublic: boolean;
  events: Array<{ id: number; slug: string; name: string; date: string; time: string | null; venueName: string | null }>;
  onSuccess: () => void;
}

function OpenInviteForm({ token, isPublic, events, onSuccess }: OpenInviteFormProps) {
  const t = useTranslation();

  if (isPublic) {
    return <PublicInviteForm token={token} eventId={events[0]?.id ?? 0} />;
  }

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<ClaimInvitationValues>({
    resolver: zodResolver(claimInvitationSchema),
    mode: 'onBlur',
    defaultValues: {
      token,
      name: '',
      phone: '',
      rsvpEntries: events.map((ev) => ({
        eventId: ev.id,
        status: 'attending' as const,
        guestCount: 1,
        dietary: '',
        message: '',
      })),
    },
  });

  const rsvpEntries = watch('rsvpEntries');

  const claimMutation = useMutation({
    mutationFn: rsvpApi.claim,
    onSuccess: () => { toast.success(t.registrationComplete); onSuccess(); },
    onError:   () => { toast.error(t.registerFailed); },
  });

  const attendanceLabels = { attending: t.attendingOption, declined: t.decliningOption, maybe: t.maybeOption };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      onSubmit={handleSubmit((v) => claimMutation.mutate(v))}
      noValidate
      className="space-y-3"
    >
      <input type="hidden" {...register('token')} />

      {/* WHO'S COMING */}
      <FormCard title={t.whosComing}>
        <FormField htmlFor="claim-name" label={t.nameLabel} required error={errors.name?.message}>
          <FormInput id="claim-name" type="text" autoComplete="name" {...register('name')} placeholder={t.namePlaceholder} />
        </FormField>
        <FormField htmlFor="claim-phone" label={t.phoneLabel} optional={t.dietaryOptional}>
          <FormInput id="claim-phone" type="tel" {...register('phone')} placeholder="+1 555 000 0000" />
        </FormField>
      </FormCard>

      {/* One card per event */}
      {events.map((ev, idx) => {
        const entryStatus = rsvpEntries?.[idx]?.status ?? 'attending';
        return (
          <FormCard key={ev.id} title={ev.name}>
            <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
              <legend style={{ fontFamily: '"DM Sans", system-ui, sans-serif', fontSize: '0.78rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '0.5rem' }}>
                {t.attendanceLabel} <span aria-hidden="true" style={{ color: 'var(--accent-rose)' }}>*</span>
              </legend>
              <Controller
                name={`rsvpEntries.${idx}.status`}
                control={control}
                render={({ field }) => (
                  <AttendancePicker
                    value={field.value}
                    onChange={(v) => field.onChange(v)}
                    labels={attendanceLabels}
                    name={`entry-status-${ev.id}`}
                  />
                )}
              />
            </fieldset>

            {entryStatus === 'attending' && (
              <Controller
                name={`rsvpEntries.${idx}.guestCount`}
                control={control}
                render={({ field }) => (
                  <GuestCountSelect
                    id={`entry-count-${ev.id}`}
                    label={t.guestCountLabel}
                    hint={t.guestCountHint}
                    singleLabel={t.guestCountSingle}
                    pluralLabel={t.guestCountPlural}
                    value={field.value ?? 1}
                    onChange={(n) => field.onChange(n)}
                  />
                )}
              />
            )}

            <FormField htmlFor={`entry-message-${ev.id}`} label={t.messageLabel} optional={t.messageOptional}>
              <FormTextarea id={`entry-message-${ev.id}`} rows={2} {...register(`rsvpEntries.${idx}.message`)} placeholder={t.messagePlaceholder} />
            </FormField>
          </FormCard>
        );
      })}

      <FormSubmitButton pending={claimMutation.isPending} label={t.confirmRegistration} pendingLabel={t.registering} />
    </motion.form>
  );
}

// ─── Success screen ───────────────────────────────────────────────────────────
function ClaimSuccessScreen() {
  const t = useTranslation();
  return (
    <div style={{ textAlign: 'center', padding: '2rem 0' }}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{ marginBottom: '1rem' }}
        aria-hidden="true"
      >
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ margin: '0 auto' }}>
          {[0, 60, 120, 180, 240, 300].map((angle, i) => (
            <ellipse key={i} cx="24" cy="24" rx="10" ry="5" fill={ROSE} opacity="0.75" transform={`rotate(${angle} 24 24)`} />
          ))}
          <circle cx="24" cy="24" r="5" fill={GOLD} opacity="0.9" />
        </svg>
      </motion.div>
      <h2 style={{ fontFamily: serif, fontStyle: serifStyle, fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
        {t.youreRegistered}
      </h2>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '24rem', margin: '0 auto' }}>
        {t.thankYouRegistering}
      </p>
    </div>
  );
}

// ─── 2-dot navigation ────────────────────────────────────────────────────────
const INVITE_DOT_ACCENTS = [ROSE, GOLD];

function InviteDotNav({
  current, onDotClick,
}: {
  current: number; onDotClick: (i: number) => void;
}) {
  return (
    <nav
      aria-label="Slide navigation"
      className="invite-dot-nav"
      style={{
        position: 'fixed',
        right: '1rem',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 500,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {[0, 1].map((i) => {
        const accent = INVITE_DOT_ACCENTS[i];
        const isActive = current === i;
        return (
          <motion.button
            key={i}
            onClick={() => onDotClick(i)}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={isActive ? 'true' : undefined}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.95 }}
            style={{
              width: 44, height: 44,
              border: 'none', cursor: 'pointer', padding: 0, outline: 'none',
              background: 'transparent', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <motion.svg
              viewBox="0 0 12 16"
              width={isActive ? 14 : 10}
              height={isActive ? 18 : 14}
              style={{ flexShrink: 0 }}
              animate={{ opacity: isActive ? 0.9 : 0.4 }}
              transition={{ duration: 0.25 }}
            >
              <ellipse cx="6" cy="8" rx="5" ry="7" fill={accent} transform="rotate(-20 6 8)" />
            </motion.svg>
          </motion.button>
        );
      })}
    </nav>
  );
}

// ─── Shared nav header ────────────────────────────────────────────────────────
function InviteNav({ monogram, scrolled }: { monogram: string; scrolled: boolean }) {
  const t = useTranslation();
  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 400,
        padding: '1rem clamp(1.5rem, 5vw, 3rem)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: scrolled ? 'rgba(253,250,245,0.88)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: `1px solid ${scrolled ? ESPRESSO_FAINT : 'transparent'}`,
        transition: 'background 0.4s, backdrop-filter 0.4s, border-color 0.4s',
      }}
    >
      <Link to="/" style={{ textDecoration: 'none' }} aria-label={t.returnToHomepage}>
        <p
          style={{ fontFamily: sans, fontSize: '0.78rem', fontWeight: 500, letterSpacing: '0.25em', textTransform: 'uppercase', color: ESPRESSO_DIM, transition: 'color 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.color = GOLD)}
          onMouseLeave={e => (e.currentTarget.style.color = ESPRESSO_DIM)}
        >
          {monogram}
        </p>
      </Link>
      <LanguageSwitcher />
    </motion.header>
  );
}

// ─── Shared couple name block ─────────────────────────────────────────────────
function CoupleNames({ firstName, secondName, delayOffset = 0 }: { firstName: string; secondName: string | null; delayOffset?: number }) {
  if (secondName) {
    return (
      <div style={{ padding: '0.2em 0' }}>
        <motion.h1
          initial={{ opacity: 0, y: 36, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 1.3, delay: 0.5 + delayOffset, ease: [0.16, 1, 0.3, 1] }}
          style={{ fontFamily: serif, fontStyle: serifStyle, fontWeight: 400, fontSize: 'clamp(4rem, 13vw, 8rem)', lineHeight: 1.15, letterSpacing: '-0.02em', margin: 0, ...NAME_GRADIENT }}
        >
          {firstName}
        </motion.h1>
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.7, delay: 0.9 + delayOffset }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', margin: 'clamp(0.2rem, 0.6vw, 0.5rem) 0', transformOrigin: 'center' }}
          aria-hidden="true"
        >
          <div style={{ flex: 1, maxWidth: '6rem', height: 1, background: GOLD_DIM }} />
          <span style={{ fontFamily: serif, fontStyle: serifStyle, fontSize: 'clamp(2rem, 6vw, 3.5rem)', color: GOLD }}>&</span>
          <div style={{ flex: 1, maxWidth: '6rem', height: 1, background: GOLD_DIM }} />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 36, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 1.3, delay: 0.7 + delayOffset, ease: [0.16, 1, 0.3, 1] }}
          style={{ fontFamily: serif, fontStyle: serifStyle, fontWeight: 400, fontSize: 'clamp(4rem, 13vw, 8rem)', lineHeight: 1.15, letterSpacing: '-0.02em', margin: 0, ...NAME_GRADIENT }}
        >
          {secondName}
        </motion.h1>
      </div>
    );
  }
  return (
    <div style={{ padding: '0.2em 0' }}>
      <motion.h1
        initial={{ opacity: 0, y: 36, filter: 'blur(8px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 1.3, delay: 0.5 + delayOffset, ease: [0.16, 1, 0.3, 1] }}
        style={{ fontFamily: serif, fontStyle: serifStyle, fontWeight: 400, fontSize: 'clamp(4rem, 13vw, 8rem)', lineHeight: 1.15, letterSpacing: '-0.02em', ...NAME_GRADIENT }}
      >
        {firstName}
      </motion.h1>
    </div>
  );
}

// ─── Shared hero slide ───────────────────────────────────────────────────────
interface HeroSlideProps {
  heroRef: React.RefObject<HTMLElement>;
  overline: string;
  /** Personal invite: name of the guest. Omit for generic invites. */
  guestName?: string | null;
  firstName: string;
  secondName: string | null;
  cityPart?: string | null;
  /** Event details — shown only when all three are provided */
  date?: string | null;
  time?: string | null;
  venueName?: string | null;
  venueMapUrl?: string | null;
  targetDateTime?: string | null;
  /** Assigned table number — shown only for Tashkent personal invitations */
  tableNumber?: number | null;
  /** Compact layout for short-viewport devices (< 700 px tall) */
  isShortScreen?: boolean;
  ctaLabel: string;
  onCtaClick: () => void;
}

function HeroSlide({
  heroRef, overline, guestName, firstName, secondName, cityPart,
  date, time, venueName, venueMapUrl, targetDateTime, tableNumber,
  isShortScreen, ctaLabel, onCtaClick,
}: HeroSlideProps) {
  const t = useTranslation();
  const hasEventDetails = !!(date && time && venueName);
  return (
    <section
      ref={heroRef}
      className="garden-slide"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: PARCHMENT }}
      aria-label={overline}
    >
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 0, background: 'radial-gradient(ellipse 65% 55% at 50% 45%, rgba(240,200,204,0.3) 0%, transparent 70%)' }} />
      <FloatingPetals petals={HERO_PETALS} />
      <VineCornerTL inView={true} />
      <VineCornerBR inView={true} />

      <div
        className="hero-inner"
        style={{
          position: 'relative', zIndex: 10, width: '100%', maxWidth: '68rem', textAlign: 'center',
          padding: hasEventDetails
            ? 'clamp(5.5rem, 10vh, 8rem) clamp(1.5rem, 6vw, 4rem) clamp(2rem, 5vh, 4rem)'
            : 'clamp(5.5rem, 10vh, 8rem) clamp(1.5rem, 6vw, 4rem) clamp(3rem, 7vh, 5rem)',
        }}
      >
        {/* Overline */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: guestName ? '0.5rem' : '1rem' }}
        >
          <div style={{ width: 36, height: 1, background: ROSE, opacity: 0.6 }} aria-hidden="true" />
          <span style={{ fontFamily: sans, fontSize: '0.72rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: ROSE, fontWeight: 500 }}>
            {overline}
          </span>
          <div style={{ width: 36, height: 1, background: ROSE, opacity: 0.6 }} aria-hidden="true" />
        </motion.div>

        {/* Guest name — only on personal invites */}
        {guestName && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.42 }}
              style={{ marginBottom: 'clamp(0.75rem, 2vh, 1.25rem)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}
            >
              {/* Honorific label — small caps, rose */}
              <span style={{ fontFamily: sans, fontSize: '0.9rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: ROSE, fontWeight: 500 }}>
                {t.honorific}
              </span>

              {/* Guest name — Cormorant Garamond for full Turkish/extended character support */}
              <span style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontStyle: 'italic', fontSize: 'clamp(2rem, 6vw, 3.2rem)', color: ESPRESSO, display: 'block', fontWeight: 400, lineHeight: 1.2, letterSpacing: '0.01em' }}>
                {guestName}
              </span>

              {/* Gold accent underline */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.55, delay: 0.72, ease: [0.22, 1, 0.36, 1] }}
                style={{ height: 1.5, width: '55%', maxWidth: '12rem', background: `linear-gradient(to right, transparent, ${GOLD}, transparent)`, borderRadius: 2, transformOrigin: 'center' }}
                aria-hidden="true"
              />
            </motion.div>

            {/* Separator between guest name and couple names */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: 'clamp(0.6rem, 1.5vh, 1rem)' }}
              aria-hidden="true"
            >
              <div style={{ height: 1, width: 40, background: `linear-gradient(to right, transparent, ${GOLD_DIM})` }} />
              <svg width="10" height="10" viewBox="0 0 10 10" fill={ROSE} opacity={0.55}>
                <path d="M5 1 L6.2 3.8 L9.5 4.1 L7.2 6.3 L7.9 9.5 L5 7.9 L2.1 9.5 L2.8 6.3 L0.5 4.1 L3.8 3.8 Z" />
              </svg>
              <div style={{ height: 1, width: 40, background: `linear-gradient(to left, transparent, ${GOLD_DIM})` }} />
            </motion.div>
          </>
        )}

        {/* Couple names */}
        <CoupleNames firstName={firstName} secondName={secondName} delayOffset={guestName ? 0.2 : 0} />

        {/* City */}
        {cityPart && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: guestName ? 1.3 : 1.2, duration: 0.6 }}
            style={{ fontFamily: sans, fontSize: '0.82rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: GOLD, marginTop: 'clamp(0.4rem, 1vh, 0.75rem)' }}
          >
            {cityPart}
          </motion.p>
        )}

        {/* ♡ divider */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: hasEventDetails ? 1.4 : 1.1 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', margin: `clamp(${hasEventDetails ? '0.75rem' : '1.5rem'}, ${hasEventDetails ? '2' : '3'}vh, ${hasEventDetails ? '1.5rem' : '2rem'}) 0` }}
          aria-hidden="true"
        >
          <div style={{ height: 1, width: 60, background: `linear-gradient(to right, transparent, ${GOLD_DIM})` }} />
          <span style={{ color: ROSE, fontSize: '0.9rem' }}>♡</span>
          <div style={{ height: 1, width: 60, background: `linear-gradient(to left, transparent, ${GOLD_DIM})` }} />
        </motion.div>

        {/* Date / time / venue — only when event details are available */}
        {hasEventDetails && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.5 }}
            style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '0.5rem 1rem', marginBottom: 'clamp(0.75rem, 2vh, 1.25rem)' }}
          >
            <span style={{ fontFamily: sans, fontSize: '0.88rem', letterSpacing: '0.04em', color: ESPRESSO_DIM }}>{date}</span>
            <span style={{ color: GOLD_DIM, fontSize: '0.65rem' }} aria-hidden="true">◆</span>
            <span style={{ fontFamily: sans, fontSize: '0.88rem', letterSpacing: '0.04em', color: ESPRESSO_DIM }}>{time}</span>
            <span style={{ color: GOLD_DIM, fontSize: '0.65rem' }} aria-hidden="true">◆</span>
            {venueMapUrl ? (
              <a
                href={venueMapUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: sans, fontSize: '0.88rem', letterSpacing: '0.04em',
                  color: GOLD, textDecoration: 'none',
                  borderBottom: `1px dashed ${GOLD_DIM}`,
                  display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                }}
                aria-label={`Open ${venueName} in maps`}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                {venueName}
              </a>
            ) : (
              <span style={{ fontFamily: sans, fontSize: '0.88rem', letterSpacing: '0.04em', color: ESPRESSO_DIM }}>{venueName}</span>
            )}
          </motion.div>
        )}

        {/* Assigned table number — hidden on short screens to protect CTA visibility */}
        {tableNumber != null && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.6 }}
            className="table-badge"
            style={{ marginBottom: 'clamp(0.5rem, 1.5vh, 1rem)', display: 'flex', justifyContent: 'center' }}
          >
            <span style={{
              fontFamily: sans,
              fontSize: '0.78rem',
              fontWeight: 600,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: GOLD,
              background: 'rgba(184,146,74,0.1)',
              border: `1px solid ${GOLD_DIM}`,
              borderRadius: '999px',
              padding: '0.35rem 1.1rem',
            }}>
              Table {tableNumber}
            </span>
          </motion.div>
        )}

        {/* Countdown — only when targetDateTime is available */}
        {targetDateTime && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: tableNumber != null ? 1.75 : 1.65 }}
            style={{ marginBottom: 'clamp(0.5rem, 1.5vh, 1.25rem)' }}
          >
            <CountdownTimer targetDate={targetDateTime} compact={isShortScreen} />
          </motion.div>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: hasEventDetails ? 1.8 : 1.3 }}
        >
          <MagneticButton onClick={onCtaClick} className="btn-primary" aria-label={ctaLabel}>
            {ctaLabel}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 9l-7 7-7-7"/>
            </svg>
          </MagneticButton>
        </motion.div>

        <ScrollCue inView={true} />
      </div>
    </section>
  );
}

// ─── Shared RSVP slide ────────────────────────────────────────────────────────
function RSVPSlide({
  rsvpRef, rsvpInView, formContent,
}: {
  rsvpRef: React.RefObject<HTMLElement>;
  rsvpInView: boolean;
  formContent: React.ReactNode;
}) {
  const t = useTranslation();
  return (
    <section
      ref={rsvpRef}
      id="rsvp"
      className="garden-slide-tall"
      style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', background: CREAM }}
      aria-label={t.kindlyReply}
    >
      <VineCornerBR inView={rsvpInView} />
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 0, background: 'radial-gradient(ellipse 60% 55% at 50% 50%, rgba(240,200,204,0.18) 0%, transparent 70%)' }} />

      <div style={{
        maxWidth: '38rem',
        margin: '0 auto',
        width: '100%',
        /* top: space below fixed nav bar; bottom: safe area + a little extra so iPhone home bar never overlaps */
        paddingTop: 'clamp(5rem, 9vh, 7rem)',
        paddingLeft: 'clamp(1rem, 4vw, 1.5rem)',
        paddingRight: 'clamp(1rem, 4vw, 1.5rem)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + clamp(1rem, 3vh, 2rem))',
        position: 'relative',
        zIndex: 5,
      }}>
        {/* Compact header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}
        >
          <div style={{ height: 1, flex: 1, maxWidth: '3rem', background: `linear-gradient(to right, transparent, ${ROSE})` }} aria-hidden="true" />
          <span style={{ fontFamily: sans, fontSize: '0.78rem', letterSpacing: '0.26em', textTransform: 'uppercase', color: ROSE, fontWeight: 500, whiteSpace: 'nowrap' }}>
            {t.kindlyReply}
          </span>
          <div style={{ height: 1, flex: 1, maxWidth: '3rem', background: `linear-gradient(to left, transparent, ${ROSE})` }} aria-hidden="true" />
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {formContent}
        </motion.div>

        <div style={{ textAlign: 'center', paddingTop: '1rem' }}>
          <div
            style={{ height: 1, maxWidth: '6rem', margin: '0 auto 0.5rem', background: `linear-gradient(to right, transparent, ${GOLD_DIM}, transparent)` }}
            aria-hidden="true"
          />
          <p style={{ fontFamily: sans, fontSize: '0.75rem', letterSpacing: '0.1em', color: ESPRESSO_DIM }}>
            {t.madeWithLove}
          </p>
        </div>
      </div>
    </section>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const wrapRef  = useRef<HTMLDivElement>(null);
  const heroRef  = useRef<HTMLElement>(null);
  const rsvpRef  = useRef<HTMLElement>(null);

  const rsvpInView = useInView(rsvpRef, { root: wrapRef, once: true, amount: 0.3 });

  // Always start at the hero — browser scroll-restoration can land on the RSVP slide
  // because garden-wrap is a custom overflow container that the browser doesn't reset.
  useEffect(() => {
    history.scrollRestoration = 'manual';
    if (wrapRef.current) wrapRef.current.scrollTop = 0;
    return () => { history.scrollRestoration = 'auto'; };
  }, []);

  const [current, setCurrent] = useState(0);
  const slideRefs = [heroRef, rsvpRef];

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    slideRefs.forEach((ref, i) => {
      const el = ref.current;
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setCurrent(i); },
        { root: wrapRef.current, threshold: 0.5 },
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach(o => o.disconnect());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const t = useTranslation();
  const { language, setLanguage } = useContext(LanguageContext);
  const lang = language as Language;

  const [claimSuccess, setClaimSuccess] = useState(false);
  // Must be declared before early returns to satisfy React's Rules of Hooks
  const [showForm, setShowForm] = useState(false);

  // Detect short-viewport devices (iPhone SE, small Androids) so the hero
  // can compress the countdown and hide the table badge to keep the CTA visible.
  const [isShortScreen, setIsShortScreen] = useState(false);
  useEffect(() => {
    const check = () => setIsShortScreen(window.innerHeight < 700);
    check();
    window.addEventListener('resize', check, { passive: true });
    return () => window.removeEventListener('resize', check);
  }, []);

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const el = wrapRef.current;
    if (el) {
      const h = () => setScrolled(el.scrollTop > 40);
      el.addEventListener('scroll', h, { passive: true });
      return () => el.removeEventListener('scroll', h);
    }
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['invite', token],
    queryFn: () => rsvpApi.getByToken(token!),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  // Apply the invitation's predefined language the first time the data loads.
  // The guest can still switch language afterward via the LanguageSwitcher.
  useEffect(() => {
    if (data?.type === 'personal' && data.invitation.language) {
      setLanguage(data.invitation.language as Language);
    }
  // Run only once when data first resolves — intentionally exclude setLanguage
  // to avoid re-running on every render when the context reference changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const scrollToRSVP = useCallback(() =>
    rsvpRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), []);

  const scrollToSlide = useCallback((i: number) =>
    slideRefs[i]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), []);

  // ── Loading ──
  if (isLoading) {
    return (
      <div style={{ minHeight: '100dvh', background: PARCHMENT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          style={{ width: 40, height: 40, border: `2px solid ${GOLD_DIM}`, borderTopColor: GOLD, borderRadius: '50%' }}
          aria-label={t.loadingInvitation}
        />
      </div>
    );
  }

  // ── Error / not found ──
  if (isError || !data || !token) {
    return (
      <div style={{ minHeight: '100dvh', background: PARCHMENT, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ textAlign: 'center' }}>
          <svg width="40" height="40" viewBox="0 0 48 48" fill="none" style={{ margin: '0 auto 1rem' }} aria-hidden="true">
            {[0, 60, 120, 180, 240, 300].map((angle, i) => (
              <ellipse key={i} cx="24" cy="24" rx="10" ry="5" fill={ROSE} opacity="0.5" transform={`rotate(${angle} 24 24)`} />
            ))}
            <circle cx="24" cy="24" r="5" fill={GOLD} opacity="0.7" />
          </svg>
          <h1 style={{ fontFamily: sans, fontStyle: 'normal', fontSize: '1.5rem', fontWeight: 600, color: ESPRESSO, marginBottom: '0.5rem', letterSpacing: '-0.01em' }}>
            {t.invitationNotFound}
          </h1>
          <p style={{ fontSize: '0.85rem', color: ESPRESSO_DIM, maxWidth: '22rem', margin: '0 auto 1.5rem' }}>
            {t.invitationExpired}
          </p>
          <Link
            to="/"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              fontFamily: sans, fontSize: '0.88rem', letterSpacing: '0.1em',
              color: GOLD, textDecoration: 'none', fontWeight: 500,
              padding: '0.75rem 1.6rem',
              border: `1px solid ${GOLD_DIM}`,
              borderRadius: '999px',
              background: 'rgba(253,250,245,0.6)',
            }}
          >
            ← {t.returnToHomepage}
          </Link>
        </div>
      </div>
    );
  }

  // ── Already-claimed open link ──
  if (data.type === 'claimed') {
    return (
      <div style={{ minHeight: '100dvh', background: PARCHMENT, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ textAlign: 'center', maxWidth: '28rem' }}>
          <div style={{ marginBottom: '1rem' }} aria-hidden="true">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke={ROSE} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto' }}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1 style={{ fontFamily: sans, fontStyle: 'normal', fontSize: '1.5rem', fontWeight: 600, color: ESPRESSO, marginBottom: '0.75rem', letterSpacing: '-0.01em' }}>
            {t.invitationAlreadyClaimed}
          </h1>
          <p style={{ fontSize: '0.85rem', color: ESPRESSO_DIM }}>
            {t.invitationAlreadyClaimedSub}
          </p>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════
  // ── Open (unclaimed) invitation ──
  // ════════════════════════════════════════════════════════════════
  if (data.type === 'open') {
    const openEvent      = data.events[0];
    const openEventName  = openEvent?.name ?? '';
    const openCityPart   = openEventName.includes(' \u2014 ') ? openEventName.split(' \u2014 ')[1] : null;
    const openCouplePart = openEventName.includes(' \u2014 ') ? openEventName.split(' \u2014 ')[0] : openEventName;
    const [openFirst, openSecond] = parseCoupleName(openCouplePart);
    const openMonogram   = buildMonogram(openFirst, openSecond);
    const openDate       = openEvent ? formatEventDate(openEvent.date, lang) : null;
    const openTargetDT   = openEvent?.date && openEvent?.time ? `${openEvent.date}T${openEvent.time}:00` : null;

    return (
      <div ref={wrapRef} className="garden-wrap invite-page" style={{ background: PARCHMENT, color: ESPRESSO }}>
        <div className="grain-overlay" aria-hidden="true" />
        <SideVinesFirefly wrapRef={wrapRef} />
        <InviteNav monogram={openMonogram} scrolled={scrolled} />
        <InviteDotNav current={current} onDotClick={scrollToSlide} />

        {/* ════════ HERO ════════ */}
        <HeroSlide
          heroRef={heroRef as React.RefObject<HTMLElement>}
          overline={t.youveBeenInvited}
          firstName={openFirst}
          secondName={openSecond}
          cityPart={openCityPart}
          date={openDate}
          time={openEvent?.time ?? null}
          venueName={openEvent?.venueName ?? null}
          venueMapUrl={openEvent?.venueName ? `https://maps.google.com/?q=${encodeURIComponent(openEvent.venueName)}` : null}
          targetDateTime={openTargetDT}
          isShortScreen={isShortScreen}
          ctaLabel={t.pleaseRegister}
          onCtaClick={scrollToRSVP}
        />

        {/* ════════ RSVP ════════ */}
        <RSVPSlide
          rsvpRef={rsvpRef as React.RefObject<HTMLElement>}
          rsvpInView={rsvpInView}
          formContent={
            claimSuccess
              ? <ClaimSuccessScreen />
              : <OpenInviteForm token={data.token} isPublic={data.isPublic} events={data.events} onSuccess={() => setClaimSuccess(true)} />
          }
        />
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════
  // ── Personal (pre-assigned) invitation ──
  // ════════════════════════════════════════════════════════════════
  const { invitation, guest, event } = data;
  const displayDate    = formatEventDate(event.date, lang);
  const targetDateTime = `${event.date}T${event.time}:00`;
  const coupleName     = event.name.includes(' \u2014 ') ? event.name.split(' \u2014 ')[0] : event.name;
  const eventCity      = event.name.includes(' \u2014 ') ? event.name.split(' \u2014 ')[1] : null;
  const [firstName, secondName] = parseCoupleName(coupleName);
  const monogram = buildMonogram(firstName, secondName);
  const partnerName = guest.partnerName ?? null;

  // Google Calendar deep-link for post-RSVP "Add to Calendar" CTA
  const calendarUrl = (() => {
    if (!event.date || !event.time) return undefined;
    const [y, mo, d] = event.date.split('-');
    const [h, mi] = event.time.split(':');
    const start = `${y}${mo}${d}T${h}${mi}00`;
    const endHour = String(parseInt(h, 10) + 4).padStart(2, '0');
    const end = `${y}${mo}${d}T${endHour}${mi}00`;
    const qs = new URLSearchParams({
      action: 'TEMPLATE',
      text: coupleName,
      dates: `${start}/${end}`,
      ...(event.venueName ? { location: event.venueName } : {}),
    });
    return `https://calendar.google.com/calendar/render?${qs.toString()}`;
  })();

  // When the admin pre-sets a guest as attending, skip the RSVP form and
  // land directly on the confirmed success screen. The guest can still click
  // "Update RSVP" to open the form and change their response.
  const isPreConfirmed = invitation.status === 'attending';

  const prefill = {
    name:           guest.name,
    status:         invitation.status,
    guestCount:     invitation.guestCount,
    dietary:        invitation.dietary,
    partnerDietary: invitation.partnerDietary ?? null,
    message:        invitation.message,
  };

  const tableNumber = invitation.tableNumber ?? null;

  return (
    <div ref={wrapRef} className="garden-wrap invite-page" style={{ background: PARCHMENT, color: ESPRESSO }}>
      <div className="grain-overlay" aria-hidden="true" />
      <SideVinesFirefly wrapRef={wrapRef} />
      <InviteNav monogram={monogram} scrolled={scrolled} />
      <InviteDotNav current={current} onDotClick={scrollToSlide} />

      {/* ════════ HERO ════════ */}
      <HeroSlide
        heroRef={heroRef as React.RefObject<HTMLElement>}
        overline={t.personalInvitationFor}
        guestName={guest.name + (partnerName ? ` & ${partnerName}` : '')}
        firstName={firstName}
        secondName={secondName}
        cityPart={eventCity}
        date={displayDate}
        time={event.time}
        venueName={event.venueName}
        venueMapUrl={event.venueName ? `https://maps.google.com/?q=${encodeURIComponent(event.venueName)}` : null}
        targetDateTime={targetDateTime}
        tableNumber={tableNumber}
        isShortScreen={isShortScreen}
        ctaLabel={isPreConfirmed && !showForm ? t.rsvpConfirmed : t.rsvpButton}
        onCtaClick={scrollToRSVP}
      />

      {/* ════════ RSVP / Confirmation ════════ */}
      <RSVPSlide
        rsvpRef={rsvpRef as React.RefObject<HTMLElement>}
        rsvpInView={rsvpInView}
        formContent={
          isPreConfirmed && !showForm
            ? <SuccessScreen
                guestName={guest.name}
                partnerName={partnerName}
                status="attending"
                guestCount={invitation.guestCount}
                isUpdate={false}
                calendarUrl={calendarUrl}
                onUpdateRsvp={() => setShowForm(true)}
              />
            : <RSVPForm
                token={token}
                eventName={event.name}
                prefillData={prefill}
                partnerName={partnerName}
                calendarUrl={calendarUrl}
              />
        }
      />
    </div>
  );
}
