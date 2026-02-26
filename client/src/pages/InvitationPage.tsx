import { useRef, useContext } from 'react';
import { motion } from 'framer-motion';
import CountdownTimer from '../components/CountdownTimer';
import RSVPForm from '../components/RSVPForm';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { EVENT_CONFIG } from '../config/event';
import { useTranslation } from '../lib/i18n';
import { LanguageContext } from '../context/LanguageContext';
import type { Language } from '../lib/i18n';

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, delay: i * 0.18, ease: [0.22, 1, 0.36, 1] },
  }),
};

function LeafDivider() {
  return (
    <div className="flex items-center justify-center gap-3 my-10" aria-hidden="true">
      <svg width="80" height="12" viewBox="0 0 80 12" fill="none" className="opacity-60">
        <path d="M 0 6 Q 20 0 40 6 Q 60 12 80 6" stroke="#c9a55a" strokeWidth="1" fill="none"/>
        <path d="M 30 6 Q 35 2 40 6 Q 45 10 50 6" stroke="#c9a55a" strokeWidth="1.5" fill="none"/>
      </svg>
      <span className="text-elfgold-500 text-base">✦</span>
      <svg width="80" height="12" viewBox="0 0 80 12" fill="none" className="opacity-60" style={{ transform: 'scaleX(-1)' }}>
        <path d="M 0 6 Q 20 0 40 6 Q 60 12 80 6" stroke="#c9a55a" strokeWidth="1" fill="none"/>
        <path d="M 30 6 Q 35 2 40 6 Q 45 10 50 6" stroke="#c9a55a" strokeWidth="1.5" fill="none"/>
      </svg>
    </div>
  );
}

function CornerOrnament({ className, style }: { className: string; style?: React.CSSProperties }) {
  return (
    <svg
      width="60"
      height="60"
      viewBox="0 0 60 60"
      fill="none"
      className={`absolute pointer-events-none opacity-40 ${className}`}
      style={style}
      aria-hidden="true"
    >
      <path d="M 2 2 L 2 20 M 2 2 L 20 2" stroke="#c9a55a" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M 2 2 Q 18 8 24 24" stroke="#c9a55a" strokeWidth="0.8" fill="none" opacity="0.6"/>
      <circle cx="2" cy="2" r="2" fill="#c9a55a"/>
    </svg>
  );
}

export default function InvitationPage() {
  const rsvpRef = useRef<HTMLElement>(null);
  const t = useTranslation();
  const { language } = useContext(LanguageContext);
  const lang = language as Language;

  const scrollToRSVP = () => {
    rsvpRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const coupleName = EVENT_CONFIG.names[lang];
  const displayDate = EVENT_CONFIG.displayDate[lang];
  const dressCode = EVENT_CONFIG.dressCode[lang];
  const rsvpDeadline = EVENT_CONFIG.rsvpDeadlineDisplay[lang];

  return (
    <div className="min-h-screen bg-mystic-950 text-parchment-200">

      {/* Language switcher — fixed top right */}
      <div className="fixed top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>

      {/* ── HERO ── */}
      <section
        className="relative min-h-screen flex flex-col items-center justify-center px-4 py-24 overflow-hidden stars-bg"
        aria-label="Event hero"
      >
        {/* Layered background gradients */}
        <div
          className="absolute inset-0"
          aria-hidden="true"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% 30%, rgba(80,61,154,0.18) 0%, transparent 70%), radial-gradient(ellipse 60% 80% at 20% 80%, rgba(46,74,53,0.12) 0%, transparent 60%), linear-gradient(180deg, #0e0c1a 0%, #120d22 50%, #0e0c1a 100%)',
          }}
        />

        {/* Subtle top vignette */}
        <div
          className="absolute top-0 left-0 right-0 h-32 pointer-events-none"
          aria-hidden="true"
          style={{ background: 'linear-gradient(to bottom, rgba(14,12,26,0.8), transparent)' }}
        />

        <div className="relative z-10 max-w-3xl mx-auto text-center">

          {/* Pre-title */}
          <motion.p
            custom={0}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="font-serif text-elfgold-400 uppercase tracking-[0.4em] text-xs sm:text-sm mb-8 text-glow-gold"
          >
            {t.cordiallyInvited}
          </motion.p>

          {/* Main title */}
          <motion.h1
            custom={1}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold text-parchment-200 mb-3 leading-tight"
            style={{ fontFamily: '"Cinzel Decorative", "Cinzel", Georgia, serif' }}
          >
            {coupleName}
          </motion.h1>

          <motion.p
            custom={2}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="font-body text-parchment-400/70 text-lg sm:text-xl italic leading-relaxed mb-6"
          >
            ♡
          </motion.p>

          {/* Ornamental divider */}
          <motion.div
            custom={3}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="flex items-center justify-center gap-4 mb-8"
            aria-hidden="true"
          >
            <div className="h-px w-16 sm:w-24 bg-gradient-to-r from-transparent to-elfgold-500/60" />
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M 12 2 L 14 9 L 22 9 L 16 14 L 18 22 L 12 17 L 6 22 L 8 14 L 2 9 L 10 9 Z" fill="#c9a55a" opacity="0.7"/>
            </svg>
            <div className="h-px w-16 sm:w-24 bg-gradient-to-l from-transparent to-elfgold-500/60" />
          </motion.div>

          {/* Couple photo */}
          {EVENT_CONFIG.couplePhoto && (
            <motion.div
              custom={4}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="flex justify-center mb-8"
            >
              <div className="relative animate-float">
                {/* Outer glow ring */}
                <div
                  className="absolute inset-0 rounded-full animate-glow-pulse"
                  style={{ boxShadow: '0 0 40px rgba(201,165,90,0.25), 0 0 80px rgba(201,165,90,0.1)' }}
                  aria-hidden="true"
                />
                <img
                  src={EVENT_CONFIG.couplePhoto}
                  alt="The happy couple"
                  className="w-36 h-36 sm:w-48 sm:h-48 rounded-full object-cover relative z-10"
                  style={{ border: '1.5px solid rgba(201,165,90,0.5)' }}
                />
              </div>
            </motion.div>
          )}

          {/* Event info pills */}
          <motion.div
            custom={5}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="flex flex-wrap justify-center gap-6 sm:gap-10 mb-12"
          >
            <div className="text-center">
              <p className="text-elfgold-500 text-xs font-serif uppercase tracking-widest mb-1">
                {t.date}
              </p>
              <p className="text-parchment-200 font-body text-base sm:text-lg">{displayDate}</p>
            </div>
            <div className="w-px bg-elfgold-600/30 hidden sm:block" aria-hidden="true" />
            <div className="text-center">
              <p className="text-elfgold-500 text-xs font-serif uppercase tracking-widest mb-1">
                {t.time}
              </p>
              <p className="text-parchment-200 font-body text-base sm:text-lg">{EVENT_CONFIG.displayTime}</p>
            </div>
            <div className="w-px bg-elfgold-600/30 hidden sm:block" aria-hidden="true" />
            <div className="text-center">
              <p className="text-elfgold-500 text-xs font-serif uppercase tracking-widest mb-1">
                {t.dressCode}
              </p>
              <p className="text-parchment-200 font-body text-base sm:text-lg">{dressCode}</p>
            </div>
          </motion.div>

          {/* Countdown */}
          <motion.div custom={6} initial="hidden" animate="visible" variants={fadeUp}>
            <CountdownTimer targetDate={EVENT_CONFIG.date} />
          </motion.div>

          {/* CTA button */}
          <motion.div
            custom={7}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="mt-12"
          >
            <button
              onClick={scrollToRSVP}
              className="btn-elfgold"
              aria-label={t.scrollDown}
            >
              {t.rsvpButton}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
          </motion.div>
        </div>

        {/* Bottom fade */}
        <div
          className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
          aria-hidden="true"
          style={{ background: 'linear-gradient(to top, rgba(14,12,26,0.9), transparent)' }}
        />
      </section>

      {/* ── EVENT DETAILS ── */}
      <section
        className="relative py-20 px-4 overflow-hidden"
        aria-label="Event details"
        style={{ background: 'linear-gradient(180deg, #0e0c1a 0%, #120d22 50%, #0e0c1a 100%)' }}
      >
        {/* Subtle side ornaments */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-40 bg-gradient-to-b from-transparent via-elfgold-600/20 to-transparent" aria-hidden="true" />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-40 bg-gradient-to-b from-transparent via-elfgold-600/20 to-transparent" aria-hidden="true" />

        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-14"
          >
            <p className="text-elfgold-500 text-xs font-serif uppercase tracking-[0.4em] mb-4">
              {t.aboutEvent}
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl text-parchment-200 mb-2 text-glow-gold">
              {t.eventSubheading}
            </h2>
            <LeafDivider />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="relative card-mystic overflow-hidden"
          >
            {/* Corner ornaments */}
            <CornerOrnament className="top-3 left-3" />
            <CornerOrnament className="top-3 right-3" style={{ transform: 'scaleX(-1)' } as React.CSSProperties} />
            <CornerOrnament className="bottom-3 left-3" style={{ transform: 'scaleY(-1)' } as React.CSSProperties} />
            <CornerOrnament className="bottom-3 right-3" style={{ transform: 'scale(-1,-1)' } as React.CSSProperties} />

            <div className="p-8 sm:p-10 grid sm:grid-cols-2 gap-8">
              <div>
                <p className="text-elfgold-500 text-xs font-serif uppercase tracking-widest mb-2">
                  {t.venue}
                </p>
                <h3 className="font-serif text-xl text-parchment-200 mb-1">
                  {EVENT_CONFIG.venue.name}
                </h3>
                <p className="text-parchment-400/60 font-body text-sm">{EVENT_CONFIG.venue.address}</p>
              </div>
              <div className="sm:text-right">
                <p className="text-elfgold-500 text-xs font-serif uppercase tracking-widest mb-2">
                  {t.rsvpDeadline}
                </p>
                <p className="font-serif text-xl text-parchment-200">{rsvpDeadline}</p>
              </div>
            </div>

            {EVENT_CONFIG.venue.mapsEmbedUrl && (
              <div className="h-52 sm:h-72 border-t border-silver-300/10">
                <iframe
                  src={EVENT_CONFIG.venue.mapsEmbedUrl}
                  className="w-full h-full border-0 opacity-90"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={`Map showing location of ${EVENT_CONFIG.venue.name}`}
                  aria-label={`Map of ${EVENT_CONFIG.venue.address}`}
                  style={{ filter: 'hue-rotate(200deg) saturate(0.6) brightness(0.7)' }}
                />
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── RSVP ── */}
      <section
        ref={rsvpRef}
        id="rsvp"
        className="relative py-20 px-4 overflow-hidden"
        aria-labelledby="rsvp-heading"
        style={{ background: 'linear-gradient(180deg, #0e0c1a 0%, #100e1e 100%)' }}
      >
        {/* Background glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
          style={{
            background: 'radial-gradient(ellipse 50% 40% at 50% 60%, rgba(80,61,154,0.12) 0%, transparent 70%)',
          }}
        />

        <div className="max-w-lg mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-10"
          >
            <p className="text-elfgold-500 text-xs font-serif uppercase tracking-[0.4em] mb-4">
              {t.kindlyReply}
            </p>
            <h2 id="rsvp-heading" className="font-serif text-3xl sm:text-4xl text-parchment-200 text-glow-gold">
              {t.rsvpHeading}
            </h2>
            <p className="mt-3 text-parchment-400/60 font-body text-base">
              {t.rsvpDeadlineNote} {rsvpDeadline}
            </p>
            <LeafDivider />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="relative card-mystic p-6 sm:p-8"
          >
            <CornerOrnament className="top-3 left-3" />
            <CornerOrnament className="top-3 right-3" style={{ transform: 'scaleX(-1)' } as React.CSSProperties} />
            <CornerOrnament className="bottom-3 left-3" style={{ transform: 'scaleY(-1)' } as React.CSSProperties} />
            <CornerOrnament className="bottom-3 right-3" style={{ transform: 'scale(-1,-1)' } as React.CSSProperties} />
            <RSVPForm />
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        className="py-8 px-4 text-center border-t"
        style={{ borderColor: 'rgba(201,165,90,0.1)', background: '#0e0c1a' }}
      >
        <div className="flex items-center justify-center gap-3 mb-3" aria-hidden="true">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-elfgold-500/30" />
          <span className="text-elfgold-600 text-xs">✦</span>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-elfgold-500/30" />
        </div>
        <p className="text-parchment-500/30 font-body text-sm">
          © {new Date().getFullYear()} {coupleName} · {t.allRightsReserved}
        </p>
      </footer>
    </div>
  );
}
