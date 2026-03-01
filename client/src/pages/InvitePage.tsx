import { useRef, useContext, useState, useEffect } from 'react';
import type { CSSProperties } from 'react';
import { useParams } from 'react-router-dom';
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

// ─── Palette values ───────────────────────────────────────────────────────────
const PARCHMENT   = '#FDFAF5';
const CREAM       = '#F5EFE4';
const ESPRESSO    = '#2A1F1A';
const ESPRESSO_DIM   = 'rgba(42,31,26,0.6)';
const ESPRESSO_FAINT = 'rgba(42,31,26,0.28)';
const GOLD        = '#B8924A';
const GOLD_DIM    = 'rgba(184,146,74,0.45)';
const ROSE        = '#C4848C';

const serif = '"Bodoni Moda", Georgia, serif';
const sans  = '"DM Sans", system-ui, sans-serif';

const HERO_PETALS = generatePetals(14, ['#F0C8CC', '#E8B4B8', '#F9EDE8', '#A8C4AB']);

const COUPLE_PHOTO = '/IMG_2524.jpg';

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

function formatEventDate(dateStr: string, lang: Language): string {
  const d = new Date(dateStr);
  const localeMap: Record<Language, string> = { en: 'en-US', tr: 'tr-TR', uz: 'uz-UZ' };
  return d.toLocaleDateString(localeMap[lang] ?? 'en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

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
          border: `1px solid ${ESPRESSO_FAINT}`,
          display: 'flex', alignItems: 'flex-start',
          justifyContent: 'center', paddingTop: '0.26rem',
        }}
        aria-hidden="true"
      >
        <div style={{ width: 3, height: 5, borderRadius: '999px', background: ROSE }} />
      </motion.div>
      <span style={{ fontFamily: sans, fontSize: '0.48rem', letterSpacing: '0.32em', textTransform: 'uppercase', color: ESPRESSO_FAINT }}>
        {t.scrollDown}
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
  const STATUS_OPTIONS = [
    { value: 'attending', label: 'Attending' },
    { value: 'declined',  label: 'Declined' },
    { value: 'maybe',     label: 'Maybe' },
  ] as const;

  const {
    register,
    handleSubmit,
    watch,
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

  const submitMutation = useMutation({
    mutationFn: rsvpApi.submitPublic,
    onSuccess: () => {
      toast.success('RSVP received!');
      onSuccess();
    },
    onError: () => {
      toast.error('Failed to submit. Please try again.');
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
    <form onSubmit={handleSubmit((values) => submitMutation.mutate(values))} noValidate className="space-y-5">
      <input type="hidden" {...register('token')} />
      <input type="hidden" {...register('eventId', { valueAsNumber: true })} />

      <div className="space-y-4">
        <div>
          <label htmlFor="pub-name" style={{ fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
            Your Name <span style={{ color: 'var(--accent-rose)' }}>*</span>
          </label>
          <input id="pub-name" type="text" autoFocus {...register('name')} className={INPUT_CLASS} style={glassInput} placeholder="Your full name" />
          {errors.name && <p className="mt-1 text-xs" style={{ color: 'var(--accent-rose)' }}>{errors.name.message}</p>}
        </div>
        <div>
          <label htmlFor="pub-partner" style={{ fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
            Partner's Name <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>(if attending together)</span>
          </label>
          <input id="pub-partner" type="text" {...register('partnerName')} className={INPUT_CLASS} style={glassInput} placeholder="Partner's full name" />
        </div>
        <div>
          <label htmlFor="pub-phone" style={{ fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
            Phone <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>(optional)</span>
          </label>
          <input id="pub-phone" type="tel" {...register('phone')} className={INPUT_CLASS} style={glassInput} placeholder="+1 555 000 0000" />
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="pub-status" style={{ fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
              Attendance <span style={{ color: 'var(--accent-rose)' }}>*</span>
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
                Guests
              </label>
              <select id="pub-count" {...register('guestCount', { valueAsNumber: true })} className={`${INPUT_CLASS} appearance-none`} style={glassInput}>
                {[1, 2, 3, 4, 5].map((n) => (<option key={n} value={n}>{n}</option>))}
              </select>
            </div>
          )}
        </div>
        <div className="mt-3">
          <label htmlFor="pub-message" style={{ fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
            Message
          </label>
          <textarea id="pub-message" rows={2} {...register('message')} className={`${INPUT_CLASS} resize-none`} style={glassInput} placeholder="Optional note to the couple" />
        </div>
      </div>

      <button type="submit" disabled={submitMutation.isPending} className="btn-primary w-full" style={{ marginTop: '1rem' }}>
        {submitMutation.isPending ? 'Sending…' : 'Send RSVP'}
      </button>
    </form>
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
    { value: 'attending', label: 'Attending' },
    { value: 'declined',  label: 'Declined' },
    { value: 'maybe',     label: 'Maybe' },
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
      toast.success('Registration complete!');
      onSuccess();
    },
    onError: () => {
      toast.error('Failed to register. Please try again.');
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
    <form onSubmit={handleSubmit((values) => claimMutation.mutate(values))} noValidate className="space-y-5">
      <input type="hidden" {...register('token')} />

      <div className="space-y-4">
        <div>
          <label htmlFor="claim-name" style={{ fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
            Full Name <span style={{ color: 'var(--accent-rose)' }}>*</span>
          </label>
          <input id="claim-name" type="text" autoFocus {...register('name')} className={INPUT_CLASS} style={glassInput} placeholder="Your full name" />
          {errors.name && <p className="mt-1 text-xs" style={{ color: 'var(--accent-rose)' }}>{errors.name.message}</p>}
        </div>
        <div>
          <label htmlFor="claim-email" style={{ fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
            Email <span style={{ color: 'var(--accent-rose)' }}>*</span>
          </label>
          <input id="claim-email" type="email" {...register('email')} className={INPUT_CLASS} style={glassInput} placeholder="your@email.com" />
          {errors.email && <p className="mt-1 text-xs" style={{ color: 'var(--accent-rose)' }}>{errors.email.message}</p>}
        </div>
        <div>
          <label htmlFor="claim-phone" style={{ fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
            Phone <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>(optional)</span>
          </label>
          <input id="claim-phone" type="tel" {...register('phone')} className={INPUT_CLASS} style={glassInput} placeholder="+1 555 000 0000" />
        </div>
      </div>

      {events.map((ev, idx) => (
        <div key={ev.id} style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
          <p style={{ fontFamily: serif, fontStyle: 'italic', fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
            {ev.name}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor={`entry-status-${ev.id}`} style={{ fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
                Attendance <span style={{ color: 'var(--accent-rose)' }}>*</span>
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
                Guests
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
              Dietary Restrictions
            </label>
            <input id={`entry-dietary-${ev.id}`} type="text" {...register(`rsvpEntries.${idx}.dietary`)} className={INPUT_CLASS} style={glassInput} placeholder="Optional" />
          </div>
          <div className="mt-3">
            <label htmlFor={`entry-message-${ev.id}`} style={{ fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
              Message
            </label>
            <textarea id={`entry-message-${ev.id}`} rows={2} {...register(`rsvpEntries.${idx}.message`)} className={`${INPUT_CLASS} resize-none`} style={glassInput} placeholder="Optional note to the couple" />
          </div>
        </div>
      ))}

      <button type="submit" disabled={claimMutation.isPending} className="btn-primary w-full" style={{ marginTop: '1rem' }}>
        {claimMutation.isPending ? 'Registering…' : 'Confirm Registration'}
      </button>
    </form>
  );
}

// ─── Success screen ───────────────────────────────────────────────────────────
function ClaimSuccessScreen() {
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
      <h2 style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
        You&rsquo;re registered!
      </h2>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '24rem', margin: '0 auto' }}>
        Thank you for registering. We look forward to celebrating with you.
      </p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const wrapRef   = useRef<HTMLDivElement>(null);
  const rsvpRef   = useRef<HTMLElement>(null);
  const heroRef   = useRef<HTMLElement>(null);
  const countdownRef = useRef<HTMLElement>(null);

  const countdownInView = useInView(countdownRef, { root: wrapRef, once: true, amount: 0.3 });
  const rsvpInView     = useInView(rsvpRef,       { root: wrapRef, once: true, amount: 0.3 });

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

  const scrollToRSVP = () =>
    rsvpRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

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
          <h1 style={{ fontFamily: serif, fontStyle: 'italic', fontSize: '2rem', color: ESPRESSO, marginBottom: '0.5rem' }}>
            {t.invitationNotFound}
          </h1>
          <p style={{ fontSize: '0.85rem', color: ESPRESSO_DIM, maxWidth: '22rem', margin: '0 auto' }}>
            {t.invitationExpired}
          </p>
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
          <h1 style={{ fontFamily: serif, fontStyle: 'italic', fontSize: '2rem', color: ESPRESSO, marginBottom: '0.75rem' }}>
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
    return (
      <div style={{ minHeight: '100vh', background: PARCHMENT, color: ESPRESSO, overflowX: 'hidden' }}>
        <div className="grain-overlay" aria-hidden="true" />
        <SideVinesFirefly />

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
          <p style={{ fontFamily: sans, fontSize: '0.5rem', fontWeight: 500, letterSpacing: '0.38em', textTransform: 'uppercase', color: ESPRESSO_FAINT }}>
            {t.cordiallyInvited}
          </p>
          <LanguageSwitcher />
        </motion.header>

        <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6rem 1.5rem 4rem', position: 'relative', overflow: 'hidden', background: PARCHMENT }}>
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 0, background: 'radial-gradient(ellipse 65% 55% at 50% 45%, rgba(240,200,204,0.25) 0%, transparent 70%)' }} />
          <FloatingPetals petals={HERO_PETALS} />
          <VineCornerTL inView={true} />
          <VineCornerBR inView={true} />

          <div style={{ maxWidth: '40rem', width: '100%', position: 'relative', zIndex: 10 }}>
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1.5rem' }}
              >
                <div style={{ width: 36, height: 1, background: ROSE, opacity: 0.7 }} aria-hidden="true" />
                <span style={{ fontFamily: sans, fontSize: '0.5rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: ROSE, fontWeight: 500 }}>
                  {t.youveBeenInvited}
                </span>
                <div style={{ width: 36, height: 1, background: ROSE, opacity: 0.7 }} aria-hidden="true" />
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 300, fontSize: 'clamp(2rem, 6vw, 3.5rem)', color: ESPRESSO, marginBottom: '1.5rem' }}
              >
                {t.pleaseRegister}
              </motion.h1>
              <GardenDivider />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="glass rounded-3xl noise"
              style={{ padding: 'clamp(1.5rem, 5vw, 2.5rem)', boxShadow: 'var(--shadow-lg)', position: 'relative' }}
            >
              {/* Animated top accent line replaces static 60px line */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1.2, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
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
        <p style={{ fontFamily: sans, fontSize: '0.5rem', fontWeight: 500, letterSpacing: '0.38em', textTransform: 'uppercase', color: ESPRESSO_FAINT }}>
          {monogram}
        </p>
        <LanguageSwitcher />
      </motion.header>

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
            <span style={{ fontFamily: sans, fontSize: '0.5rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: ROSE, fontWeight: 500 }}>
              {t.personalInvitationFor}
            </span>
            <div style={{ width: 36, height: 1, background: ROSE, opacity: 0.6 }} aria-hidden="true" />
          </motion.div>

          {/* Guest name (and optional partner) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            style={{ marginBottom: '0.5rem' }}
          >
            <span style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 300, fontSize: 'clamp(1.4rem, 4vw, 2.2rem)', color: ESPRESSO_DIM, display: 'block' }}>
              {guest.name}{partnerName ? ` & ${partnerName}` : ''}
            </span>
          </motion.div>

          {/* Couple name with "&" divider */}
          {secondName ? (
            <>
              <motion.h1
                initial={{ opacity: 0, y: 36, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 1.3, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
                style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(3rem, 9vw, 8rem)', lineHeight: 0.88, letterSpacing: '-0.02em', margin: 0, ...NAME_GRADIENT }}
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
                <span style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 'clamp(1.5rem, 4.5vw, 3.5rem)', color: GOLD }}>&</span>
                <div style={{ flex: 1, maxWidth: '6rem', height: 1, background: GOLD_DIM }} />
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 36, filter: 'blur(0px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 1.3, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
                style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(3rem, 9vw, 8rem)', lineHeight: 0.88, letterSpacing: '-0.02em', margin: 0, ...NAME_GRADIENT }}
              >
                {secondName}
              </motion.h1>
            </>
          ) : (
            <motion.h1
              initial={{ opacity: 0, y: 36, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 1.3, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
              style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(3rem, 9vw, 8rem)', lineHeight: 0.88, letterSpacing: '-0.02em', margin: 0, ...NAME_GRADIENT }}
            >
              {coupleName}
            </motion.h1>
          )}

          {eventCity && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.6 }}
              style={{ fontFamily: sans, fontSize: '0.54rem', letterSpacing: '0.38em', textTransform: 'uppercase', color: GOLD, marginTop: 'clamp(0.5rem, 1.5vh, 1rem)' }}
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

          {/* Polaroid photo card */}
          <motion.div
            initial={{ opacity: 0, y: 24, rotate: 2 }}
            animate={{ opacity: 1, y: 0, rotate: 2 }}
            whileHover={{ rotate: 0, scale: 1.02, y: -4 }}
            transition={{
              opacity: { duration: 0.8, delay: 0.9 },
              y: { duration: 0.8, delay: 0.9 },
              rotate: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
              scale:  { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
            }}
            style={{ display: 'inline-block', marginBottom: 'clamp(1.5rem, 3vh, 2.5rem)', position: 'relative' }}
          >
            <div style={{
              padding: '0.625rem', paddingBottom: '2.5rem',
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid var(--glass-border)',
              borderRadius: '0.5rem',
              boxShadow: '0 24px 60px rgba(0,0,0,0.2), 0 6px 16px rgba(0,0,0,0.1)',
            }}>
              <img
                src={COUPLE_PHOTO}
                alt="The happy couple"
                style={{ width: 'clamp(130px, 20vw, 220px)', height: 'clamp(160px, 25vw, 280px)', objectFit: 'cover', objectPosition: 'center 40%', borderRadius: '0.25rem', display: 'block' }}
              />
              <div style={{ position: 'absolute', bottom: '0.6rem', left: 0, right: 0, textAlign: 'center', fontFamily: serif, fontStyle: 'italic', fontSize: '0.7rem', color: ESPRESSO_DIM }} aria-hidden="true">
                {coupleName}
              </div>
            </div>
            <div style={{ position: 'absolute', inset: -16, borderRadius: '0.75rem', background: `radial-gradient(circle, rgba(240,200,204,0.15) 0%, transparent 70%)`, filter: 'blur(16px)', zIndex: -1, pointerEvents: 'none' }} aria-hidden="true" />
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

      {/* ════════════════════ COUNTDOWN ════════════════════ */}
      <section
        ref={countdownRef}
        className="garden-slide"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: CREAM }}
        aria-label="Countdown timer"
      >
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 0, background: 'radial-gradient(ellipse 60% 55% at 50% 50%, rgba(240,200,204,0.2) 0%, transparent 70%)' }} />
        <VineCornerTL inView={countdownInView} />

        <div style={{ maxWidth: '50rem', margin: '0 auto', width: '100%', padding: '0 1.5rem', position: 'relative', zIndex: 5 }}>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.8 }}
            style={{ textAlign: 'center', fontFamily: sans, fontSize: '0.55rem', fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD, marginBottom: '0.75rem' }}
          >
            {t.countingDown}
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 1.0, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            style={{ textAlign: 'center', fontFamily: serif, fontStyle: 'italic', fontWeight: 300, fontSize: 'clamp(2rem, 5vw, 3.5rem)', letterSpacing: '-0.02em', color: ESPRESSO, marginBottom: '3.5rem' }}
          >
            {t.untilTheDay}
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <CountdownTimer targetDate={targetDateTime} />
          </motion.div>
        </div>
      </section>

      {/* ════════════════════ VENUE ════════════════════ */}
      <section
        className="garden-slide"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: PARCHMENT, overflowY: 'auto' }}
        aria-label="Event venue"
      >
        <div style={{ maxWidth: '56rem', margin: '0 auto', width: '100%', padding: '0 1.5rem' }}>
          {/* Section header */}
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.8 }}
              style={{ fontFamily: sans, fontSize: '0.55rem', fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD, marginBottom: '0.75rem' }}
            >
              {t.venue}
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 1.0, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 300, fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', letterSpacing: '-0.02em', color: ESPRESSO, marginBottom: '1rem' }}
            >
              {event.venueName}
            </motion.h2>
            <GardenDivider maxWidth="16rem" />
          </div>

          {/* 3 detail cards */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8 }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))', gap: '1rem', marginBottom: event.mapsUrl ? '1.5rem' : 0 }}
          >
            {[
              { label: t.venue, value: event.venueName, sub: event.venueAddress },
              { label: t.date,  value: displayDate,     sub: event.time },
              { label: t.dressCode, value: event.dressCode ?? '—', sub: null },
            ].map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.7, delay: 0.05 * i }}
                style={{
                  background: 'rgba(255,252,248,0.85)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: `1px solid ${GOLD_DIM}`,
                  borderRadius: '18px',
                  padding: 'clamp(1.25rem, 3vw, 2rem)',
                  boxShadow: '0 4px 20px rgba(42,31,26,0.06)',
                }}
              >
                <p style={{ fontFamily: sans, fontSize: '0.55rem', fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: ESPRESSO_FAINT, marginBottom: '0.75rem' }}>
                  {card.label}
                </p>
                <p style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', color: ESPRESSO, marginBottom: card.sub ? '0.25rem' : 0, lineHeight: 1.3 }}>
                  {card.value}
                </p>
                {card.sub && (
                  <p style={{ fontFamily: sans, fontSize: '0.78rem', color: ESPRESSO_DIM, lineHeight: 1.5 }}>
                    {card.sub}
                  </p>
                )}
              </motion.div>
            ))}
          </motion.div>

          {event.mapsUrl && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.8, delay: 0.15 }}
              className="glass map-container rounded-3xl overflow-hidden"
              style={{ height: 'clamp(200px, 30vw, 300px)', boxShadow: 'var(--shadow-lg)' }}
            >
              <iframe
                src={event.mapsUrl}
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`Map showing ${event.venueName}`}
                aria-label={`Map of ${event.venueAddress}`}
              />
            </motion.div>
          )}
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
              style={{ fontFamily: sans, fontSize: '0.5rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: ROSE, fontWeight: 500, marginBottom: '0.75rem' }}
            >
              {t.kindlyReply}
            </motion.p>
            <motion.h2
              id="rsvp-form-heading"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 1.0, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 300, fontSize: 'clamp(2.2rem, 6vw, 3.5rem)', letterSpacing: '-0.02em', color: ESPRESSO, margin: '0 0 1rem' }}
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
            <p style={{ fontFamily: sans, fontSize: '0.62rem', letterSpacing: '0.12em', color: ESPRESSO_FAINT }}>
              {t.madeWithLove}
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
