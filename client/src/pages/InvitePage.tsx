import { useRef, useContext, useState, useEffect, useCallback } from 'react';
import type { CSSProperties } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import CountdownTimer from '../components/CountdownTimer';
import RSVPForm from '../components/RSVPForm';
import SuccessScreen from '../components/SuccessScreen';
import ConfirmationPanel from '../components/ConfirmationPanel';
import NudgeRibbon from '../components/NudgeRibbon';
import InviteSkeleton from '../components/InviteSkeleton';
import LanguageSwitcher from '../components/LanguageSwitcher';
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
import { buildGoogleCalendarUrl, buildIcsBlobUrl } from '../lib/calendar';
import {
  FormCard, FormField, FormInput, FormTextarea,
  GuestCountSelect, AttendancePicker, FormSubmitButton,
  FormCharCounter,
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

// ─── Public RSVP form (permanent, reusable link) ─────────────────────────────
interface PublicInviteFormProps {
  token: string;
  eventId: number;
  calendarUrl?: string;
  icsUrl?: string;
  shareUrl?: string;
  shareCoupleName?: string;
}

const PUBLIC_MESSAGE_MAX = 1000;

function PublicInviteForm({ token, eventId, calendarUrl, icsUrl, shareUrl, shareCoupleName }: PublicInviteFormProps) {
  const t = useTranslation();

  const LS_KEY = `rsvp_pub_${eventId}`;

  type SuccessResult = {
    name: string;
    partnerName?: string;
    status: 'attending' | 'declined';
    guestCount: number;
  };

  const [successResult, setSuccessResult] = useState<SuccessResult | null>(() => {
    try {
      const stored = localStorage.getItem(LS_KEY);
      if (!stored) return null;
      const parsed = JSON.parse(stored) as SuccessResult;
      // Defensive: clamp legacy `maybe` rows to `attending` so the success
      // screen doesn't fall through to the default copy on a revisit.
      if ((parsed.status as string) !== 'attending' && (parsed.status as string) !== 'declined') {
        return { ...parsed, status: 'attending' };
      }
      return parsed;
    } catch {
      return null;
    }
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setFocus,
    formState: { errors },
  } = useForm<PublicRsvpValues>({
    resolver: zodResolver(publicRsvpSchema),
    mode: 'onBlur',
    defaultValues: { token, eventId, name: '', partnerName: '', phone: '', status: 'attending', guestCount: 1, message: '' },
  });

  const status          = watch('status') ?? 'attending';
  const guestCount      = watch('guestCount') ?? 1;
  const watchedPartner  = watch('partnerName');
  const watchedMessage  = watch('message') ?? '';

  // Bump guest count to 2 the first time a partner name is typed. We never
  // auto-decrement on clear — the previous behaviour silently overrode the
  // guest's chosen count and felt like a bug.
  const hasBumpedForPartner = useRef(false);
  useEffect(() => {
    if (watchedPartner?.trim()) {
      if (!hasBumpedForPartner.current && guestCount < 2) setValue('guestCount', 2);
      hasBumpedForPartner.current = true;
    }
  }, [watchedPartner]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const onInvalid = (errs: Record<string, unknown>) => {
    const order = ['name', 'phone', 'status', 'partnerName', 'message'] as const;
    const first = order.find((k) => k in errs);
    if (first) { try { setFocus(first as keyof PublicRsvpValues); } catch { /* ignore */ } }
  };

  const attendanceLabels = { attending: t.attendingOption, declined: t.decliningOption };

  if (successResult) {
    return (
      <SuccessScreen
        guestName={successResult.name}
        partnerName={successResult.partnerName}
        status={successResult.status}
        guestCount={successResult.guestCount}
        isUpdate={false}
        calendarUrl={calendarUrl}
        icsUrl={icsUrl}
        shareUrl={shareUrl}
        shareCoupleName={shareCoupleName}
        onUpdateRsvp={() => { try { localStorage.removeItem(LS_KEY); } catch { /* ignore */ } setSuccessResult(null); }}
      />
    );
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      onSubmit={handleSubmit((v) => submitMutation.mutate(v), onInvalid)}
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

        <FormField htmlFor="pub-partner" label={t.partnerNameLabel} optional={t.optionalLabel}>
          <FormInput id="pub-partner" type="text" {...register('partnerName')} placeholder={t.partnerNamePlaceholder} />
        </FormField>

        <FormField htmlFor="pub-phone" label={t.phoneLabel} required error={errors.phone?.message} hint={t.phoneHint}>
          <FormInput id="pub-phone" type="tel" inputMode="tel" autoComplete="tel" {...register('phone')} placeholder={t.phonePlaceholder} />
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
          <FormTextarea
            id="pub-message"
            rows={2}
            maxLength={PUBLIC_MESSAGE_MAX}
            {...register('message')}
            placeholder={t.messagePlaceholder}
          />
          <FormCharCounter value={watchedMessage} max={PUBLIC_MESSAGE_MAX} />
        </FormField>
      </FormCard>

      <div className="rsvp-submit-sticky">
        <FormSubmitButton pending={submitMutation.isPending} label={t.sendRsvp} pendingLabel={t.sending} />
      </div>
    </motion.form>
  );
}

// ─── Self-registration form for open invitations ─────────────────────────────
interface OpenInviteFormProps {
  token: string;
  isPublic: boolean;
  events: Array<{ id: number; slug: string; name: string; date: string; time: string | null; venueName: string | null }>;
  onSuccess: (claimName: string) => void;
  calendarUrl?: string;
  icsUrl?: string;
  shareUrl?: string;
  shareCoupleName?: string;
}

function OpenInviteForm({ token, isPublic, events, onSuccess, calendarUrl, icsUrl, shareUrl, shareCoupleName }: OpenInviteFormProps) {
  const t = useTranslation();

  if (isPublic) {
    return (
      <PublicInviteForm
        token={token}
        eventId={events[0]?.id ?? 0}
        calendarUrl={calendarUrl}
        icsUrl={icsUrl}
        shareUrl={shareUrl}
        shareCoupleName={shareCoupleName}
      />
    );
  }

  const {
    register,
    handleSubmit,
    control,
    watch,
    setFocus,
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
        message: '',
      })),
    },
  });

  const rsvpEntries = watch('rsvpEntries');

  const claimMutation = useMutation({
    mutationFn: rsvpApi.claim,
    onSuccess: (_data, variables) => {
      toast.success(t.registrationComplete);
      onSuccess(variables.name);
    },
    onError: () => { toast.error(t.registerFailed); },
  });

  const onInvalid = (errs: Record<string, unknown>) => {
    if ('name' in errs) { try { setFocus('name'); } catch { /* ignore */ } return; }
    if ('phone' in errs) { try { setFocus('phone'); } catch { /* ignore */ } return; }
  };

  const attendanceLabels = { attending: t.attendingOption, declined: t.decliningOption };

  return (
    <motion.form
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      onSubmit={handleSubmit((v) => claimMutation.mutate(v), onInvalid)}
      noValidate
      className="space-y-3"
    >
      <input type="hidden" {...register('token')} />

      {/* WHO'S COMING */}
      <FormCard title={t.whosComing}>
        <FormField htmlFor="claim-name" label={t.nameLabel} required error={errors.name?.message}>
          <FormInput id="claim-name" type="text" autoComplete="name" {...register('name')} placeholder={t.namePlaceholder} />
        </FormField>
        <FormField htmlFor="claim-phone" label={t.phoneLabel} optional={t.optionalLabel}>
          <FormInput id="claim-phone" type="tel" inputMode="tel" autoComplete="tel" {...register('phone')} placeholder={t.phonePlaceholder} />
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

      <div className="rsvp-submit-sticky">
        <FormSubmitButton pending={claimMutation.isPending} label={t.confirmRegistration} pendingLabel={t.registering} />
      </div>
    </motion.form>
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
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
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
      {/* Back link — unified with PublicInvitePage as `\u2190 {monogram}` so the
          affordance is unambiguous on both flows. Hover/focus colour change
          is delivered via CSS class to remain consistent across pointer +
          keyboard users. */}
      <Link to="/" className="invite-monogram-link" aria-label={t.returnToHomepage}>
        <span aria-hidden="true" style={{ marginRight: '0.45rem' }}>←</span>
        {monogram}
      </Link>
      <LanguageSwitcher />
    </motion.header>
  );
}

// ─── Shared couple name block ─────────────────────────────────────────────────
//
// Animation budget compressed (was 1.3 s × 2 = 2.6 s end-to-end with stacking
// delays from the hero, putting the countdown reveal near 2 s post-mount;
// now bounded to ~400 ms with a 0.08 s stagger) and the blur+y choreography
// is suppressed entirely when the guest prefers reduced motion.
//
// Long-name guard: compound names ("Shamsiddin", "Ekaterina-Alexandra") used
// to overflow on a 320 px viewport because `clamp(4rem, 13vw, 8rem)` produces
// 41.6 px on that width, multiplied by ~10 characters at ~0.6em that's the
// full screen wide. We pick the script font size based on the longer of the
// two names so the row breathes.
function pickCoupleNameSize(longestLength: number): string {
  // Below 8 chars: use the original cap. 8\u201312 chars: linear taper. 13+ chars:
  // clamp the upper bound so the longest name still fits on a 320 px phone.
  if (longestLength <= 7) return 'clamp(4rem, 13vw, 8rem)';
  if (longestLength <= 10) return 'clamp(3.4rem, 11vw, 6.5rem)';
  return 'clamp(2.8rem, 9vw, 5.25rem)';
}

function CoupleNames({ firstName, secondName, delayOffset = 0 }: { firstName: string; secondName: string | null; delayOffset?: number }) {
  const reduce = useReducedMotion();
  const longest = Math.max(firstName.length, secondName?.length ?? 0);
  const nameSize = pickCoupleNameSize(longest);

  const nameStyle: CSSProperties = {
    fontFamily: serif,
    fontStyle: serifStyle,
    fontWeight: 400,
    fontSize: nameSize,
    lineHeight: 1.0,
    letterSpacing: '-0.02em',
    margin: 0,
    overflowWrap: 'anywhere',
    wordBreak: 'break-word',
    ...NAME_GRADIENT,
  };

  const nameTransition = (extra: number) => ({
    duration: reduce ? 0 : 0.5,
    delay: reduce ? 0 : 0.16 + delayOffset + extra,
    ease: [0.22, 1, 0.36, 1] as const,
  });

  const nameInitial = reduce ? false : { opacity: 0, y: 16 };

  if (secondName) {
    return (
      <div style={{ padding: '0.2em 0' }}>
        <motion.h1
          initial={nameInitial}
          animate={{ opacity: 1, y: 0 }}
          transition={nameTransition(0)}
          style={nameStyle}
        >
          {firstName}
        </motion.h1>
        <motion.div
          initial={reduce ? false : { opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: reduce ? 0 : 0.3, delay: reduce ? 0 : 0.24 + delayOffset }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.25rem', margin: 'clamp(0.05rem, 0.15vw, 0.15rem) 0', transformOrigin: 'center' }}
          aria-hidden="true"
        >
          <div style={{ flex: 1, maxWidth: '4rem', height: 1, background: GOLD_DIM }} />
          <span style={{ fontFamily: serif, fontStyle: serifStyle, fontSize: 'clamp(2.8rem, 8vw, 4.8rem)', color: GOLD, lineHeight: 1 }}>&amp;</span>
          <div style={{ flex: 1, maxWidth: '4rem', height: 1, background: GOLD_DIM }} />
        </motion.div>
        <motion.h1
          initial={nameInitial}
          animate={{ opacity: 1, y: 0 }}
          transition={nameTransition(0.08)}
          style={nameStyle}
        >
          {secondName}
        </motion.h1>
      </div>
    );
  }
  return (
    <div style={{ padding: '0.2em 0' }}>
      <motion.h1
        initial={nameInitial}
        animate={{ opacity: 1, y: 0 }}
        transition={nameTransition(0)}
        style={nameStyle}
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
  /** Click handler for the primary "Confirm Attendance" CTA */
  onConfirmClick?: () => void;
  /** When false, the primary CTA is hidden (e.g. pre-confirmed personal guests) */
  showConfirmCta?: boolean;
}

function HeroSlide({
  heroRef, overline, guestName, firstName, secondName, cityPart,
  date, time, venueName, venueMapUrl, targetDateTime, tableNumber,
  isShortScreen, onConfirmClick, showConfirmCta = true,
}: HeroSlideProps) {
  const t = useTranslation();
  const reduce = useReducedMotion();
  const hasEventDetails = !!(date && time && venueName);

  // Animation budget capped at \u22640.4 s of stagger so the countdown is
  // visible within ~600 ms of mount instead of the previous ~1.75 s.
  // Reduced-motion users see content snap in instantly.
  const fadeIn = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduce ? 0 : 0.35, delay: reduce ? 0 : delay, ease: [0.22, 1, 0.36, 1] as const },
  });

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
          {...fadeIn(0)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: guestName ? '0.3rem' : '1rem' }}
        >
          <div style={{ width: 36, height: 1, background: ROSE, opacity: 0.6 }} aria-hidden="true" />
          <span style={{ fontFamily: sans, fontSize: '0.85rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: ROSE, fontWeight: 600 }}>
            {overline}
          </span>
          <div style={{ width: 36, height: 1, background: ROSE, opacity: 0.6 }} aria-hidden="true" />
        </motion.div>

        {/* Guest personalisation \u2014 honorific in caps + guest name in
            an italic serif. Routed explicitly to --font-script-i18n
            (Cormorant Garamond italic) rather than --font-display so
            Turkish characters in guest names (İ ı Ş ş Ğ ğ \u2026)
            render consistently in the same typeface as the rest of
            the line. The display script (GlossilyEnigmatic) lacks
            Latin Extended-A and is reserved for the couple names. */}
        {guestName && (
          <motion.div
            {...fadeIn(0.04)}
            style={{
              marginBottom: 'clamp(0.65rem, 1.6vh, 1rem)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.2rem',
              padding: '0 1rem',
            }}
          >
            <span style={{
              fontFamily: sans,
              fontSize: '0.7rem',
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: ROSE,
              fontWeight: 600,
            }}>
              {t.honorific}
            </span>
            <span style={{
              fontFamily: 'var(--font-script-i18n)',
              fontStyle: 'italic',
              fontSize: 'clamp(1.5rem, 4.4vw, 2.15rem)',
              color: ESPRESSO,
              fontWeight: 500,
              letterSpacing: '0.005em',
              lineHeight: 1.2,
              overflowWrap: 'anywhere',
              wordBreak: 'break-word',
            }}>
              {guestName}
            </span>
          </motion.div>
        )}

        {/* Couple names */}
        <CoupleNames firstName={firstName} secondName={secondName} delayOffset={guestName ? 0.04 : 0} />

        {/* \u2661 divider */}
        <motion.div
          {...fadeIn(reduce ? 0 : 0.28)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', margin: `clamp(${hasEventDetails ? '0.75rem' : '1.5rem'}, ${hasEventDetails ? '2' : '3'}vh, ${hasEventDetails ? '1.5rem' : '2rem'}) 0` }}
          aria-hidden="true"
        >
          <div style={{ height: 1, width: 60, background: `linear-gradient(to right, transparent, ${GOLD_DIM})` }} />
          <span style={{ color: ROSE, fontSize: '0.9rem' }}>♡</span>
          <div style={{ height: 1, width: 60, background: `linear-gradient(to left, transparent, ${GOLD_DIM})` }} />
        </motion.div>

        {/* Single editorial microline: city \u00b7 date \u00b7 time \u00b7 venue.
            The previous design had two separate rows for the city caps and
            the date/time/venue triplet which double-named the city for
            most venues. Combining them sharpens hierarchy without losing
            information; the venue itself remains the map link. */}
        {(hasEventDetails || cityPart) && (
          <motion.div
            {...fadeIn(reduce ? 0 : 0.3)}
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem 0.85rem',
              marginBottom: 'clamp(0.6rem, 1.6vh, 1rem)',
            }}
          >
            {cityPart && (
              <>
                <span style={{ fontFamily: sans, fontSize: '0.78rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLD, fontWeight: 600 }}>{cityPart}</span>
                {hasEventDetails && <span style={{ color: GOLD_DIM, fontSize: '0.6rem' }} aria-hidden="true">◆</span>}
              </>
            )}
            {hasEventDetails && (
              <>
                <span style={{ fontFamily: sans, fontSize: '0.88rem', letterSpacing: '0.04em', color: ESPRESSO_DIM }}>{date}</span>
                <span style={{ color: GOLD_DIM, fontSize: '0.6rem' }} aria-hidden="true">◆</span>
                <span style={{ fontFamily: sans, fontSize: '0.88rem', letterSpacing: '0.04em', color: ESPRESSO_DIM }}>{time}</span>
                <span style={{ color: GOLD_DIM, fontSize: '0.6rem' }} aria-hidden="true">◆</span>
                {venueMapUrl ? (
                  <a
                    href={venueMapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="venue-link"
                    style={{
                      fontFamily: sans,
                      fontSize: '0.92rem',
                      letterSpacing: '0.03em',
                      color: ESPRESSO,
                      fontWeight: 600,
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      paddingBottom: 1,
                      borderBottom: '1px solid transparent',
                      transition: 'border-color 0.25s ease, color 0.25s ease',
                    }}
                    aria-label={`${venueName} — ${t.openInMaps}`}
                  >
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={GOLD}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      style={{ flexShrink: 0 }}
                    >
                      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span>{venueName}</span>
                  </a>
                ) : (
                  <span style={{ fontFamily: sans, fontSize: '0.92rem', letterSpacing: '0.03em', color: ESPRESSO, fontWeight: 600 }}>
                    {venueName}
                  </span>
                )}
              </>
            )}
          </motion.div>
        )}

        {/* Assigned table number — restrained editorial caps line.
            Quiet typography (the operational pill lives on the
            ConfirmationPanel / SuccessScreen). Still hidden on short
            screens via the .table-badge media rule. */}
        {tableNumber != null && (
          <motion.div
            {...fadeIn(reduce ? 0 : 0.32)}
            className="table-badge"
            style={{ marginBottom: 'clamp(0.6rem, 1.6vh, 1rem)', display: 'flex', justifyContent: 'center' }}
          >
            <span
              style={{
                fontFamily: sans,
                fontSize: '0.7rem',
                fontWeight: 500,
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                color: ESPRESSO_DIM,
              }}
              aria-label={`${t.tableLabel} ${tableNumber}`}
            >
              {t.tableLabel} {tableNumber}
            </span>
          </motion.div>
        )}

        {/* Countdown — only when targetDateTime is available */}
        {targetDateTime && (
          <motion.div
            {...fadeIn(reduce ? 0 : 0.36)}
            style={{ marginBottom: 'clamp(0.75rem, 2vh, 1.5rem)' }}
          >
            <CountdownTimer targetDate={targetDateTime} compact={isShortScreen} />
          </motion.div>
        )}

        {/* Primary CTA \u2014 unified across personal / open / public flows.
            Previously the personal hero had no CTA at all, leaving guests
            to discover the form via the dot nav (hidden under 600 px) or
            scrolling. The button + bouncing chevron cue make the next
            action explicit on every device size. */}
        {showConfirmCta && onConfirmClick && (
          <>
            <motion.div
              {...fadeIn(reduce ? 0 : 0.4)}
              className="hero-cta-sticky"
            >
              <button
                type="button"
                onClick={onConfirmClick}
                className="btn-primary"
                aria-label={t.rsvpButton}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              >
                {t.rsvpButton}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </motion.div>

            {/* Scroll cue — bouncing chevrons + caption. Suppressed on
                reduce-motion. */}
            {!reduce && (
              <motion.div
                {...fadeIn(0.5)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', marginTop: 'clamp(0.75rem, 2vh, 1.5rem)' }}
                aria-hidden="true"
              >
                {[0, 1].map((i) => (
                  <motion.svg
                    key={i}
                    width="16" height="10" viewBox="0 0 16 10" fill="none"
                    animate={{ opacity: [0.2, 0.8, 0.2], y: [0, 4, 0] }}
                    transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut', delay: i * 0.25 }}
                  >
                    <path d="M1 1L8 8L15 1" stroke={ROSE} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </motion.svg>
                ))}
                <span style={{ fontFamily: sans, fontSize: '0.65rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: ESPRESSO_DIM, marginTop: '0.1rem' }}>
                  {t.scrollToRsvp}
                </span>
              </motion.div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

// ─── Shared RSVP slide ────────────────────────────────────────────────────────
function RSVPSlide({
  rsvpRef, rsvpInView, formContent, hideHeader,
}: {
  rsvpRef: React.RefObject<HTMLElement>;
  rsvpInView: boolean;
  formContent: React.ReactNode;
  /**
   * Pre-confirmed personal guests get the ConfirmationPanel which is its own
   * self-contained heading + body. In that case we suppress the "Kindly reply"
   * caps row + seating note since they conflict with the panel's "Your seat
   * is reserved" framing.
   */
  hideHeader?: boolean;
}) {
  const t = useTranslation();
  return (
    <section
      ref={rsvpRef}
      id="rsvp"
      className="garden-slide-tall"
      style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', background: CREAM }}
      aria-label={hideHeader ? t.preConfirmedOverline : t.kindlyReply}
    >
      <VineCornerBR inView={rsvpInView} />
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 0, background: 'radial-gradient(ellipse 60% 55% at 50% 50%, rgba(240,200,204,0.18) 0%, transparent 70%)' }} />

      <div style={{
        maxWidth: '38rem',
        margin: '0 auto',
        width: '100%',
        paddingTop: 'clamp(5rem, 9vh, 7rem)',
        paddingLeft: 'clamp(1rem, 4vw, 1.5rem)',
        paddingRight: 'clamp(1rem, 4vw, 1.5rem)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + clamp(1rem, 3vh, 2rem))',
        position: 'relative',
        zIndex: 5,
      }}>
        {!hideHeader && (
          <>
            {/* Compact header */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.35, delay: 0.05 }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}
            >
              <div style={{ height: 1, flex: 1, maxWidth: '3rem', background: `linear-gradient(to right, transparent, ${ROSE})` }} aria-hidden="true" />
              <span style={{ fontFamily: sans, fontSize: '0.78rem', letterSpacing: '0.26em', textTransform: 'uppercase', color: ROSE, fontWeight: 500, whiteSpace: 'nowrap' }}>
                {t.kindlyReply}
              </span>
              <div style={{ height: 1, flex: 1, maxWidth: '3rem', background: `linear-gradient(to left, transparent, ${ROSE})` }} aria-hidden="true" />
            </motion.div>

            {/* Seating preference note */}
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.35, delay: 0.08 }}
              style={{
                fontFamily: sans,
                fontSize: '0.8rem',
                lineHeight: 1.6,
                letterSpacing: '0.02em',
                color: ESPRESSO_DIM,
                textAlign: 'center',
                marginBottom: '1.25rem',
                fontStyle: 'italic',
              }}
            >
              {t.seatingPreferenceNote}
            </motion.p>
          </>
        )}

        {/* Form / confirmation panel */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.35, delay: 0.1 }}
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
  const { language, setLanguageFromInvitation } = useContext(LanguageContext);
  const lang = language as Language;

  const [claimSuccess, setClaimSuccess] = useState<{ name: string } | null>(null);
  // Must be declared before early returns to satisfy React's Rules of Hooks
  const [showForm, setShowForm] = useState(false);

  // Soft nudge ribbon — shown ~5 s after landing on the hero slide, but only
  // if the guest has not yet responded. Three dismiss paths: \u00d7, Escape, or the
  // backdrop (= any tap outside the ribbon). Gated on sessionStorage so it
  // only shows once per session. The previous full-screen blur modal counted
  // a backdrop click as a confirm \u2014 a known anti-pattern that's been removed.
  const [nudgeShown, setNudgeShown] = useState(false);
  const nudgeDataRef = useRef<typeof data>(undefined);

  useEffect(() => {
    const wrap = wrapRef.current;
    let fired = false;

    const cancel = () => {
      if (!fired) clearTimeout(timerId);
    };

    const timerId = setTimeout(() => {
      fired = true;
      try {
        if (sessionStorage.getItem('invite-nudge-shown') === '1') return;
      } catch { /* private mode */ }
      const d = nudgeDataRef.current;
      if (!d) return;
      if (d.type === 'personal' && d.invitation.status !== 'pending') return;
      if (wrapRef.current && wrapRef.current.scrollTop < 50) {
        setNudgeShown(true);
        try { sessionStorage.setItem('invite-nudge-shown', '1'); } catch { /* ignore */ }
      }
    }, 5000);

    wrap?.addEventListener('scroll', cancel, { once: true, passive: true });
    wrap?.addEventListener('touchstart', cancel, { once: true, passive: true });

    return () => {
      clearTimeout(timerId);
      wrap?.removeEventListener('scroll', cancel);
      wrap?.removeEventListener('touchstart', cancel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Differentiate transient network errors (worth retrying) from a definite
  // 404 / 410 (don't retry, just show the friendly "not found" copy).
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['invite', token],
    queryFn: () => rsvpApi.getByToken(token!),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, err: unknown) => {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404 || status === 410) return false;
      return failureCount < 1;
    },
    retryDelay: 600,
  });

  useEffect(() => { nudgeDataRef.current = data; }, [data]);

  // Apply the invitation's predefined language the first time the data
  // resolves \u2014 but only if the guest hasn't manually selected a language.
  useEffect(() => {
    if (data?.type === 'personal' && data.invitation.language) {
      setLanguageFromInvitation(data.invitation.language as Language);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const scrollToRSVP = useCallback(() =>
    rsvpRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), []);

  const scrollToSlide = useCallback((i: number) =>
    slideRefs[i]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), []);

  // ── Loading ──
  if (isLoading) {
    return <InviteSkeleton />;
  }

  // ── Error / not found ──
  if (isError || !data || !token) {
    // Detect transient (network / 5xx) vs definite (404 / 410) errors.
    const status = (error as { response?: { status?: number } })?.response?.status;
    const isNotFound = status === 404 || status === 410;
    return (
      <div style={{ minHeight: '100dvh', background: PARCHMENT, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ textAlign: 'center', maxWidth: '24rem' }}>
          <svg width="40" height="40" viewBox="0 0 48 48" fill="none" style={{ margin: '0 auto 1rem' }} aria-hidden="true">
            {[0, 60, 120, 180, 240, 300].map((angle, i) => (
              <ellipse key={i} cx="24" cy="24" rx="10" ry="5" fill={ROSE} opacity="0.5" transform={`rotate(${angle} 24 24)`} />
            ))}
            <circle cx="24" cy="24" r="5" fill={GOLD} opacity="0.7" />
          </svg>
          <h1 style={{ fontFamily: sans, fontStyle: 'normal', fontSize: '1.5rem', fontWeight: 600, color: ESPRESSO, marginBottom: '0.5rem', letterSpacing: '-0.01em' }}>
            {isNotFound ? t.invitationNotFound : t.invitationOffline}
          </h1>
          <p style={{ fontSize: '0.85rem', color: ESPRESSO_DIM, margin: '0 auto 1.5rem' }}>
            {isNotFound ? t.invitationExpired : t.invitationOfflineSub}
          </p>
          <div style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
            {!isNotFound && (
              <button
                type="button"
                onClick={() => refetch()}
                disabled={isFetching}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                  fontFamily: sans, fontSize: '0.78rem', letterSpacing: '0.1em',
                  textTransform: 'uppercase', fontWeight: 600,
                  color: '#FAF7F2', background: GOLD,
                  textDecoration: 'none',
                  padding: '0.7rem 1.5rem', minHeight: '44px',
                  border: 'none', borderRadius: '999px',
                  cursor: isFetching ? 'wait' : 'pointer',
                  opacity: isFetching ? 0.7 : 1,
                }}
              >
                {t.retryAction}
              </button>
            )}
            <Link
              to="/"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                fontFamily: sans, fontSize: '0.78rem', letterSpacing: '0.1em',
                textTransform: 'uppercase', fontWeight: 600,
                color: GOLD, textDecoration: 'none',
                padding: '0.7rem 1.5rem', minHeight: '44px',
                border: `1px solid ${GOLD_DIM}`,
                borderRadius: '999px',
                background: 'rgba(253,250,245,0.6)',
              }}
            >
              ← {t.returnToHomepage}
            </Link>
          </div>
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

    // Calendar + share affordances are derived from the first event in the
    // open-invite payload (multi-event open invites are rare in practice).
    const openCalendar = (openEvent?.date && openEvent?.time)
      ? {
          calendarUrl: buildGoogleCalendarUrl({
            title: openCouplePart,
            startDate: openEvent.date,
            startTime: openEvent.time,
            location: openEvent.venueName ?? null,
          }),
          icsUrl: buildIcsBlobUrl({
            title: openCouplePart,
            startDate: openEvent.date,
            startTime: openEvent.time,
            location: openEvent.venueName ?? null,
          }),
        }
      : { calendarUrl: undefined, icsUrl: undefined };

    const shareUrl = typeof window !== 'undefined' ? window.location.href : undefined;

    return (
      <div ref={wrapRef} className="garden-wrap invite-page" style={{ background: PARCHMENT, color: ESPRESSO }}>
        <div className="grain-overlay" aria-hidden="true" />
        <SideVinesFirefly wrapRef={wrapRef} />
        <InviteNav monogram={openMonogram} scrolled={scrolled} />
        <InviteDotNav current={current} onDotClick={scrollToSlide} />
        <NudgeRibbon
          open={nudgeShown}
          onConfirm={() => { setNudgeShown(false); scrollToRSVP(); }}
          onDismiss={() => setNudgeShown(false)}
        />

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
          onConfirmClick={scrollToRSVP}
          showConfirmCta={!claimSuccess}
        />

        {/* ════════ RSVP ════════ */}
        <RSVPSlide
          rsvpRef={rsvpRef as React.RefObject<HTMLElement>}
          rsvpInView={rsvpInView}
          formContent={
            claimSuccess
              ? (
                <SuccessScreen
                  guestName={claimSuccess.name}
                  status="attending"
                  guestCount={1}
                  isUpdate={false}
                  calendarUrl={openCalendar.calendarUrl}
                  icsUrl={openCalendar.icsUrl}
                  shareUrl={shareUrl}
                  shareCoupleName={openCouplePart}
                  onUpdateRsvp={() => setClaimSuccess(null)}
                />
              )
              : (
                <OpenInviteForm
                  token={data.token}
                  isPublic={data.isPublic}
                  events={data.events}
                  onSuccess={(name) => setClaimSuccess({ name })}
                  calendarUrl={openCalendar.calendarUrl}
                  icsUrl={openCalendar.icsUrl}
                  shareUrl={shareUrl}
                  shareCoupleName={openCouplePart}
                />
              )
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

  // Calendar export \u2014 Google deep-link + .ics blob (the latter covers Apple,
  // Outlook, Fantastical, etc. natively).
  const calendarUrl = (event.date && event.time)
    ? buildGoogleCalendarUrl({
        title: coupleName,
        startDate: event.date,
        startTime: event.time,
        location: event.venueName ?? null,
      })
    : undefined;
  const icsUrl = (event.date && event.time)
    ? buildIcsBlobUrl({
        title: coupleName,
        startDate: event.date,
        startTime: event.time,
        location: event.venueName ?? null,
      })
    : undefined;

  const shareUrl = typeof window !== 'undefined' ? window.location.href : undefined;

  // When the admin pre-sets a guest as attending, skip the RSVP form and
  // land directly on the ConfirmationPanel (purpose-built, not the generic
  // SuccessScreen on a slide titled "Kindly reply"). The guest can still
  // tap "Update RSVP" to open the form and change their response.
  const isPreConfirmed = invitation.status === 'attending';

  const prefill = {
    name:           guest.name,
    status:         invitation.status,
    guestCount:     invitation.guestCount,
    message:        invitation.message,
  };

  const tableNumber = invitation.tableNumber ?? null;

  return (
    <div ref={wrapRef} className="garden-wrap invite-page" style={{ background: PARCHMENT, color: ESPRESSO }}>
      <div className="grain-overlay" aria-hidden="true" />
      <SideVinesFirefly wrapRef={wrapRef} />
      <InviteNav monogram={monogram} scrolled={scrolled} />
      <InviteDotNav current={current} onDotClick={scrollToSlide} />
      <NudgeRibbon
        open={nudgeShown}
        onConfirm={() => { setNudgeShown(false); scrollToRSVP(); }}
        onDismiss={() => setNudgeShown(false)}
      />

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
        onConfirmClick={scrollToRSVP}
        // Pre-confirmed guests don't need a "Confirm Attendance" CTA on the hero \u2014
        // their next action is the confirmation panel below.
        showConfirmCta={!isPreConfirmed}
      />

      {/* ════════ RSVP / Confirmation ════════ */}
      <RSVPSlide
        rsvpRef={rsvpRef as React.RefObject<HTMLElement>}
        rsvpInView={rsvpInView}
        hideHeader={isPreConfirmed && !showForm}
        formContent={
          isPreConfirmed && !showForm
            ? (
              <ConfirmationPanel
                guestName={guest.name}
                partnerName={partnerName}
                guestCount={invitation.guestCount}
                tableNumber={tableNumber}
                calendarUrl={calendarUrl}
                icsUrl={icsUrl}
                shareUrl={shareUrl}
                shareCoupleName={coupleName}
                onUpdateRsvp={() => setShowForm(true)}
              />
            )
            : (
              <RSVPForm
                token={token}
                eventName={event.name}
                prefillData={prefill}
                partnerName={partnerName}
                calendarUrl={calendarUrl}
                icsUrl={icsUrl}
                tableNumber={tableNumber}
                shareUrl={shareUrl}
                shareCoupleName={coupleName}
              />
            )
        }
      />
    </div>
  );
}
