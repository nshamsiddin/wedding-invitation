import { useRef, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import CountdownTimer from '../components/CountdownTimer';
import RSVPForm from '../components/RSVPForm';
import LanguageSwitcher from '../components/LanguageSwitcher';
import {
  TulipSVG,
  TulipDivider,
  Petal,
  OttomanCorner,
  formatEventDate,
} from '../components/decorative';
import { rsvpApi } from '../lib/api';
import { useTranslation } from '../lib/i18n';
import { LanguageContext } from '../context/LanguageContext';
import type { Language } from '../lib/i18n';

const COUPLE_PHOTO = '/IMG_2524.jpg';

const fadeUp = {
  hidden: { opacity: 0, y: 36 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.85, delay: i * 0.14, ease: [0.22, 1, 0.36, 1] },
  }),
};

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
  const bokehY       = useTransform(scrollY, [0, 800], [0, -140]);
  const petal1Y      = useTransform(scrollY, [0, 800], [0, -176]);
  const petal2Y      = useTransform(scrollY, [0, 800], [0, -112]);
  const petal3Y      = useTransform(scrollY, [0, 800], [0, -144]);
  const heroContentY = useTransform(scrollY, [0, 600], [0, -80]);
  const titleScale   = useTransform(scrollY, [0, 380], [1, 0.88]);
  const titleOpacity = useTransform(scrollY, [0, 320], [1, 0]);

  const scrollToRSVP = () =>
    rsvpRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ivory-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-tulip-300 border-t-tulip-500 rounded-full animate-spin" />
          <p className="text-stone-400 font-sans text-sm">{t.loadingInvitation}</p>
        </div>
      </div>
    );
  }

  if (isError || !data || !token) {
    return (
      <div className="min-h-screen bg-ivory-100 flex items-center justify-center text-center px-4">
        <div>
          <TulipSVG size={48} color="#C9707A" className="mx-auto mb-4 opacity-50" />
          <h1 className="font-serif text-2xl text-stone-600 mb-2">{t.invitationNotFound}</h1>
          <p className="text-stone-400 font-sans text-sm">{t.invitationExpired}</p>
        </div>
      </div>
    );
  }

  const { invitation, guest, event } = data;
  const displayDate = formatEventDate(event.date, lang);
  const targetDateTime = `${event.date}T${event.time}:00`;

  const prefill = {
    name:       guest.name,
    email:      guest.email,
    status:     invitation.status,
    guestCount: invitation.guestCount,
    dietary:    invitation.dietary,
    message:    invitation.message,
  };

  return (
    <div className="min-h-screen bg-ivory-100 text-stone-600 overflow-x-hidden">
      <div className="fixed top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>

      {/* ══════════════════════ HERO ══════════════════════ */}
      <section
        className="relative min-h-screen flex flex-col items-center justify-center px-4 py-24 overflow-hidden"
        aria-label="Personalized invitation"
        style={{ background: 'linear-gradient(160deg, #FEFCF7 0%, #FDF8F0 30%, #F9EAE4 65%, #F7E8E0 100%)' }}
      >
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true"
          style={{ background: 'radial-gradient(ellipse 70% 55% at 50% 20%, rgba(232,180,184,0.28) 0%, transparent 65%), radial-gradient(ellipse 50% 40% at 80% 80%, rgba(196,154,108,0.14) 0%, transparent 55%)' }} />

        {/* Layer 1: Bokeh ellipses */}
        <motion.div className="absolute inset-0 pointer-events-none" style={{ y: bokehY }} aria-hidden="true">
          <div className="absolute rounded-full" style={{ width: 320, height: 320, top: '6%', left: '3%', background: 'radial-gradient(circle, rgba(232,180,184,0.20) 0%, transparent 70%)', filter: 'blur(48px)' }} />
          <div className="absolute rounded-full" style={{ width: 400, height: 400, top: '10%', right: '2%', background: 'radial-gradient(circle, rgba(196,154,108,0.15) 0%, transparent 70%)', filter: 'blur(56px)' }} />
          <div className="absolute rounded-full" style={{ width: 260, height: 260, bottom: '20%', left: '6%', background: 'radial-gradient(circle, rgba(201,112,122,0.14) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        </motion.div>

        {/* Layer 2 & 3: Petals */}
        <motion.div className="petal-bg" style={{ y: petal1Y, top: '8%', left: '6%' }} aria-hidden="true">
          <div className="animate-petal-drift"><Petal color="#E8B4B8" size={72} style={{ opacity: 0.45 }} /></div>
        </motion.div>
        <motion.div className="petal-bg" style={{ y: petal1Y, top: '20%', left: '14%' }} aria-hidden="true">
          <div style={{ animationDelay: '2s' }} className="animate-petal-drift"><Petal color="#C9707A" size={44} style={{ opacity: 0.35 }} /></div>
        </motion.div>
        <motion.div className="petal-bg" style={{ y: petal2Y, top: '6%', right: '8%' }} aria-hidden="true">
          <div style={{ animationDelay: '1s' }} className="animate-petal-drift"><Petal color="#E8B4B8" size={58} style={{ opacity: 0.42 }} /></div>
        </motion.div>
        <motion.div className="petal-bg" style={{ y: petal3Y, bottom: '18%', left: '4%' }} aria-hidden="true">
          <div style={{ animationDelay: '0.5s' }} className="animate-petal-drift"><Petal color="#C49A6C" size={48} style={{ opacity: 0.32 }} /></div>
        </motion.div>

        {/* Layer 4: Text + photo content */}
        <motion.div style={{ y: heroContentY }} className="relative z-10 max-w-4xl mx-auto text-center w-full">

          <motion.p custom={0} initial="hidden" animate="visible" variants={fadeUp}
            className="font-sans text-tulip-600 uppercase tracking-[0.45em] text-xs sm:text-sm mb-4">
            {t.cordiallyInvited}
          </motion.p>

          {/* Guest name greeting */}
          <motion.p custom={1} initial="hidden" animate="visible" variants={fadeUp}
            className="font-serif text-stone-500 italic mb-1"
            style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.6rem)' }}>
            {guest.name}
          </motion.p>

          {/* Couple names — fluid + scroll-shrink */}
          <motion.h1
            custom={2}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            style={{ fontSize: 'clamp(2.6rem, 8.5vw, 7.5rem)', lineHeight: 1.05, scale: titleScale, opacity: titleOpacity }}
            className="font-serif font-bold text-stone-700 text-shadow-soft mb-1"
          >
            {event.name.includes(' \u2014 ') ? event.name.split(' \u2014 ')[0] : event.name}
          </motion.h1>

          {event.name.includes(' \u2014 ') && (
            <motion.p custom={3} initial="hidden" animate="visible" variants={fadeUp}
              className="font-sans text-stone-400 uppercase tracking-[0.35em] text-xs sm:text-sm mt-2 mb-1">
              {event.name.split(' \u2014 ')[1]}
            </motion.p>
          )}

          {/* Minimal separator */}
          <motion.div custom={4} initial="hidden" animate="visible" variants={fadeUp}
            className="flex items-center justify-center gap-3 my-5" aria-hidden="true">
            <div className="h-px w-12 sm:w-20" style={{ background: 'linear-gradient(to right, transparent, rgba(201,112,122,0.35))' }} />
            <span className="text-tulip-300 text-base font-serif">♡</span>
            <div className="h-px w-12 sm:w-20" style={{ background: 'linear-gradient(to left, transparent, rgba(201,112,122,0.35))' }} />
          </motion.div>

          {/* Couple photo — large, prominent */}
          <motion.div custom={5} initial="hidden" animate="visible" variants={fadeUp} className="flex justify-center mb-10">
            <div className="relative animate-float">
              <div className="absolute inset-0 rounded-full" style={{ boxShadow: '0 12px 60px rgba(201,112,122,0.28), 0 4px 20px rgba(201,112,122,0.18)' }} aria-hidden="true" />
              <img src={COUPLE_PHOTO} alt="The happy couple"
                className="w-44 h-44 sm:w-60 sm:h-60 rounded-full object-cover relative z-10"
                style={{ border: '3px solid rgba(232,180,184,0.75)', outline: '1px solid rgba(196,154,108,0.3)', outlineOffset: '5px', objectPosition: 'center 45%' }} />
            </div>
          </motion.div>

          {/* Date / time / dress code */}
          <motion.div custom={6} initial="hidden" animate="visible" variants={fadeUp}
            className="flex flex-wrap justify-center gap-8 sm:gap-14 mb-12">
            {[
              { label: t.date,      value: displayDate },
              { label: t.time,      value: event.time },
              { label: t.dressCode, value: event.dressCode ?? '—' },
            ].map(({ label, value }, i) => (
              <div key={i} className="text-center">
                <p className="text-tulip-500 text-xs font-sans font-bold uppercase tracking-widest mb-1.5">{label}</p>
                <p className="text-stone-600 font-serif text-base sm:text-lg italic">{value}</p>
              </div>
            ))}
          </motion.div>

          <motion.div custom={7} initial="hidden" animate="visible" variants={fadeUp}>
            <CountdownTimer targetDate={targetDateTime} />
          </motion.div>

          <motion.div custom={8} initial="hidden" animate="visible" variants={fadeUp} className="mt-12">
            <button
              onClick={scrollToRSVP}
              className="btn-tulip"
              aria-label={t.scrollDown}
            >
              {t.rsvpButton}
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </motion.div>
        </motion.div>

        <div
          className="absolute bottom-0 left-0 right-0 h-28 pointer-events-none"
          aria-hidden="true"
          style={{ background: 'linear-gradient(to top, #FAF3E6, transparent)' }}
        />
      </section>

      {/* ══════════════════════ EVENT DETAILS ══════════════════════ */}
      <section className="relative py-24 px-4 overflow-hidden" aria-label="Event details" style={{ backgroundColor: '#FAF3E6' }}>
        {/* Static section background — no parallax so boundaries stay seamless */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(160deg, #FAF3E6 0%, #F7E8E0 50%, #F9EAE4 100%)',
            }}
          />
          <div className="absolute inset-0 tile-pattern opacity-5" />
        </div>
        {/* Top feather */}
        <div
          className="absolute top-0 inset-x-0 h-20 pointer-events-none z-[2]"
          aria-hidden="true"
          style={{ background: 'linear-gradient(to bottom, #FAF3E6, transparent)' }}
        />
        {/* Bottom feather */}
        <div
          className="absolute bottom-0 inset-x-0 h-20 pointer-events-none z-[2]"
          aria-hidden="true"
          style={{ background: 'linear-gradient(to top, #FAF3E6, transparent)' }}
        />

        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.75 }}
            className="text-center mb-14"
          >
            <p className="text-tulip-500 text-xs font-sans font-bold uppercase tracking-[0.45em] mb-4">
              {t.aboutEvent}
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-700 italic mb-2 text-shadow-soft">
              {t.eventSubheading}
            </h2>
            <TulipDivider />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.75, delay: 0.1 }}
            className="relative card-glass overflow-hidden"
          >
            <OttomanCorner className="top-3 left-3 opacity-50" />
            <OttomanCorner
              className="top-3 right-3 opacity-50"
              style={{ transform: 'scaleX(-1)' }}
            />
            <OttomanCorner
              className="bottom-3 left-3 opacity-50"
              style={{ transform: 'scaleY(-1)' }}
            />
            <OttomanCorner
              className="bottom-3 right-3 opacity-50"
              style={{ transform: 'scale(-1,-1)' }}
            />

            <div className="p-8 sm:p-10 grid sm:grid-cols-2 gap-8">
              <div>
                <p className="text-gold-600 text-xs font-sans font-bold uppercase tracking-widest mb-2">
                  {t.venue}
                </p>
                <h3 className="font-serif text-xl font-semibold text-stone-700 italic mb-1">
                  {event.venueName}
                </h3>
                <p className="text-stone-400 font-sans text-sm leading-relaxed">
                  {event.venueAddress}
                </p>
              </div>
              <div className="sm:text-right">
                <p className="text-gold-600 text-xs font-sans font-bold uppercase tracking-widest mb-2">
                  {t.date}
                </p>
                <p className="font-serif text-xl font-semibold text-stone-700 italic">
                  {displayDate}
                </p>
                <p className="text-stone-400 font-sans text-sm mt-1">{event.time}</p>
              </div>
            </div>

            {event.mapsUrl && (
              <div
                className="h-52 sm:h-72"
                style={{ borderTop: '1px solid rgba(196,154,108,0.15)' }}
              >
                <iframe
                  src={event.mapsUrl}
                  className="w-full h-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={`Map showing ${event.venueName}`}
                  aria-label={`Map of ${event.venueAddress}`}
                  style={{ filter: 'saturate(0.7) brightness(1.05)' }}
                />
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════ RSVP ══════════════════════ */}
      <section
        ref={rsvpRef}
        id="rsvp"
        className="relative py-24 px-4 overflow-hidden"
        aria-labelledby="rsvp-heading"
        style={{ backgroundColor: '#FAF3E6' }}
      >
        {/* Static section background */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, #FAF3E6 0%, #FEFCF7 50%, #FDF8F0 100%)',
            }}
          />
        </div>
        {/* Top feather */}
        <div
          className="absolute top-0 inset-x-0 h-20 pointer-events-none z-[2]"
          aria-hidden="true"
          style={{ background: 'linear-gradient(to bottom, #FAF3E6, transparent)' }}
        />
        {/* Bottom feather — dissolves into footer */}
        <div
          className="absolute bottom-0 inset-x-0 h-20 pointer-events-none z-[2]"
          aria-hidden="true"
          style={{ background: 'linear-gradient(to top, #FDF8F0, transparent)' }}
        />
        <motion.div
          className="petal-bg hidden sm:block"
          style={{ y: petal3Y, top: '5%', left: '5%' }}
          aria-hidden="true"
        >
          <div className="animate-float opacity-20">
            <TulipSVG size={60} color="#C9707A" />
          </div>
        </motion.div>

        <div className="max-w-lg mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.75 }}
            className="text-center mb-10"
          >
            <p className="text-tulip-500 text-xs font-sans font-bold uppercase tracking-[0.45em] mb-4">
              {t.kindlyReply}
            </p>
            <h2
              id="rsvp-heading"
              className="font-serif text-3xl sm:text-4xl font-bold text-stone-700 italic text-shadow-soft"
            >
              {t.rsvpHeading}
            </h2>
            <TulipDivider />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.75, delay: 0.1 }}
            className="relative card-glass p-6 sm:p-8"
          >
            <OttomanCorner className="top-3 left-3 opacity-50" />
            <OttomanCorner
              className="top-3 right-3 opacity-50"
              style={{ transform: 'scaleX(-1)' }}
            />
            <OttomanCorner
              className="bottom-3 left-3 opacity-50"
              style={{ transform: 'scaleY(-1)' }}
            />
            <OttomanCorner
              className="bottom-3 right-3 opacity-50"
              style={{ transform: 'scale(-1,-1)' }}
            />
            <RSVPForm token={token} eventName={event.name} prefillData={prefill} />
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════ FOOTER ══════════════════════ */}
      <footer
        className="py-10 px-4 text-center"
        style={{
          background: 'linear-gradient(180deg, #FDF8F0 0%, #F7E8E0 100%)',
          borderTop: '1px solid rgba(196,154,108,0.15)',
        }}
      >
        <TulipDivider />
        <p className="text-stone-400 font-sans text-sm mt-2">{t.madeWithLove}</p>
      </footer>
    </div>
  );
}
