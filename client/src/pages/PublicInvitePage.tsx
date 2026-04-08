import { useRef, useContext, useState, useEffect } from 'react';
import type { CSSProperties } from 'react';
import { useParams, useNavigate, Link, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import CountdownTimer from '../components/CountdownTimer';
import SuccessScreen from '../components/SuccessScreen';
import { rsvpApi } from '../lib/api';
import { useTranslation } from '../lib/i18n';
import type { Language } from '../lib/i18n';
import { LanguageContext } from '../context/LanguageContext';
import { publicPageRsvpSchema, type PublicPageRsvpValues } from '@invitation/shared';
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
  GOLD,
  GOLD_DIM,
  ROSE,
} from '../garden/tokens';
import {
  FormCard,
  FormField,
  FormInput,
  FormTextarea,
  GuestCountSelect,
  AttendancePicker,
  FormSubmitButton,
} from '../components/ui/FormPrimitives';
import {
  PUBLIC_EVENT_CONFIGS,
  VALID_VENUES,
  VALID_LANGS,
  type VenueSlug,
} from '../config/publicEvents';

const sans = '"DM Sans", system-ui, sans-serif';

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

const HERO_PETALS = generatePetals(14, ['#F0C8CC', '#E8B4B8', '#F9EDE8', '#A8C4AB']);

// ─── Language switcher that navigates to the language-specific URL ────────────
function PublicLanguageSwitcher({ venue, currentLang }: { venue: VenueSlug; currentLang: Language }) {
  const navigate = useNavigate();
  const { setLanguage } = useContext(LanguageContext);

  const langs: { code: Language; label: string }[] = [
    { code: 'en', label: 'EN' },
    { code: 'tr', label: 'TR' },
    { code: 'uz', label: 'UZ' },
  ];

  const handleSwitch = (code: Language) => {
    setLanguage(code);
    navigate(`/invite/${venue}/${code}`, { replace: true });
  };

  return (
    <div
      className="flex items-center gap-0.5 p-1 rounded-full glass"
      style={{ border: '1px solid var(--border-warm)' }}
      role="group"
      aria-label="Language selection"
    >
      {langs.map(({ code, label }) => {
        const active = currentLang === code;
        return (
          <div key={code} className="relative">
            {active && (
              <motion.div
                layoutId="pub-lang-pill"
                className="absolute inset-0 rounded-full"
                style={{ backgroundColor: 'var(--accent-gold)' }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <button
              onClick={() => handleSwitch(code)}
              className="relative z-10 px-3 py-1 rounded-full transition-colors"
              style={{
                fontFamily: sans,
                fontSize: '0.6rem',
                fontWeight: 600,
                letterSpacing: '0.1em',
                color: active ? '#0C0A09' : 'var(--text-secondary)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
              aria-label={`Switch to ${label}`}
              aria-pressed={active}
            >
              {label}
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ─── RSVP form ────────────────────────────────────────────────────────────────
interface PublicPageFormProps {
  eventSlug: VenueSlug;
}

function PublicPageForm({ eventSlug }: PublicPageFormProps) {
  const t = useTranslation();

  const LS_KEY = `rsvp_page_${eventSlug}`;

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
  } = useForm<PublicPageRsvpValues>({
    resolver: zodResolver(publicPageRsvpSchema),
    mode: 'onBlur',
    defaultValues: {
      eventSlug,
      name: '',
      phone: '',
      status: 'attending',
      guestCount: 1,
      dietary: '',
      partnerDietary: '',
      message: '',
    },
  });

  const status     = watch('status') ?? 'attending';
  const guestCount = watch('guestCount') ?? 1;

  const submitMutation = useMutation({
    mutationFn: rsvpApi.submitPublicPage,
    onSuccess: (_data, variables) => {
      const result: SuccessResult = {
        name: variables.name,
        status: variables.status,
        guestCount: variables.guestCount ?? 1,
      };
      try { localStorage.setItem(LS_KEY, JSON.stringify(result)); } catch { /* quota exceeded */ }
      setSuccessResult(result);
      toast.success(t.registrationComplete);
    },
    onError: () => { toast.error(t.submitFailed); },
  });

  const attendanceLabels = {
    attending: t.attendingOption,
    declined: t.decliningOption,
    maybe: t.maybeOption,
  };

  if (successResult) {
    return (
      <SuccessScreen
        guestName={successResult.name}
        partnerName={successResult.partnerName}
        status={successResult.status}
        guestCount={successResult.guestCount}
        isUpdate={false}
        onUpdateRsvp={() => {
          try { localStorage.removeItem(LS_KEY); } catch { /* ignore */ }
          setSuccessResult(null);
        }}
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
      <input type="hidden" {...register('eventSlug')} />

      {/* WHO'S COMING */}
      <FormCard title={t.whosComing}>
        <FormField htmlFor="ppub-name" label={t.nameLabel} required error={errors.name?.message}>
          <FormInput
            id="ppub-name"
            type="text"
            autoComplete="name"
            {...register('name')}
            placeholder={t.namePlaceholder}
          />
        </FormField>

        <FormField
          htmlFor="ppub-phone"
          label={t.phoneLabel}
          required
          error={errors.phone?.message}
          hint={t.phoneHint}
        >
          <FormInput
            id="ppub-phone"
            type="tel"
            autoComplete="tel"
            {...register('phone')}
            placeholder="+1 555 000 0000"
          />
        </FormField>

        <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
          <legend style={{ fontFamily: sans, fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '0.5rem' }}>
            {t.attendanceLabel} <span aria-hidden="true" style={{ color: 'var(--accent-rose)' }}>*</span>
          </legend>
          <AttendancePicker
            value={status}
            onChange={(v) => setValue('status', v, { shouldValidate: true })}
            labels={attendanceLabels}
            name="ppub-status"
          />
          {errors.status && (
            <p style={{ marginTop: '0.4rem', fontSize: '0.72rem', color: 'var(--accent-rose)' }} role="alert">
              {errors.status.message}
            </p>
          )}
        </fieldset>

        {status === 'attending' && (
          <GuestCountSelect
            id="ppub-count"
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
        <FormField htmlFor="ppub-message" label={t.messageLabel} optional={t.messageOptional}>
          <FormTextarea
            id="ppub-message"
            rows={2}
            {...register('message')}
            placeholder={t.messagePlaceholder}
          />
        </FormField>
      </FormCard>

      <FormSubmitButton
        pending={submitMutation.isPending}
        label={t.confirmRegistration}
        pendingLabel={t.registering}
      />
    </motion.form>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function PublicInvitePage() {
  const { venue, lang } = useParams<{ venue: string; lang: string }>();
  const { setLanguage } = useContext(LanguageContext);

  const wrapRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const rsvpRef = useRef<HTMLElement>(null);

  const [current, setCurrent] = useState(0);

  // Validate params before rendering anything
  const isValidVenue = venue && (VALID_VENUES as string[]).includes(venue);
  const isValidLang  = lang  && (VALID_LANGS  as string[]).includes(lang);

  // Sync language context with URL param
  useEffect(() => {
    if (isValidLang) setLanguage(lang as Language);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  // Reset scroll to top on mount
  useEffect(() => {
    history.scrollRestoration = 'manual';
    if (wrapRef.current) wrapRef.current.scrollTop = 0;
    return () => { history.scrollRestoration = 'auto'; };
  }, []);

  // Track active slide for dot navigation
  useEffect(() => {
    if (!wrapRef.current) return;
    const refs = [heroRef, rsvpRef];
    const observers: IntersectionObserver[] = [];
    refs.forEach((ref, i) => {
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

  // Redirect invalid params to homepage
  if (!isValidVenue || !isValidLang) {
    return <Navigate to="/" replace />;
  }

  const eventSlug = venue as VenueSlug;
  const currentLang = (isValidLang ? lang : 'en') as Language;
  const cfg = PUBLIC_EVENT_CONFIGS[eventSlug];

  const scrollToRsvp = () => {
    rsvpRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToHero = () => {
    heroRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const slides = [heroRef, rsvpRef];

  // City label: capitalize first letter
  const cityLabel = cfg.city[currentLang as keyof typeof cfg.city] ?? cfg.city.en;

  // Monogram in top-left
  const monogram = 'B & S · 2026';

  return (
    <div
      ref={wrapRef}
      className="garden-wrap"
      style={{ background: PARCHMENT }}
    >
      <SideVinesFirefly />

      {/* ── Fixed nav ── */}
      <nav
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 40,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.75rem clamp(1rem, 4vw, 2rem)',
          pointerEvents: 'none',
        }}
        aria-label="Page navigation"
      >
        {/* Back link */}
        <div style={{ pointerEvents: 'auto' }}>
          <Link
            to="/"
            style={{
              fontFamily: sans,
              fontSize: '0.62rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: ESPRESSO_DIM,
              textDecoration: 'none',
              fontWeight: 500,
            }}
            aria-label={t.returnToHomepage}
          >
            ← {monogram}
          </Link>
        </div>

        {/* Language switcher */}
        <div style={{ pointerEvents: 'auto' }}>
          <PublicLanguageSwitcher venue={eventSlug} currentLang={currentLang} />
        </div>
      </nav>

      {/* ── Slide navigation dots ── */}
      <nav
        style={{
          position: 'fixed', right: 'clamp(0.75rem, 2vw, 1.5rem)', top: '50%',
          transform: 'translateY(-50%)', zIndex: 40,
          display: 'flex', flexDirection: 'column', gap: '0.5rem',
        }}
        aria-label="Slide navigation"
      >
        {slides.map((ref, i) => {
          const isActive = current === i;
          return (
            <button
              key={i}
              onClick={() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={isActive ? 'true' : undefined}
              style={{
                width: isActive ? 8 : 6,
                height: isActive ? 8 : 6,
                borderRadius: '50%',
                background: isActive ? GOLD : GOLD_DIM,
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
            />
          );
        })}
      </nav>

      {/* ─────────────────────── SLIDE 1: HERO ─────────────────────────────── */}
      <section
        ref={heroRef}
        className="garden-slide"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: PARCHMENT }}
        aria-label={t.youveBeenInvited}
      >
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 0, background: 'radial-gradient(ellipse 65% 55% at 50% 45%, rgba(240,200,204,0.3) 0%, transparent 70%)' }} />
        <FloatingPetals petals={HERO_PETALS} />
        <VineCornerTL inView={true} />
        <VineCornerBR inView={true} />

        <div style={{
          position: 'relative', zIndex: 10, width: '100%', maxWidth: '68rem', textAlign: 'center',
          padding: 'clamp(4.5rem, 9vh, 7rem) clamp(1.5rem, 6vw, 4rem) clamp(2rem, 5vh, 4rem)',
        }}>
          {/* Overline */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}
          >
            <div style={{ width: 36, height: 1, background: ROSE, opacity: 0.6 }} aria-hidden="true" />
            <span style={{ fontFamily: sans, fontSize: '0.65rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: ROSE, fontWeight: 500 }}>
              {t.youveBeenInvited}
            </span>
            <div style={{ width: 36, height: 1, background: ROSE, opacity: 0.6 }} aria-hidden="true" />
          </motion.div>

          {/* Couple names */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'var(--font-display-style)' as 'normal' | 'italic',
                fontSize: 'clamp(5.5rem, 18vw, 10rem)',
                fontWeight: 400,
                lineHeight: 1.0,
                ...NAME_GRADIENT,
                marginBottom: 0,
              }}
            >
              Berfin
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.85 }}
            style={{ margin: 'clamp(0.4rem, 1vh, 0.75rem) 0', color: GOLD_DIM, fontSize: 'clamp(1.2rem, 4vw, 2rem)' }}
            aria-hidden="true"
          >
            &
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 1.0, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'var(--font-display-style)' as 'normal' | 'italic',
                fontSize: 'clamp(5.5rem, 18vw, 10rem)',
                fontWeight: 400,
                lineHeight: 1.0,
                ...NAME_GRADIENT,
              }}
            >
              Shamsiddin
            </h1>
          </motion.div>

          {/* City */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            style={{ fontFamily: sans, fontSize: '0.75rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: GOLD, marginTop: 'clamp(0.4rem, 1vh, 0.75rem)' }}
          >
            {cityLabel}
          </motion.p>

          {/* Divider */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.35 }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', margin: 'clamp(0.75rem, 2vh, 1.5rem) 0' }}
            aria-hidden="true"
          >
            <div style={{ height: 1, width: 60, background: `linear-gradient(to right, transparent, ${GOLD_DIM})` }} />
            <span style={{ color: ROSE, fontSize: '0.6rem' }}>♡</span>
            <div style={{ height: 1, width: 60, background: `linear-gradient(to left, transparent, ${GOLD_DIM})` }} />
          </motion.div>

          {/* Date / time / venue */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.45 }}
            style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '0.5rem 1rem', marginBottom: 'clamp(0.75rem, 2vh, 1.25rem)' }}
          >
            <span style={{ fontFamily: sans, fontSize: '0.78rem', letterSpacing: '0.04em', color: ESPRESSO_DIM }}>{cfg.displayDate[currentLang as keyof typeof cfg.displayDate] ?? cfg.displayDate.en}</span>
            <span style={{ color: GOLD_DIM, fontSize: '0.5rem' }} aria-hidden="true">◆</span>
            <span style={{ fontFamily: sans, fontSize: '0.78rem', letterSpacing: '0.04em', color: ESPRESSO_DIM }}>{cfg.time}</span>
            <span style={{ color: GOLD_DIM, fontSize: '0.5rem' }} aria-hidden="true">◆</span>
            <span style={{ fontFamily: sans, fontSize: '0.78rem', letterSpacing: '0.04em', color: ESPRESSO_DIM }}>{cfg.venueName}</span>
          </motion.div>

          {/* Countdown */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.6 }}
            style={{ marginBottom: 'clamp(0.75rem, 2vh, 1.5rem)' }}
          >
            <CountdownTimer targetDate={cfg.targetDateTime} />
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.75 }}
          >
            <button
              onClick={scrollToRsvp}
              className="btn-primary"
              aria-label={t.pleaseRegister}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {t.pleaseRegister}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </motion.div>

          {/* Scroll cue */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.2 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', marginTop: 'clamp(1rem, 3vh, 2rem)' }}
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
        </div>
      </section>

      {/* ─────────────────────── SLIDE 2: RSVP ─────────────────────────────── */}
      <section
        ref={rsvpRef}
        id="rsvp"
        className="garden-slide-tall"
        style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', background: CREAM }}
        aria-label={t.kindlyReply}
      >
        <VineCornerBR inView={current === 1} />
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 0, background: 'radial-gradient(ellipse 60% 55% at 50% 50%, rgba(240,200,204,0.18) 0%, transparent 70%)' }} />

        <div style={{
          maxWidth: '38rem',
          margin: '0 auto',
          width: '100%',
          paddingTop: 'clamp(3.5rem, 6vh, 5rem)',
          paddingLeft: 'clamp(1rem, 4vw, 1.5rem)',
          paddingRight: 'clamp(1rem, 4vw, 1.5rem)',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + clamp(1rem, 3vh, 2rem))',
          position: 'relative',
          zIndex: 5,
        }}>
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}
          >
            <div style={{ height: 1, flex: 1, maxWidth: '3rem', background: `linear-gradient(to right, transparent, ${ROSE})` }} aria-hidden="true" />
            <span style={{ fontFamily: sans, fontSize: '0.7rem', letterSpacing: '0.26em', textTransform: 'uppercase', color: ROSE, fontWeight: 500, whiteSpace: 'nowrap' }}>
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
            <PublicPageForm eventSlug={eventSlug} />
          </motion.div>

          {/* Footer */}
          <div style={{ textAlign: 'center', paddingTop: '1rem' }}>
            <div style={{ height: 1, maxWidth: '6rem', margin: '0 auto 0.5rem', background: `linear-gradient(to right, transparent, ${GOLD_DIM}, transparent)` }} aria-hidden="true" />
            <p style={{ fontFamily: sans, fontSize: '0.68rem', letterSpacing: '0.1em', color: ESPRESSO_DIM }}>
              {t.madeWithLove}
            </p>
          </div>

          {/* Back to hero */}
          <div style={{ textAlign: 'center', paddingTop: '0.5rem' }}>
            <button
              onClick={scrollToHero}
              style={{
                fontFamily: sans, fontSize: '0.68rem', letterSpacing: '0.1em',
                color: ESPRESSO_DIM, background: 'none', border: 'none',
                cursor: 'pointer', textDecoration: 'underline',
                textDecorationColor: GOLD_DIM,
              }}
              aria-label="Back to top"
            >
              ↑ {t.returnToHomepage.replace('Return to', 'Back to').replace('homepage', 'top')}
            </button>
          </div>
        </div>
      </section>

      {/* Grain overlay */}
      <div className="grain-overlay" aria-hidden="true" />
    </div>
  );
}
