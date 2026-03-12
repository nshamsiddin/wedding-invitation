import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import {
  updateGuestContactSchema,
  updateInvitationSchema,
  type UpdateGuestContactValues,
  type UpdateInvitationValues,
} from '@invitation/shared';
import type { AdminGuest, AdminInvitation, AdminEvent } from '../../lib/api';
import { useAdminTranslation } from '../../lib/i18n/admin';
import AdminModal from './AdminModal';
import DownloadCardButton from './DownloadCardButton';
import {
  ADMIN_INPUT_CLASS,
  ADMIN_LABEL_CLASS,
  ADMIN_SELECT_CLASS,
  ADMIN_PRIMARY_BTN_CLASS,
  getEventDisplayName,
} from './adminTokens';
import StatusPicker from './StatusPicker';
import { GOLD, GOLD_DIM, ESPRESSO, ESPRESSO_DIM } from '../../garden/tokens';

interface Props {
  guest: AdminGuest | null;
  events: AdminEvent[];
  onClose: () => void;
  onUpdateContact: (id: number, values: UpdateGuestContactValues) => void;
  onUpdateInvitation: (id: number, values: UpdateInvitationValues) => void;
  /** Called when the admin assigns this guest to a new event. */
  onAddToEvent: (guestId: number, eventId: number) => void;
  isContactPending: boolean;
  isInvitationPending: boolean;
  isAddToEventPending: boolean;
}

const GUEST_COUNT_OPTIONS = Array.from({ length: 10 }, (_, i) => i + 1);

// ─── Contact tab ──────────────────────────────────────────────────────────────

function ContactTab({
  guest,
  events,
  onSubmit,
  onAddToEvent,
  isPending,
  isAddToEventPending,
}: {
  guest: AdminGuest;
  events: AdminEvent[];
  onSubmit: (values: UpdateGuestContactValues) => void;
  onAddToEvent: (eventId: number) => void;
  isPending: boolean;
  isAddToEventPending: boolean;
}) {
  const at = useAdminTranslation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateGuestContactValues>({
    resolver: zodResolver(updateGuestContactSchema),
  });

  useEffect(() => {
    reset({
      name: guest.name,
      phone: guest.phone ?? undefined,
      partnerName: guest.partnerName ?? undefined,
    });
  }, [guest, reset]);

  // Events this guest is NOT yet assigned to
  const assignedEventIds = new Set(guest.invitations.map((i) => i.eventId));
  const unassignedEvents = events.filter((ev) => !assignedEventIds.has(ev.id));

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="p-6 space-y-4">
        <div>
          <label htmlFor="edit-name" className={ADMIN_LABEL_CLASS}>{at.fullName}</label>
          <input
            id="edit-name"
            type="text"
            autoFocus
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'edit-name-error' : undefined}
            {...register('name')}
            className={`${ADMIN_INPUT_CLASS} ${errors.name ? 'border-red-400 focus:border-red-400' : ''}`}
          />
          {errors.name && (
            <p id="edit-name-error" className="mt-1 text-xs text-red-600 font-sans" role="alert">
              {errors.name.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="edit-phone" className={ADMIN_LABEL_CLASS}>{at.phone}</label>
          <input
            id="edit-phone"
            type="tel"
            {...register('phone')}
            className={ADMIN_INPUT_CLASS}
            placeholder={at.optional}
          />
        </div>

        <div>
          <label htmlFor="edit-partner-name" className={ADMIN_LABEL_CLASS}>{at.partnerName}</label>
          <input
            id="edit-partner-name"
            type="text"
            {...register('partnerName')}
            className={ADMIN_INPUT_CLASS}
            placeholder={at.optional}
          />
        </div>

        <div className="pt-2" style={{ borderTop: '1px solid rgba(184,146,74,0.3)' }}>
          <button
            type="submit"
            disabled={isPending}
            className={ADMIN_PRIMARY_BTN_CLASS}
          >
            {isPending ? at.saving : at.saveContact}
          </button>
        </div>
      </form>

      {/* ── Add to another event ─────────────────────────────────────── */}
      {unassignedEvents.length > 0 && (
        <div
          className="px-6 pb-6"
          style={{ borderTop: `1px solid rgba(184,146,74,0.3)` }}
        >
          <p
            className="text-xs font-sans font-semibold uppercase tracking-wider mt-5 mb-3"
            style={{ color: ESPRESSO_DIM }}
          >
            {at.addToEvent}
          </p>
          <div className="flex flex-col gap-2">
            {unassignedEvents.map((ev) => (
              <button
                key={ev.id}
                onClick={() => onAddToEvent(ev.id)}
                disabled={isAddToEventPending}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg border text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)]"
                style={{
                  background: 'rgba(184,146,74,0.06)',
                  borderColor: GOLD_DIM,
                  borderStyle: 'dashed',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(184,146,74,0.12)';
                  e.currentTarget.style.borderColor = GOLD;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(184,146,74,0.06)';
                  e.currentTarget.style.borderColor = GOLD_DIM;
                }}
              >
                <svg className="w-3.5 h-3.5 flex-shrink-0" style={{ color: GOLD }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <div>
                  <p className="text-xs font-sans font-medium" style={{ color: ESPRESSO }}>
                    {at.addToEventLabel(getEventDisplayName(ev))}
                  </p>
                  <p className="text-xs font-sans" style={{ color: ESPRESSO_DIM }}>
                    {ev.date} · {ev.venueName}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Invitation (RSVP) tab ────────────────────────────────────────────────────

function InvitationTab({
  invitation,
  guest,
  events,
  onSubmit,
  isPending,
}: {
  invitation: AdminInvitation;
  guest: AdminGuest;
  events: AdminEvent[];
  onSubmit: (id: number, values: UpdateInvitationValues) => void;
  isPending: boolean;
}) {
  const at = useAdminTranslation();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    formState: { errors },
  } = useForm<UpdateInvitationValues>({
    resolver: zodResolver(updateInvitationSchema),
  });

  const watchedStatus = watch('status');
  const isTashkent = invitation.eventSlug === 'tashkent';

  useEffect(() => {
    reset({
      status: invitation.status,
      guestCount: invitation.guestCount,
      dietary: invitation.dietary ?? '',
      partnerDietary: invitation.partnerDietary ?? '',
      message: invitation.message ?? '',
      tableNumber: invitation.tableNumber ?? undefined,
      language: invitation.language ?? 'en',
    });
  }, [invitation, reset]);

  return (
    <form
      onSubmit={handleSubmit((values) => onSubmit(invitation.id, values))}
      noValidate
      className="p-6 space-y-4"
    >
      {/* Download card */}
      <div className="flex items-center justify-between pb-1" style={{ borderBottom: '1px solid rgba(184,146,74,0.2)' }}>
        <span className="text-xs font-sans font-semibold uppercase tracking-wider" style={{ color: ESPRESSO_DIM }}>
          Invitation Card
        </span>
        <DownloadCardButton guest={guest} invitation={invitation} events={events} />
      </div>

      <div>
        <p className={ADMIN_LABEL_CLASS}>{at.statusLabel}</p>
        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <StatusPicker value={field.value ?? ''} onChange={field.onChange} />
          )}
        />
      </div>

      <div>
        <label htmlFor={`inv-count-${invitation.id}`} className={ADMIN_LABEL_CLASS}>{at.guestCountLabel}</label>
        <select
          id={`inv-count-${invitation.id}`}
          {...register('guestCount', { valueAsNumber: true })}
          disabled={watchedStatus !== 'attending'}
          className={`${ADMIN_SELECT_CLASS} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {GUEST_COUNT_OPTIONS.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      {isTashkent && (
        <div>
          <label htmlFor={`inv-table-${invitation.id}`} className={ADMIN_LABEL_CLASS}>
            {at.tableNumberLabel}{' '}
            <span className="normal-case tracking-normal font-normal text-[rgba(42,31,26,0.5)]">(Tashkent)</span>
          </label>
          <input
            id={`inv-table-${invitation.id}`}
            type="number"
            min={1}
            max={500}
            {...register('tableNumber', {
              setValueAs: (v) => (v === '' || v == null || isNaN(Number(v)) ? null : Number(v)),
            })}
            className={ADMIN_INPUT_CLASS}
            placeholder="e.g. 12 (optional)"
          />
        </div>
      )}

      {/* Invitation Language */}
      <div>
        <label htmlFor={`inv-language-${invitation.id}`} className={ADMIN_LABEL_CLASS}>
          {at.languageLabel}
        </label>
        <select
          id={`inv-language-${invitation.id}`}
          {...register('language')}
          className={ADMIN_SELECT_CLASS}
        >
          <option value="en">EN — English</option>
          <option value="tr">TR — Türkçe</option>
          <option value="uz">UZ — O'zbek</option>
        </select>
      </div>

      <div>
        <label htmlFor={`inv-dietary-${invitation.id}`} className={ADMIN_LABEL_CLASS}>
          {at.dietaryLabel}
        </label>
        <input
          id={`inv-dietary-${invitation.id}`}
          type="text"
          {...register('dietary')}
          className={ADMIN_INPUT_CLASS}
          placeholder="None"
        />
      </div>

      <div>
        <label htmlFor={`inv-partner-dietary-${invitation.id}`} className={ADMIN_LABEL_CLASS}>
          {at.partnerDietaryLabel}
        </label>
        <input
          id={`inv-partner-dietary-${invitation.id}`}
          type="text"
          {...register('partnerDietary')}
          className={ADMIN_INPUT_CLASS}
          placeholder="None"
        />
      </div>

      <div>
        <label htmlFor={`inv-message-${invitation.id}`} className={ADMIN_LABEL_CLASS}>{at.messageLabel}</label>
        <textarea
          id={`inv-message-${invitation.id}`}
          rows={2}
          {...register('message')}
          className={`${ADMIN_INPUT_CLASS} resize-none`}
          placeholder="None"
        />
        {errors.message && (
          <p className="mt-1 text-xs text-red-600 font-sans" role="alert">
            {errors.message.message}
          </p>
        )}
      </div>

      <div className="pt-2" style={{ borderTop: '1px solid rgba(184,146,74,0.3)' }}>
        <button
          type="submit"
          disabled={isPending}
          className={ADMIN_PRIMARY_BTN_CLASS}
        >
          {isPending ? at.saving : at.saveRsvp}
        </button>
      </div>
    </form>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function EditGuestModal({
  guest,
  events,
  onClose,
  onUpdateContact,
  onUpdateInvitation,
  onAddToEvent,
  isContactPending,
  isInvitationPending,
  isAddToEventPending,
}: Props) {
  const isOpen = guest !== null;
  const [activeTab, setActiveTab] = useState<'contact' | number>('contact');
  const [direction, setDirection] = useState(1);
  const at = useAdminTranslation();

  useEffect(() => {
    if (guest) setActiveTab('contact');
  }, [guest?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const tabs = guest
    ? [
        { key: 'contact' as const, label: at.contactTab },
        ...guest.invitations.map((inv) => {
          const ev = events.find((e) => e.id === inv.eventId);
          const label = ev ? getEventDisplayName(ev) : inv.eventName ?? `Event ${inv.eventId}`;
          return { key: inv.id, label };
        }),
      ]
    : [];

  const activeInvitation =
    typeof activeTab === 'number' && guest
      ? guest.invitations.find((inv) => inv.id === activeTab) ?? null
      : null;

  const handleTabChange = (key: 'contact' | number) => {
    const keys = tabs.map((t) => t.key);
    const from = keys.indexOf(activeTab);
    const to = keys.indexOf(key);
    setDirection(to > from ? 1 : -1);
    setActiveTab(key);
  };

  return (
    <AdminModal
      isOpen={isOpen && guest !== null}
      onClose={onClose}
      title={at.editGuestTitle}
      subtitle={guest?.name}
      titleId="edit-guest-title"
    >
      {/* Tabs */}
      {tabs.length > 1 && (
        <div
          className="flex px-2 pt-1"
          style={{ borderBottom: `1px solid ${GOLD_DIM}` }}
          role="tablist"
          aria-label="Edit sections"
        >
          {tabs.map((tab) => (
            <button
              key={String(tab.key)}
              role="tab"
              aria-selected={activeTab === tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`relative px-3 py-2 text-xs font-sans font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)] rounded-t`}
              style={{
                color: activeTab === tab.key ? GOLD : ESPRESSO_DIM,
              }}
            >
              {tab.label}
              {activeTab === tab.key && (
                <motion.div
                  layoutId="edit-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                  style={{ background: GOLD }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Tab content */}
      <div className="overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={String(activeTab)}
            custom={direction}
            variants={{
              enter: (dir: number) => ({ opacity: 0, x: dir * 14 }),
              center: { opacity: 1, x: 0 },
              exit: (dir: number) => ({ opacity: 0, x: dir * -14 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.16, ease: 'easeInOut' }}
            role="tabpanel"
          >
            {activeTab === 'contact' && guest ? (
              <ContactTab
                guest={guest}
                events={events}
                onSubmit={(values) => onUpdateContact(guest.id, values)}
                onAddToEvent={(eventId) => onAddToEvent(guest.id, eventId)}
                isPending={isContactPending}
                isAddToEventPending={isAddToEventPending}
              />
            ) : activeInvitation && guest ? (
              <InvitationTab
                invitation={activeInvitation}
                guest={guest}
                events={events}
                onSubmit={onUpdateInvitation}
                isPending={isInvitationPending}
              />
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>
    </AdminModal>
  );
}
