import { useRef, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import CountdownTimer from '../components/CountdownTimer';
import RSVPForm from '../components/RSVPForm';
import LanguageSwitcher from '../components/LanguageSwitcher';
import DarkModeToggle from '../components/ui/DarkModeToggle';
import { SplitText, Reveal } from '../components/ui/AnimatedText';
import MagneticButton from '../components/ui/MagneticButton';
import { rsvpApi } from '../lib/api';
import { useTranslation } from '../lib/i18n';
import { LanguageContext } from '../context/LanguageContext';
import type { Language } from '../lib/i18n';

const COUPLE_PHOTO = '/IMG_2524.jpg';

function formatEventDate(dateStr: string, lang: Language): string {
  const d = new Date(dateStr);
  const localeMap: Record<Language, string> = { en: 'en-US', tr: 'tr-TR', uz: 'uz-UZ' };
  return d.toLocaleDateString(localeMap[lang] ?? 'en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

// Floating ambient particles
function Particles() {
  const particles = Array.from({ length: 14 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 1,
    delay: Math.random() * 6,
    duration: Math.random() * 10 + 12,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {particles.map(p => (
        <motion.div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: p.id % 2 === 0 ? 'rgba(196,151,90,0.5)' : 'rgba(201,128,138,0.4)',
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0, 0.7, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const rsvpRef = useRef<HTMLElement>(null);
  const t = useTranslation();
  const { language } = useContext(LanguageContext);
  const lang = language as Language;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['invite', token],
    queryFn: () => rsvpApi.getByToken(token!),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });

  const { scrollY } = useScroll();
  const bgY       = useTransform(scrollY, [0, 600], [0, -120]);
  const textY     = useTransform(scrollY, [0, 500], [0, -50]);
  const titleOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const photoScale = useTransform(scrollY, [0, 500], [1, 1.06]);

  const scrollToRSVP = () =>
    rsvpRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // ── Loading ──
  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          style={{
            width: 40,
            height: 40,
            border: '2px solid var(--border-warm)',
            borderTopColor: 'var(--accent-gold)',
            borderRadius: '50%',
          }}
          aria-label={t.loadingInvitation}
        />
      </div>
    );
  }

  // ── Error / not found ──
  if (isError || !data || !token) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--accent-rose)' }} aria-hidden="true">◎</p>
          <h1 style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontStyle: 'italic', fontSize: '2rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            {t.invitationNotFound}
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '22rem', margin: '0 auto' }}>
            {t.invitationExpired}
          </p>
        </div>
      </div>
    );
  }

  const { invitation, guest, event } = data;
  const displayDate = formatEventDate(event.date, lang);
  const targetDateTime = `${event.date}T${event.time}:00`;

  const coupleName = event.name.includes(' \u2014 ')
    ? event.name.split(' \u2014 ')[0]
    : event.name;

  const eventCity = event.name.includes(' \u2014 ')
    ? event.name.split(' \u2014 ')[1]
    : null;

  const prefill = {
    name:       guest.name,
    email:      guest.email,
    status:     invitation.status,
    guestCount: invitation.guestCount,
    dietary:    invitation.dietary,
    message:    invitation.message,
  };

  return (
    <div
      style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text-primary)', overflowX: 'hidden' }}
    >
      {/* Grain overlay */}
      <div className="grain-overlay" aria-hidden="true" />

      {/* Fixed nav */}
      <header
        className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-4"
        style={{ background: 'transparent' }}
      >
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-overline"
          style={{ color: 'var(--text-tertiary)' }}
        >
          {t.cordiallyInvited}
        </motion.p>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <DarkModeToggle />
        </div>
      </header>

      {/* ════════════════════ HERO ════════════════════ */}
      <section
        style={{ position: 'relative', height: '100vh', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        aria-label="Personal invitation hero"
      >
        {/* Background parallax */}
        <motion.div
          style={{ y: bgY, position: 'absolute', inset: '-20% -5%' }}
          aria-hidden="true"
        >
          <div style={{ position: 'absolute', inset: 0, background: 'var(--bg)' }} />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse 80% 70% at 50% 30%, rgba(201,128,138,0.07) 0%, transparent 60%)',
          }} />
        </motion.div>

        {/* Particles */}
        <div style={{ position: 'absolute', inset: 0 }} aria-hidden="true">
          <Particles />
          {/* Ambient orbs */}
          <div className="orb" style={{ width: 600, height: 600, top: '-15%', right: '-10%', background: 'radial-gradient(circle, rgba(201,128,138,0.08) 0%, transparent 65%)' }} />
          <div className="orb" style={{ width: 400, height: 400, bottom: '-5%', left: '-8%', background: 'radial-gradient(circle, rgba(196,151,90,0.07) 0%, transparent 65%)' }} />
        </div>

        {/* Content */}
        <motion.div
          style={{ y: textY, position: 'relative', zIndex: 10, width: '100%', maxWidth: '68rem', padding: '0 1.5rem', textAlign: 'center' }}
        >
          {/* Personal greeting */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="text-overline mb-4"
            style={{ color: 'var(--accent-rose)' }}
          >
            A Personal Invitation for
          </motion.p>

          {/* Guest name */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            style={{ marginBottom: '0.5rem' }}
          >
            <span style={{
              fontFamily: '"Cormorant Garamond", Georgia, serif',
              fontStyle: 'italic',
              fontWeight: 300,
              fontSize: 'clamp(1.4rem, 4vw, 2.2rem)',
              color: 'var(--text-secondary)',
              display: 'block',
            }}>
              {guest.name}
            </span>
          </motion.div>

          {/* Couple names — large hero type */}
          <motion.div style={{ opacity: titleOpacity }}>
            <div style={{ overflow: 'hidden', marginBottom: '0.25rem' }}>
              <h1
                aria-label={coupleName}
                style={{
                  fontFamily: '"Cormorant Garamond", Georgia, serif',
                  fontStyle: 'italic',
                  fontWeight: 300,
                  fontSize: 'clamp(3rem, 9vw, 8rem)',
                  lineHeight: 0.92,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                  display: 'block',
                  margin: '0 auto',
                }}
              >
                <SplitText text={coupleName} delay={0.7} staggerChildren={0.06} />
              </h1>
            </div>

            {eventCity && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.6 }}
                className="text-overline mt-2"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {eventCity}
              </motion.p>
            )}
          </motion.div>

          {/* Divider */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.0 }}
            className="flex items-center justify-center gap-4 my-8"
            aria-hidden="true"
          >
            <div style={{ height: 1, width: 60, background: 'linear-gradient(to right, transparent, var(--border-warm))' }} />
            <span style={{ color: 'var(--accent-rose)', fontSize: '0.6rem' }}>♡</span>
            <div style={{ height: 1, width: 60, background: 'linear-gradient(to left, transparent, var(--border-warm))' }} />
          </motion.div>

          {/* Photo card */}
          <motion.div
            initial={{ opacity: 0, y: 24, rotate: 2 }}
            animate={{ opacity: 1, y: 0, rotate: 2 }}
            whileHover={{ rotate: 0, scale: 1.03, y: -6 }}
            transition={{ opacity: { duration: 0.8, delay: 0.9 }, y: { duration: 0.8, delay: 0.9 }, rotate: { type: 'spring', stiffness: 200 } }}
            style={{ display: 'inline-block', marginBottom: '2.5rem', position: 'relative' }}
          >
            <div
              style={{
                padding: '0.625rem',
                paddingBottom: '2.5rem',
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid var(--glass-border)',
                borderRadius: '0.5rem',
                boxShadow: '0 24px 60px rgba(0,0,0,0.3), 0 6px 16px rgba(0,0,0,0.15)',
              }}
            >
              <motion.img
                src={COUPLE_PHOTO}
                alt="The happy couple"
                style={{
                  scale: photoScale,
                  width: 'clamp(150px, 22vw, 240px)',
                  height: 'clamp(180px, 28vw, 300px)',
                  objectFit: 'cover',
                  objectPosition: 'center 40%',
                  borderRadius: '0.25rem',
                  display: 'block',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: '0.6rem',
                  left: 0,
                  right: 0,
                  textAlign: 'center',
                  fontFamily: '"Cormorant Garamond", Georgia, serif',
                  fontStyle: 'italic',
                  fontSize: '0.7rem',
                  color: 'var(--text-secondary)',
                }}
                aria-hidden="true"
              >
                {coupleName}
              </div>
            </div>
            {/* Glow */}
            <div
              style={{
                position: 'absolute',
                inset: -16,
                borderRadius: '0.75rem',
                background: 'radial-gradient(circle, rgba(201,128,138,0.12) 0%, transparent 70%)',
                filter: 'blur(16px)',
                zIndex: -1,
                pointerEvents: 'none',
              }}
              aria-hidden="true"
            />
          </motion.div>

          {/* Event quick info */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.1 }}
            className="flex flex-wrap justify-center gap-8 sm:gap-14 mb-10"
          >
            {[
              { label: t.date,      value: displayDate },
              { label: t.time,      value: event.time },
              { label: t.dressCode, value: event.dressCode ?? '—' },
            ].map(({ label, value }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <p className="text-overline mb-1.5" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
                <p style={{
                  fontFamily: '"Cormorant Garamond", Georgia, serif',
                  fontStyle: 'italic',
                  fontSize: 'clamp(0.85rem, 2vw, 1rem)',
                  color: 'var(--text-primary)',
                }}>
                  {value}
                </p>
              </div>
            ))}
          </motion.div>

          {/* RSVP CTA */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.3 }}
          >
            <MagneticButton
              onClick={scrollToRSVP}
              className="btn-primary"
              aria-label={t.rsvpButton}
            >
              {t.rsvpButton}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 9l-7 7-7-7"/>
              </svg>
            </MagneticButton>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          style={{
            position: 'absolute',
            bottom: '2.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
          }}
          aria-hidden="true"
        >
          <span className="text-overline" style={{ color: 'var(--text-tertiary)', fontSize: '0.55rem' }}>SCROLL</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{ width: 1, height: 40, background: 'linear-gradient(to bottom, var(--border-warm), transparent)' }}
          />
        </motion.div>

        {/* Bottom fade */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 140,
          background: 'linear-gradient(to top, var(--bg), transparent)',
          pointerEvents: 'none',
        }} aria-hidden="true" />
      </section>

      {/* ════════════════════ COUNTDOWN ════════════════════ */}
      <section style={{ padding: '5rem 1.5rem' }} aria-label="Countdown timer">
        <div style={{ maxWidth: '50rem', margin: '0 auto' }}>
          <Reveal>
            <p className="text-overline text-center mb-3" style={{ color: 'var(--accent-gold)' }}>
              Counting Down
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 style={{
              textAlign: 'center',
              fontFamily: '"Cormorant Garamond", Georgia, serif',
              fontStyle: 'italic',
              fontWeight: 300,
              fontSize: 'clamp(1.8rem, 5vw, 3rem)',
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
              marginBottom: '3rem',
            }}>
              Until the Big Day
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <CountdownTimer targetDate={targetDateTime} />
          </Reveal>
        </div>
      </section>

      {/* ════════════════════ VENUE ════════════════════ */}
      <section style={{ padding: '2rem 1.5rem 5rem' }} aria-label="Event venue">
        <div style={{ maxWidth: '48rem', margin: '0 auto' }}>
          <Reveal>
            <div
              className="glass rounded-3xl overflow-hidden"
              style={{ boxShadow: 'var(--shadow-lg)' }}
            >
              <div style={{ padding: '2rem 2.5rem', display: 'grid', gap: '1.5rem' }} className="sm:grid-cols-2">
                <div>
                  <p className="text-overline mb-2" style={{ color: 'var(--text-tertiary)' }}>{t.venue}</p>
                  <p style={{
                    fontFamily: '"Cormorant Garamond", Georgia, serif',
                    fontStyle: 'italic',
                    fontSize: '1.2rem',
                    color: 'var(--text-primary)',
                    marginBottom: '0.25rem',
                  }}>
                    {event.venueName}
                  </p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {event.venueAddress}
                  </p>
                </div>
                <div>
                  <p className="text-overline mb-2" style={{ color: 'var(--text-tertiary)' }}>{t.date}</p>
                  <p style={{
                    fontFamily: '"Cormorant Garamond", Georgia, serif',
                    fontStyle: 'italic',
                    fontSize: '1.1rem',
                    color: 'var(--text-primary)',
                    marginBottom: '0.25rem',
                  }}>
                    {displayDate}
                  </p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{event.time}</p>
                </div>
              </div>

              {event.mapsUrl && (
                <div
                  className="map-container"
                  style={{ height: 240, borderTop: '1px solid var(--border)' }}
                >
                  <iframe
                    src={event.mapsUrl}
                    className="w-full h-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={`Map showing ${event.venueName}`}
                    aria-label={`Map of ${event.venueAddress}`}
                  />
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════════════════════ RSVP FORM ════════════════════ */}
      <section
        ref={rsvpRef}
        id="rsvp"
        style={{ padding: '5rem 1.5rem 8rem' }}
        aria-labelledby="rsvp-form-heading"
      >
        <div style={{ maxWidth: '40rem', margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <p className="text-overline mb-3" style={{ color: 'var(--accent-rose)' }}>
                {t.kindlyReply}
              </p>
              <h2
                id="rsvp-form-heading"
                style={{
                  fontFamily: '"Cormorant Garamond", Georgia, serif',
                  fontStyle: 'italic',
                  fontWeight: 300,
                  fontSize: 'clamp(2.2rem, 6vw, 3.5rem)',
                  letterSpacing: '-0.02em',
                  color: 'var(--text-primary)',
                  marginBottom: '1rem',
                }}
              >
                {t.rsvpHeading}
              </h2>
              <div className="section-line" aria-hidden="true" />
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <div
              className="glass rounded-3xl noise"
              style={{
                padding: 'clamp(1.5rem, 5vw, 2.5rem)',
                boxShadow: 'var(--shadow-lg)',
                position: 'relative',
              }}
            >
              {/* Decorative top accent */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 60,
                  height: 1,
                  background: 'linear-gradient(90deg, transparent, var(--accent-gold), transparent)',
                }}
                aria-hidden="true"
              />
              <RSVPForm token={token} eventName={event.name} prefillData={prefill} />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════════════════════ FOOTER ════════════════════ */}
      <footer
        style={{
          padding: '3rem 1.5rem',
          textAlign: 'center',
          borderTop: '1px solid var(--border)',
        }}
      >
        <div className="section-line mb-6" aria-hidden="true" />
        <p style={{
          fontFamily: '"Inter", system-ui, sans-serif',
          fontSize: '0.7rem',
          color: 'var(--text-tertiary)',
        }}>
          {t.madeWithLove}
        </p>
      </footer>
    </div>
  );
}
