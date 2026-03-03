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
import { OttomanArch, BotanicalArch } from '../garden/components/ArchOrnaments';

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

const serif = 'var(--font-display)';
const serifStyle = 'var(--font-display-style)' as 'normal' | 'italic';
const sans  = '"DM Sans", system-ui, sans-serif';

const HERO_PETALS = generatePetals(14, ['#F0C8CC', '#E8B4B8', '#F9EDE8', '#A8C4AB']);

// iOS 26 liquid-glass: specular on Bodoni's hairline strokes → solid stems → translucent base
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

// ─── Gradient section divider ─────────────────────────────────────────────────
function GardenDivider({ color = GOLD, maxWidth = '20rem', delay = 0 }: { color?: string; maxWidth?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 1.2, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{
        height: 1,
        background: `linear-gradient(to right, transparent, ${color}, transparent)`,
        maxWidth,
        margin: '0 auto',
        transformOrigin: 'center',
      }}
      aria-hidden="true"
    />
  );
}

// ─── Flower SVG icon ──────────────────────────────────────────────────────────
function FlowerIcon({ inView }: { inView: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.8, type: 'spring' }}
      style={{ marginBottom: '1.25rem' }}
      aria-hidden="true"
    >
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        {[0, 60, 120, 180, 240, 300].map((angle, i) => (
          <motion.ellipse
            key={i}
            cx="24" cy="24" rx="10" ry="5"
            fill={ROSE}
            transform={`rotate(${angle} 24 24)`}
            initial={{ opacity: 0, scale: 0 }}
            animate={inView ? { opacity: 0.75, scale: 1 } : { opacity: 0, scale: 0 }}
            transition={{ duration: 0.35, delay: 0.1 + i * 0.07, type: 'spring' }}
            style={{ transformOrigin: '24px 24px' }}
          />
        ))}
        <circle cx="24" cy="24" r="5" fill={GOLD} opacity="0.9" />
      </svg>
    </motion.div>
  );
}

// ─── Pill-mouse scroll cue ────────────────────────────────────────────────────
function ScrollCue({ inView }: { inView: boolean }) {
  const t = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ delay: 1.8 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginTop: 'clamp(1.5rem, 4vh, 2.5rem)' }}
    >
      <motion.div
        animate={{ y: [0, 6, 0] }}
        transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
        style={{
          width: '1.1rem', height: '1.85rem', borderRadius: '999px',
          border: '1px solid rgba(42,31,26,0.12)',
          display: 'flex', alignItems: 'flex-start',
          justifyContent: 'center', paddingTop: '0.26rem',
        }}
        aria-hidden="true"
      >
        <div style={{ width: 3, height: 5, borderRadius: '999px', background: ROSE }} />
      </motion.div>
      <span style={{ fontFamily: sans, fontSize: '0.65rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: ESPRESSO_DIM }}>
        {t.scrollCta}
      </span>
    </motion.div>
  );
}

// ─── Public RSVP form (permanent, reusable link) ─────────────────────────────
interface PublicInviteFormProps {
  token: string;
  eventId: number;
  onSuccess: () => void;
}

function PublicInviteForm({ token, eventId, onSuccess }: PublicInviteFormProps) {
  const t = useTranslation();
  const STATUS_OPTIONS = [
    { value: 'attending', label: t.attendingOption },
    { value: 'declined',  label: t.decliningOption },
    { value: 'maybe',     label: t.maybeOption },
  ] as const;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PublicRsvpValues>({
    resolver: zodResolver(publicRsvpSchema),
    defaultValues: {
      token,
      eventId,
      status: 'attending',
      guestCount: 1,
      message: '',
    },
  });

  const status = watch('status');
  const guestCount = watch('guestCount');

  // Clear partner name when dropping back to 1 guest
  useEffect(() => {
    if ((guestCount ?? 1) <= 1) {
      setValue('partnerName', '');
    }
  }, [guestCount, setValue]);

  const submitMutation = useMutation({
    mutationFn: rsvpApi.submitPublic,
    onSuccess: () => {
      toast.success(t.rsvpReceived);
      onSuccess();
    },
    onError: () => {
      toast.error(t.submitFailed);
    },
  });

  const INPUT_CLASS = 'w-full rounded-lg px-3 py-2.5 text-sm placeholder-opacity-50 focus:outline-none focus:ring-2 transition-colors';
  const glassInput = {
    background: 'var(--glass-bg)',
    border: '1px solid var(--border-warm)',
    color: 'var(--text-primary)',
    backdropFilter: 'blur(8px)',
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      onSubmit={handleSubmit((values) => submitMutation.mutate(values))}
      noValidate
      className="space-y-5"
    >
      <input type="hidden" {...register('token')} />
      <input type="hidden" {...register('eventId', { valueAsNumber: true })} />

      <div className="space-y-4">
        <div>
          <label htmlFor="pub-name" style={{ fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
            {t.nameLabel} <span style={{ color: 'var(--accent-rose)' }}>*</span>
          </label>
          <input id="pub-name" type="text" autoFocus {...register('name')} className={INPUT_CLASS} style={glassInput} placeholder={t.namePlaceholder} />
          {errors.name && <p className="mt-1 text-xs" style={{ color: 'var(--accent-rose)' }}>{errors.name.message}</p>}
        </div>
        {(guestCount ?? 1) > 1 && (
          <div>
            <label htmlFor="pub-partner" style={{ fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
              {t.partnerNameLabel} <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>{t.dietaryOptional}</span>
            </label>
            <input id="pub-partner" type="text" {...register('partnerName')} className={INPUT_CLASS} style={glassInput} placeholder={t.partnerNamePlaceholder} />
          </div>
        )}
        <div>
          <label htmlFor="pub-phone" style={{ fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
            {t.phoneLabel} <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>{t.dietaryOptional}</span>
          </label>
          <input id="pub-phone" type="tel" {...register('phone')} className={INPUT_CLASS} style={glassInput} placeholder="+1 555 000 0000" />
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="pub-status" style={{ fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
              {t.attendanceShortLabel} <span style={{ color: 'var(--accent-rose)' }}>*</span>
            </label>
            <select id="pub-status" {...register('status')} className={`${INPUT_CLASS} appearance-none`} style={glassInput}>
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            {errors.status && <p className="mt-1 text-xs" style={{ color: 'var(--accent-rose)' }}>{errors.status.message}</p>}
          </div>
          {status === 'attending' && (
            <div>
              <label htmlFor="pub-count" style={{ fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
                {t.guestsShortLabel}
              </label>
              <select id="pub-count" {...register('guestCount', { valueAsNumber: true })} className={`${INPUT_CLASS} appearance-none`} style={glassInput}>
                {[1, 2, 3, 4, 5].map((n) => (<option key={n} value={n}>{n}</option>))}
              </select>
            </div>
          )}
        </div>
        <div className="mt-3">
          <label htmlFor="pub-message" style={{ fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
            {t.messageLabel}
          </label>
          <textarea id="pub-message" rows={2} {...register('message')} className={`${INPUT_CLASS} resize-none`} style={glassInput} placeholder={t.messagePlaceholder} />
        </div>
      </div>

      <button type="submit" disabled={submitMutation.isPending} className="btn-primary w-full" style={{ marginTop: '1rem' }}>
        {submitMutation.isPending ? t.sending : t.sendRsvp}
      </button>
    </motion.form>
  );
}

// ─── Self-registration form for open invitations ─────────────────────────────
interface OpenInviteFormProps {
  token: string;
  isPublic: boolean;
  events: Array<{ id: number; slug: string; name: string; date: string }>;
  onSuccess: () => void;
}

function OpenInviteForm({ token, isPublic, events, onSuccess }: OpenInviteFormProps) {
  const t = useTranslation();
  if (isPublic) {
    return (
      <PublicInviteForm
        token={token}
        eventId={events[0]?.id ?? 0}
        onSuccess={onSuccess}
      />
    );
  }
  const STATUS_OPTIONS = [
    { value: 'attending', label: t.attendingOption },
    { value: 'declined',  label: t.decliningOption },
    { value: 'maybe',     label: t.maybeOption },
  ] as const;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ClaimInvitationValues>({
    resolver: zodResolver(claimInvitationSchema),
    defaultValues: {
      token,
      rsvpEntries: events.map((ev) => ({
        eventId: ev.id,
        status: 'attending' as const,
        guestCount: 1,
        dietary: '',
        message: '',
      })),
    },
  });

  const claimMutation = useMutation({
    mutationFn: rsvpApi.claim,
    onSuccess: () => {
      toast.success(t.registrationComplete);
      onSuccess();
    },
    onError: () => {
      toast.error(t.registerFailed);
    },
  });

  const INPUT_CLASS = 'w-full rounded-lg px-3 py-2.5 text-sm placeholder-opacity-50 focus:outline-none focus:ring-2 transition-colors';
  const glassInput = {
    background: 'var(--glass-bg)',
    border: '1px solid var(--border-warm)',
    color: 'var(--text-primary)',
    backdropFilter: 'blur(8px)',
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      onSubmit={handleSubmit((values) => claimMutation.mutate(values))}
      noValidate
      className="space-y-5"
    >
      <input type="hidden" {...register('token')} />

      <div className="space-y-4">
        <div>
          <label htmlFor="claim-name" style={{ fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
            {t.nameLabel} <span style={{ color: 'var(--accent-rose)' }}>*</span>
          </label>
          <input id="claim-name" type="text" autoFocus {...register('name')} className={INPUT_CLASS} style={glassInput} placeholder={t.namePlaceholder} />
          {errors.name && <p className="mt-1 text-xs" style={{ color: 'var(--accent-rose)' }}>{errors.name.message}</p>}
        </div>
        <div>
          <label htmlFor="claim-email" style={{ fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
            {t.emailLabel} <span style={{ color: 'var(--accent-rose)' }}>*</span>
          </label>
          <input id="claim-email" type="email" {...register('email')} className={INPUT_CLASS} style={glassInput} placeholder={t.emailPlaceholder} />
          {errors.email && <p className="mt-1 text-xs" style={{ color: 'var(--accent-rose)' }}>{errors.email.message}</p>}
        </div>
        <div>
          <label htmlFor="claim-phone" style={{ fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
            {t.phoneLabel} <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>{t.dietaryOptional}</span>
          </label>
          <input id="claim-phone" type="tel" {...register('phone')} className={INPUT_CLASS} style={glassInput} placeholder="+1 555 000 0000" />
        </div>
      </div>

      {events.map((ev, idx) => (
        <div key={ev.id} style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
          <p style={{ fontFamily: serif, fontStyle: serifStyle, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
            {ev.name}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor={`entry-status-${ev.id}`} style={{ fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
                {t.attendanceShortLabel} <span style={{ color: 'var(--accent-rose)' }}>*</span>
              </label>
              <Controller
                name={`rsvpEntries.${idx}.status`}
                control={control}
                render={({ field }) => (
                  <select id={`entry-status-${ev.id}`} {...field} className={`${INPUT_CLASS} appearance-none`} style={glassInput}>
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                )}
              />
            </div>
            <div>
              <label htmlFor={`entry-count-${ev.id}`} style={{ fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
                {t.guestsShortLabel}
              </label>
              <Controller
                name={`rsvpEntries.${idx}.guestCount`}
                control={control}
                render={({ field }) => (
                  <select id={`entry-count-${ev.id}`} {...field} onChange={(e) => field.onChange(parseInt(e.target.value, 10))} className={`${INPUT_CLASS} appearance-none`} style={glassInput}>
                    {[1, 2, 3, 4, 5].map((n) => (<option key={n} value={n}>{n}</option>))}
                  </select>
                )}
              />
            </div>
          </div>
          <div className="mt-3">
            <label htmlFor={`entry-dietary-${ev.id}`} style={{ fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
              {t.dietaryLabel}
            </label>
            <input id={`entry-dietary-${ev.id}`} type="text" {...register(`rsvpEntries.${idx}.dietary`)} className={INPUT_CLASS} style={glassInput} placeholder={t.dietaryOptional} />
          </div>
          <div className="mt-3">
            <label htmlFor={`entry-message-${ev.id}`} style={{ fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
              {t.messageLabel}
            </label>
            <textarea id={`entry-message-${ev.id}`} rows={2} {...register(`rsvpEntries.${idx}.message`)} className={`${INPUT_CLASS} resize-none`} style={glassInput} placeholder={t.messagePlaceholder} />
          </div>
        </div>
      ))}

      <motion.button
        type="submit"
        disabled={claimMutation.isPending}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        className="btn-primary w-full"
        style={{ marginTop: '1rem', opacity: claimMutation.isPending ? 0.7 : 1 }}
      >
        {claimMutation.isPending ? t.registering : t.confirmRegistration}
      </motion.button>
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

// ─── Dot navigation (3 slides) ───────────────────────────────────────────────
const INVITE_DOT_ACCENTS = [ROSE, ROSE, GOLD];

function InviteDotNav({
  current, total, onDotClick,
}: {
  current: number; total: number; onDotClick: (i: number) => void;
}) {
  return (
    <nav
      aria-label="Slide navigation"
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
      {Array.from({ length: total }, (_, i) => {
        const accent = INVITE_DOT_ACCENTS[i] ?? ROSE;
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
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              outline: 'none',
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
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
              <ellipse
                cx="6" cy="8" rx="5" ry="7"
                fill={accent}
                transform="rotate(-20 6 8)"
              />
            </motion.svg>
          </motion.button>
        );
      })}
    </nav>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const wrapRef      = useRef<HTMLDivElement>(null);
  const rsvpRef      = useRef<HTMLElement>(null);
  const heroRef      = useRef<HTMLElement>(null);
  const detailsRef   = useRef<HTMLElement>(null);

  const detailsInView = useInView(detailsRef, { root: wrapRef, once: true, amount: 0.3 });
  const rsvpInView    = useInView(rsvpRef,    { root: wrapRef, once: true, amount: 0.3 });

  const [current, setCurrent] = useState(0);

  const slideRefArray = [heroRef, detailsRef, rsvpRef];

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    slideRefArray.forEach((ref, i) => {
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

  const t    = useTranslation();
  const { language } = useContext(LanguageContext);
  const lang = language as Language;
  const [claimSuccess, setClaimSuccess] = useState(false);

  // Frosted-glass nav — snap container scroll when wrapRef mounted, else window
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

  const scrollToRSVP = useCallback(() =>
    rsvpRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), []);

  const scrollToSlide = useCallback((i: number) =>
    slideRefArray[i]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), []);

  // ── Loading ──
  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: PARCHMENT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
      <div style={{ minHeight: '100vh', background: PARCHMENT, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ textAlign: 'center' }}>
          <svg width="40" height="40" viewBox="0 0 48 48" fill="none" style={{ margin: '0 auto 1rem' }} aria-hidden="true">
            {[0, 60, 120, 180, 240, 300].map((angle, i) => (
              <ellipse key={i} cx="24" cy="24" rx="10" ry="5" fill={ROSE} opacity="0.5" transform={`rotate(${angle} 24 24)`} />
            ))}
            <circle cx="24" cy="24" r="5" fill={GOLD} opacity="0.7" />
          </svg>
          <h1 style={{ fontFamily: serif, fontStyle: serifStyle, fontSize: '2rem', color: ESPRESSO, marginBottom: '0.5rem' }}>
            {t.invitationNotFound}
          </h1>
          <p style={{ fontSize: '0.85rem', color: ESPRESSO_DIM, maxWidth: '22rem', margin: '0 auto 1.5rem' }}>
            {t.invitationExpired}
          </p>
          <Link
            to="/"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              fontFamily: sans, fontSize: '0.78rem', letterSpacing: '0.1em',
              color: GOLD, textDecoration: 'none', fontWeight: 500,
              padding: '0.65rem 1.4rem',
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
      <div style={{ minHeight: '100vh', background: PARCHMENT, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ textAlign: 'center', maxWidth: '28rem' }}>
          {/* SVG lock icon in rose — no platform emoji */}
          <div style={{ marginBottom: '1rem' }} aria-hidden="true">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke={ROSE} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto' }}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1 style={{ fontFamily: serif, fontStyle: serifStyle, fontSize: '2rem', color: ESPRESSO, marginBottom: '0.75rem' }}>
            {t.invitationAlreadyClaimed}
          </h1>
          <p style={{ fontSize: '0.85rem', color: ESPRESSO_DIM }}>
            {t.invitationAlreadyClaimedSub}
          </p>
        </div>
      </div>
    );
  }

  // ── Open (unclaimed) invitation — self-registration form ──
  if (data.type === 'open') {
    const openEventName  = data.events[0]?.name ?? '';
    const openCityPart   = openEventName.includes(' \u2014 ') ? openEventName.split(' \u2014 ')[1] : null;
    const openCouplePart = openEventName.includes(' \u2014 ') ? openEventName.split(' \u2014 ')[0] : openEventName;
    const [openFirst, openSecond] = parseCoupleName(openCouplePart);
    const openMonogram = buildMonogram(openFirst, openSecond);

    return (
      <div
        ref={wrapRef}
        className="garden-wrap"
        style={{ background: PARCHMENT, color: ESPRESSO }}
      >
        <div className="grain-overlay" aria-hidden="true" />
        <SideVinesFirefly wrapRef={wrapRef} />

        {/* ── Fixed nav ── */}
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
          <Link
            to="/"
            style={{ textDecoration: 'none' }}
          aria-label={t.returnToHomepage}
        >
          <p style={{ fontFamily: sans, fontSize: '0.72rem', fontWeight: 500, letterSpacing: '0.25em', textTransform: 'uppercase', color: ESPRESSO_DIM, transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = GOLD)}
            onMouseLeave={e => (e.currentTarget.style.color = ESPRESSO_DIM)}
          >
            {openMonogram}
            </p>
          </Link>
          <LanguageSwitcher />
        </motion.header>

        {/* ════════════════════ HERO ════════════════════ */}
        <section
          className="garden-slide"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: PARCHMENT }}
          aria-label="Invitation hero"
        >
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 0, background: 'radial-gradient(ellipse 65% 55% at 50% 45%, rgba(240,200,204,0.3) 0%, transparent 70%)' }} />
          <FloatingPetals petals={HERO_PETALS} />
          <VineCornerTL inView={true} />
          <VineCornerBR inView={true} />

          <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '68rem', padding: 'clamp(5rem, 10vh, 8rem) clamp(1.5rem, 6vw, 4rem) clamp(3rem, 7vh, 5rem)', textAlign: 'center' }}>
            {/* "YOU'VE BEEN INVITED" overline */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}
            >
              <div style={{ width: 36, height: 1, background: ROSE, opacity: 0.6 }} aria-hidden="true" />
              <span style={{ fontFamily: sans, fontSize: '0.72rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: ROSE, fontWeight: 500 }}>
                {t.youveBeenInvited}
              </span>
              <div style={{ width: 36, height: 1, background: ROSE, opacity: 0.6 }} aria-hidden="true" />
            </motion.div>

            {/* Couple name — same large gradient reveal as personal invite */}
            {openSecond ? (
              <div style={{ padding: '0.2em 0' }}>
                <motion.h1
                  initial={{ opacity: 0, y: 36, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 1.3, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  style={{ fontFamily: serif, fontStyle: serifStyle, fontWeight: 400, fontSize: 'clamp(4rem, 13vw, 8rem)', lineHeight: 1.15, letterSpacing: '-0.02em', margin: 0, ...NAME_GRADIENT }}
                >
                  {openFirst}
                </motion.h1>
                <motion.div
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  transition={{ duration: 0.7, delay: 0.9 }}
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
                  transition={{ duration: 1.3, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  style={{ fontFamily: serif, fontStyle: serifStyle, fontWeight: 400, fontSize: 'clamp(4rem, 13vw, 8rem)', lineHeight: 1.15, letterSpacing: '-0.02em', margin: 0, ...NAME_GRADIENT }}
                >
                  {openSecond}
                </motion.h1>
              </div>
            ) : (
              <div style={{ padding: '0.2em 0' }}>
                <motion.h1
                  initial={{ opacity: 0, y: 36, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 1.3, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  style={{ fontFamily: serif, fontStyle: serifStyle, fontWeight: 400, fontSize: 'clamp(4rem, 13vw, 8rem)', lineHeight: 1.15, letterSpacing: '-0.02em', ...NAME_GRADIENT }}
                >
                  {openCouplePart}
                </motion.h1>
              </div>
            )}

            {openCityPart && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.0, duration: 0.6 }}
                style={{ fontFamily: sans, fontSize: '0.75rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: GOLD, marginTop: 'clamp(0.5rem, 1.5vh, 1rem)' }}
              >
                {openCityPart}
              </motion.p>
            )}

            {/* ♡ divider */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.0 }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', margin: 'clamp(1.5rem, 3vh, 2rem) 0' }}
              aria-hidden="true"
            >
              <div style={{ height: 1, width: 60, background: `linear-gradient(to right, transparent, ${GOLD_DIM})` }} />
              <span style={{ color: ROSE, fontSize: '0.6rem' }}>♡</span>
              <div style={{ height: 1, width: 60, background: `linear-gradient(to left, transparent, ${GOLD_DIM})` }} />
            </motion.div>

            {/* Register CTA */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.1 }}
            >
              <MagneticButton onClick={scrollToRSVP} className="btn-primary" aria-label={t.pleaseRegister}>
                {t.pleaseRegister}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M19 9l-7 7-7-7"/>
                </svg>
              </MagneticButton>
            </motion.div>

            <ScrollCue inView={true} />
          </div>
        </section>

        {/* ════════════════════ REGISTRATION FORM ════════════════════ */}
        <section
          ref={rsvpRef}
          id="rsvp"
          className="garden-slide-tall"
          style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', background: CREAM }}
          aria-labelledby="open-register-heading"
        >
          <VineCornerBR inView={rsvpInView} />
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 0, background: 'radial-gradient(ellipse 60% 55% at 50% 50%, rgba(240,200,204,0.18) 0%, transparent 70%)' }} />

          <div style={{ maxWidth: '40rem', margin: '0 auto', width: '100%', padding: 'clamp(4.5rem,8vh,6rem) 1.5rem 0', position: 'relative', zIndex: 5 }}>
            <FlowerIcon inView={rsvpInView} />

            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                style={{ fontFamily: sans, fontSize: '0.72rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: ROSE, fontWeight: 500, marginBottom: '0.75rem' }}
              >
                {t.youveBeenInvited}
              </motion.p>
              <motion.h2
                id="open-register-heading"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 1.0, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                style={{ fontFamily: serif, fontStyle: serifStyle, fontWeight: 300, fontSize: 'clamp(2.2rem, 6vw, 3.5rem)', letterSpacing: '-0.02em', color: ESPRESSO, margin: '0 0 1rem' }}
              >
                {t.pleaseRegister}
              </motion.h2>
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 1.2, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                style={{ height: 1, maxWidth: '16rem', margin: '0 auto', background: `linear-gradient(to right, transparent, ${ROSE}, transparent)`, transformOrigin: 'center' }}
                aria-hidden="true"
              />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="glass rounded-3xl noise"
              style={{ padding: 'clamp(1.5rem, 5vw, 2.5rem)', boxShadow: 'var(--shadow-lg)', position: 'relative' }}
            >
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 1.2, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
                style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: `linear-gradient(to right, transparent, ${GOLD}, transparent)`, transformOrigin: 'center' }}
                aria-hidden="true"
              />
              {claimSuccess ? (
                <ClaimSuccessScreen />
              ) : (
                <OpenInviteForm
                  token={data.token}
                  isPublic={data.isPublic}
                  events={data.events}
                  onSuccess={() => setClaimSuccess(true)}
                />
              )}
            </motion.div>

            {/* Footer note */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 1, delay: 0.8 }}
              style={{ textAlign: 'center', paddingTop: '2rem', paddingBottom: 'clamp(1.5rem, 4vh, 2.5rem)' }}
            >
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                style={{ height: 1, maxWidth: '10rem', margin: '0 auto 0.6rem', background: `linear-gradient(to right, transparent, ${GOLD_DIM}, transparent)`, transformOrigin: 'center' }}
                aria-hidden="true"
              />
              <p style={{ fontFamily: sans, fontSize: '0.72rem', letterSpacing: '0.1em', color: ESPRESSO_DIM }}>
                {t.madeWithLove}
              </p>
            </motion.div>
          </div>
        </section>
      </div>
    );
  }

  // ── Personal (pre-assigned) invitation ──
  const { invitation, guest, event } = data;
  const displayDate    = formatEventDate(event.date, lang);
  const targetDateTime = `${event.date}T${event.time}:00`;
  const coupleName     = event.name.includes(' \u2014 ') ? event.name.split(' \u2014 ')[0] : event.name;
  const eventCity      = event.name.includes(' \u2014 ') ? event.name.split(' \u2014 ')[1] : null;
  const [firstName, secondName] = parseCoupleName(coupleName);
  const monogram = buildMonogram(firstName, secondName);

  const partnerName = guest.partnerName ?? null;

  const prefill = {
    name:           guest.name,
    email:          guest.email,
    status:         invitation.status,
    guestCount:     invitation.guestCount,
    dietary:        invitation.dietary,
    partnerDietary: invitation.partnerDietary ?? null,
    message:        invitation.message,
  };

  return (
    <div
      ref={wrapRef}
      className="garden-wrap"
      style={{ background: PARCHMENT, color: ESPRESSO }}
    >
      <div className="grain-overlay" aria-hidden="true" />
      <SideVinesFirefly wrapRef={wrapRef} />

      {/* ── Fixed nav ── */}
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
        <Link
          to="/"
          style={{ textDecoration: 'none' }}
          aria-label={t.returnToHomepage}
        >
          <p style={{ fontFamily: sans, fontSize: '0.72rem', fontWeight: 500, letterSpacing: '0.25em', textTransform: 'uppercase', color: ESPRESSO_DIM, transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = GOLD)}
            onMouseLeave={e => (e.currentTarget.style.color = ESPRESSO_DIM)}
          >
            {monogram}
          </p>
        </Link>
        <LanguageSwitcher />
      </motion.header>

      {/* ── Dot navigation ── */}
      <InviteDotNav current={current} total={3} onDotClick={scrollToSlide} />

      {/* ════════════════════ HERO ════════════════════ */}
      <section
        ref={heroRef}
        className="garden-slide"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: PARCHMENT }}
        aria-label="Personal invitation hero"
      >
        {/* Background wash */}
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 0, background: 'radial-gradient(ellipse 65% 55% at 50% 45%, rgba(240,200,204,0.3) 0%, transparent 70%)' }} />

        <FloatingPetals petals={HERO_PETALS} />
        <VineCornerTL inView={true} />
        <VineCornerBR inView={true} />

        <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '68rem', padding: 'clamp(5rem, 10vh, 8rem) clamp(1.5rem, 6vw, 4rem) clamp(3rem, 7vh, 5rem)', textAlign: 'center' }}>
          {/* "A Personal Invitation for" overline */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}
          >
            <div style={{ width: 36, height: 1, background: ROSE, opacity: 0.6 }} aria-hidden="true" />
            <span style={{ fontFamily: sans, fontSize: '0.72rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: ROSE, fontWeight: 500 }}>
              {t.personalInvitationFor}
            </span>
            <div style={{ width: 36, height: 1, background: ROSE, opacity: 0.6 }} aria-hidden="true" />
          </motion.div>

          {/* Guest name (and optional partner) — DM Sans, not display font */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            style={{ marginBottom: '0.5rem' }}
          >
            <span style={{ fontFamily: sans, fontWeight: 300, fontSize: 'clamp(1rem, 3vw, 1.5rem)', letterSpacing: '0.08em', color: ESPRESSO_DIM, display: 'block' }}>
              {guest.name}{partnerName ? ` & ${partnerName}` : ''}
            </span>
          </motion.div>

          {/* Couple name with "&" divider */}
          {secondName ? (
            <div style={{ padding: '0.2em 0' }}>
              <motion.h1
                initial={{ opacity: 0, y: 36, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 1.3, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
                style={{ fontFamily: serif, fontStyle: serifStyle, fontWeight: 400, fontSize: 'clamp(4rem, 13vw, 8rem)', lineHeight: 1.15, letterSpacing: '-0.02em', margin: 0, ...NAME_GRADIENT }}
              >
                {firstName}
              </motion.h1>
              <motion.div
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ duration: 0.7, delay: 1.1 }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', margin: 'clamp(0.2rem, 0.6vw, 0.5rem) 0', transformOrigin: 'center' }}
                aria-hidden="true"
              >
                <div style={{ flex: 1, maxWidth: '6rem', height: 1, background: GOLD_DIM }} />
                <span style={{ fontFamily: serif, fontStyle: serifStyle, fontSize: 'clamp(2rem, 6vw, 3.5rem)', color: GOLD }}>&</span>
                <div style={{ flex: 1, maxWidth: '6rem', height: 1, background: GOLD_DIM }} />
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 36, filter: 'blur(0px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 1.3, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
                style={{ fontFamily: serif, fontStyle: serifStyle, fontWeight: 400, fontSize: 'clamp(4rem, 13vw, 8rem)', lineHeight: 1.15, letterSpacing: '-0.02em', margin: 0, ...NAME_GRADIENT }}
              >
                {secondName}
              </motion.h1>
            </div>
          ) : (
            <div style={{ padding: '0.2em 0' }}>
              <motion.h1
                initial={{ opacity: 0, y: 36, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 1.3, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
                style={{ fontFamily: serif, fontStyle: serifStyle, fontWeight: 400, fontSize: 'clamp(4rem, 13vw, 8rem)', lineHeight: 1.15, letterSpacing: '-0.02em', margin: 0, ...NAME_GRADIENT }}
              >
                {coupleName}
              </motion.h1>
            </div>
          )}

          {eventCity && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.6 }}
              style={{ fontFamily: sans, fontSize: '0.75rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: GOLD, marginTop: 'clamp(0.5rem, 1.5vh, 1rem)' }}
            >
              {eventCity}
            </motion.p>
          )}

          {/* ♡ divider — gold lines matching garden system */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.0 }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', margin: 'clamp(1.5rem, 3vh, 2rem) 0' }}
            aria-hidden="true"
          >
            <div style={{ height: 1, width: 60, background: `linear-gradient(to right, transparent, ${GOLD_DIM})` }} />
            <span style={{ color: ROSE, fontSize: '0.6rem' }}>♡</span>
            <div style={{ height: 1, width: 60, background: `linear-gradient(to left, transparent, ${GOLD_DIM})` }} />
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.1 }}
          >
            <MagneticButton onClick={scrollToRSVP} className="btn-primary" aria-label={t.rsvpButton}>
              {t.rsvpButton}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 9l-7 7-7-7"/>
              </svg>
            </MagneticButton>
          </motion.div>

          <ScrollCue inView={true} />
        </div>
      </section>

      {/* ════════════════════ DETAILS ════════════════════ */}
      <section
        ref={detailsRef}
        className="garden-slide"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: event.slug === 'ankara' ? '#FDF5F6' : '#F5FAF6',
        }}
        aria-label="Event details"
      >
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, zIndex: 0,
          background: event.slug === 'ankara'
            ? 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(240,200,204,0.45) 0%, transparent 70%)'
            : 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(168,196,171,0.4) 0%, transparent 70%)',
        }} />
        <VineCornerTL inView={detailsInView} />

        <div style={{ maxWidth: '48rem', margin: '0 auto', width: '100%', padding: '0 clamp(1.5rem, 5vw, 3rem)', position: 'relative', zIndex: 5, textAlign: 'center' }}>
          {/* Arch ornament */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={detailsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            transition={{ duration: 0.8 }}
            style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}
          >
            {event.slug === 'ankara'
              ? <OttomanArch inView={detailsInView} />
              : <BotanicalArch inView={detailsInView} />
            }
          </motion.div>

          {/* Chapter label */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={detailsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            style={{
              fontFamily: sans, fontSize: '0.72rem', fontWeight: 500,
              letterSpacing: '0.28em', textTransform: 'uppercase',
              color: event.slug === 'ankara' ? ROSE : '#6B8F71',
              marginBottom: '0.5rem',
            }}
          >
            {event.slug === 'ankara' ? 'Türkiye · Ankara' : 'Uzbekistan · Tashkent'}
          </motion.p>

          {/* City / venue heading */}
          <motion.h2
            initial={{ opacity: 0, y: 24, filter: 'blur(6px)' }}
            animate={detailsInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : { opacity: 0, y: 24, filter: 'blur(6px)' }}
            transition={{ duration: 1.1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{ fontFamily: serif, fontStyle: serifStyle, fontWeight: 300, fontSize: 'clamp(3rem, 10vw, 8rem)', letterSpacing: '-0.02em', color: ESPRESSO, margin: '0 0 0.5rem', lineHeight: 1.1 }}
          >
            {eventCity ?? event.venueName}
          </motion.h2>

          {/* Gradient divider */}
          <GardenDivider
            color={event.slug === 'ankara' ? ROSE : '#6B8F71'}
            maxWidth="14rem"
            delay={0.5}
          />

          {/* Date + time row */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={detailsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginTop: '1.25rem', flexWrap: 'wrap' }}
          >
            <span style={{ fontFamily: sans, fontSize: '0.8rem', letterSpacing: '0.08em', color: ESPRESSO_DIM }}>
              {displayDate}
            </span>
            <span style={{ color: GOLD_DIM, fontSize: '0.6rem' }}>◆</span>
            <span style={{ fontFamily: sans, fontSize: '0.8rem', letterSpacing: '0.08em', color: ESPRESSO_DIM }}>
              {event.time}
            </span>
          </motion.div>

          {/* Venue address */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={detailsInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.7, delay: 0.75 }}
            style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 'clamp(0.8rem, 2vw, 1rem)', color: ESPRESSO_DIM, margin: '0.4rem 0 0' }}
          >
            {event.venueName}{event.venueAddress ? ` · ${event.venueAddress}` : ''}
          </motion.p>

          {/* Dress code */}
          {event.dressCode && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={detailsInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.7, delay: 0.85 }}
              style={{ fontFamily: sans, fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: GOLD, marginTop: '0.6rem' }}
            >
              {t.dressCode}: {event.dressCode}
            </motion.p>
          )}

          {/* Compact countdown */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={detailsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            transition={{ duration: 0.8, delay: 1.0 }}
            style={{ marginTop: '1.5rem' }}
          >
            <CountdownTimer targetDate={targetDateTime} />
          </motion.div>

          {/* RSVP CTA */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={detailsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            style={{ marginTop: '1.5rem' }}
          >
            <MagneticButton onClick={scrollToRSVP} className="btn-primary" aria-label={t.rsvpButton}>
              {t.rsvpButton} ↓
            </MagneticButton>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════ RSVP FORM ════════════════════ */}
      <section
        ref={rsvpRef}
        id="rsvp"
        className="garden-slide-tall"
        style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', background: CREAM }}
        aria-labelledby="rsvp-form-heading"
      >
        <VineCornerBR inView={rsvpInView} />
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 0, background: 'radial-gradient(ellipse 60% 55% at 50% 50%, rgba(240,200,204,0.18) 0%, transparent 70%)' }} />

        <div style={{ maxWidth: '40rem', margin: '0 auto', width: '100%', padding: 'clamp(4.5rem,8vh,6rem) 1.5rem 0', position: 'relative', zIndex: 5 }}>
          <FlowerIcon inView={rsvpInView} />

          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              style={{ fontFamily: sans, fontSize: '0.72rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: ROSE, fontWeight: 500, marginBottom: '0.75rem' }}
            >
              {t.kindlyReply}
            </motion.p>
            <motion.h2
              id="rsvp-form-heading"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 1.0, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              style={{ fontFamily: serif, fontStyle: serifStyle, fontWeight: 300, fontSize: 'clamp(2.2rem, 6vw, 3.5rem)', letterSpacing: '-0.02em', color: ESPRESSO, margin: '0 0 1rem' }}
            >
              {t.rsvpHeading}
            </motion.h2>
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 1.2, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              style={{ height: 1, maxWidth: '16rem', margin: '0 auto', background: `linear-gradient(to right, transparent, ${ROSE}, transparent)`, transformOrigin: 'center' }}
              aria-hidden="true"
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="glass rounded-3xl noise"
            style={{ padding: 'clamp(1.5rem, 5vw, 2.5rem)', boxShadow: 'var(--shadow-lg)', position: 'relative' }}
          >
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 1.2, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
              style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: `linear-gradient(to right, transparent, ${GOLD}, transparent)`, transformOrigin: 'center' }}
              aria-hidden="true"
            />
            <RSVPForm token={token} eventName={event.name} prefillData={prefill} partnerName={partnerName} />
          </motion.div>

          {/* Footer note in natural flow at bottom of content */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 1, delay: 0.8 }}
            style={{ textAlign: 'center', paddingTop: '2rem', paddingBottom: 'clamp(1.5rem, 4vh, 2.5rem)' }}
          >
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              style={{ height: 1, maxWidth: '10rem', margin: '0 auto 0.6rem', background: `linear-gradient(to right, transparent, ${GOLD_DIM}, transparent)`, transformOrigin: 'center' }}
              aria-hidden="true"
            />
            <p style={{ fontFamily: sans, fontSize: '0.72rem', letterSpacing: '0.1em', color: ESPRESSO_DIM }}>
              {t.madeWithLove}
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
