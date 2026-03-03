import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import {
  updateGuestContactSchema,
  updateInvitationSchema,
  type UpdateGuestContactValues,
  type UpdateInvitationValues,
} from '@invitation/shared';
import type { AdminGuest, AdminInvitation, AdminEvent } from '../../lib/api';

interface Props {
  guest: AdminGuest | null;
  events: AdminEvent[];
  onClose: () => void;
  onUpdateContact: (id: number, values: UpdateGuestContactValues) => void;
  onUpdateInvitation: (id: number, values: UpdateInvitationValues) => void;
  isContactPending: boolean;
  isInvitationPending: boolean;
}

const INPUT_CLASS =
  'w-full bg-white border border-gray-300 focus:border-blue-500 rounded-lg px-3 py-2.5 text-gray-900 font-sans text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors';
const LABEL_CLASS = 'block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5';

const STATUS_OPTIONS = [
  { value: 'attending', label: 'Attending' },
  { value: 'declined',  label: 'Declined' },
  { value: 'maybe',     label: 'Maybe' },
  { value: 'pending',   label: 'Pending' },
] as const;

function ContactTab({
  guest,
  onSubmit,
  isPending,
}: {
  guest: AdminGuest;
  onSubmit: (values: UpdateGuestContactValues) => void;
  isPending: boolean;
}) {
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
      email: guest.email ?? undefined,
      phone: guest.phone ?? undefined,
      partnerName: guest.partnerName ?? undefined,
    });
  }, [guest, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="p-6 space-y-4">
      <div>
        <label htmlFor="edit-name" className={LABEL_CLASS}>Full Name</label>
        <input
          id="edit-name"
          type="text"
          autoFocus
          aria-invalid={!!errors.name}
          {...register('name')}
          className={INPUT_CLASS}
        />
        {errors.name && (
          <p className="mt-1 text-xs text-red-600 font-sans" role="alert">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="edit-email" className={LABEL_CLASS}>Email</label>
        <input
          id="edit-email"
          type="email"
          aria-invalid={!!errors.email}
          {...register('email')}
          className={INPUT_CLASS}
        />
        {errors.email && (
          <p className="mt-1 text-xs text-red-600 font-sans" role="alert">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="edit-phone" className={LABEL_CLASS}>Phone</label>
        <input
          id="edit-phone"
          type="tel"
          {...register('phone')}
          className={INPUT_CLASS}
          placeholder="Optional"
        />
      </div>

      <div>
        <label htmlFor="edit-partner-name" className={LABEL_CLASS}>Partner Name</label>
        <input
          id="edit-partner-name"
          type="text"
          {...register('partnerName')}
          className={INPUT_CLASS}
          placeholder="Optional"
        />
      </div>

      <div className="flex gap-3 pt-2 border-t border-gray-100">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-sans font-semibold text-sm py-2.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed"
        >
          {isPending ? 'Saving…' : 'Save Contact'}
        </button>
      </div>
    </form>
  );
}

function InvitationTab({
  invitation,
  onSubmit,
  isPending,
}: {
  invitation: AdminInvitation;
  onSubmit: (id: number, values: UpdateInvitationValues) => void;
  isPending: boolean;
}) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<UpdateInvitationValues>({
    resolver: zodResolver(updateInvitationSchema),
  });

  const watchedStatus = watch('status');

  useEffect(() => {
    reset({
      status: invitation.status,
      guestCount: invitation.guestCount,
      dietary: invitation.dietary ?? '',
      partnerDietary: invitation.partnerDietary ?? '',
      message: invitation.message ?? '',
    });
  }, [invitation, reset]);

  return (
    <form
      onSubmit={handleSubmit((values) => onSubmit(invitation.id, values))}
      noValidate
      className="p-6 space-y-4"
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor={`inv-status-${invitation.id}`} className={LABEL_CLASS}>Status</label>
          <select
            id={`inv-status-${invitation.id}`}
            {...register('status')}
            className={`${INPUT_CLASS} appearance-none`}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`inv-count-${invitation.id}`} className={LABEL_CLASS}>Guest Count</label>
          <select
            id={`inv-count-${invitation.id}`}
            {...register('guestCount', { valueAsNumber: true })}
            disabled={watchedStatus !== 'attending'}
            className={`${INPUT_CLASS} appearance-none disabled:opacity-50 disabled:bg-gray-50`}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor={`inv-dietary-${invitation.id}`} className={LABEL_CLASS}>
          Dietary Restrictions
        </label>
        <input
          id={`inv-dietary-${invitation.id}`}
          type="text"
          {...register('dietary')}
          className={INPUT_CLASS}
          placeholder="None"
        />
      </div>

      <div>
        <label htmlFor={`inv-partner-dietary-${invitation.id}`} className={LABEL_CLASS}>
          Partner Dietary
        </label>
        <input
          id={`inv-partner-dietary-${invitation.id}`}
          type="text"
          {...register('partnerDietary')}
          className={INPUT_CLASS}
          placeholder="None"
        />
      </div>

      <div>
        <label htmlFor={`inv-message-${invitation.id}`} className={LABEL_CLASS}>Message</label>
        <textarea
          id={`inv-message-${invitation.id}`}
          rows={2}
          {...register('message')}
          className={`${INPUT_CLASS} resize-none`}
          placeholder="None"
        />
        {errors.message && (
          <p className="mt-1 text-xs text-red-600 font-sans" role="alert">{errors.message.message}</p>
        )}
      </div>

      <div className="pt-2 border-t border-gray-100">
        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-sans font-semibold text-sm py-2.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed"
        >
          {isPending ? 'Saving…' : 'Save RSVP'}
        </button>
      </div>
    </form>
  );
}

export default function EditGuestModal({
  guest,
  events,
  onClose,
  onUpdateContact,
  onUpdateInvitation,
  isContactPending,
  isInvitationPending,
}: Props) {
  const isOpen = guest !== null;
  const [activeTab, setActiveTab] = useState<'contact' | number>('contact');

  // Reset to contact tab whenever a different guest is opened
  useEffect(() => {
    if (guest) setActiveTab('contact');
  }, [guest?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const tabs = guest
    ? [
        { key: 'contact' as const, label: 'Contact' },
        ...guest.invitations.map((inv) => {
          const ev = events.find((e) => e.id === inv.eventId);
          const label = ev
            ? ev.slug.charAt(0).toUpperCase() + ev.slug.slice(1)
            : inv.eventName ?? `Event ${inv.eventId}`;
          return { key: inv.id, label };
        }),
      ]
    : [];

  const activeInvitation =
    typeof activeTab === 'number' && guest
      ? guest.invitations.find((inv) => inv.id === activeTab) ?? null
      : null;

  return (
    <AnimatePresence>
      {isOpen && guest && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40"
            aria-hidden="true"
          />
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-guest-title"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="bg-white border border-gray-200 rounded-xl w-full max-w-sm shadow-xl max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div>
                  <h2 id="edit-guest-title" className="font-sans font-semibold text-base text-gray-900">
                    Edit Guest
                  </h2>
                  <p className="text-gray-400 text-xs font-sans mt-0.5">{guest.name}</p>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Close dialog"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Tabs */}
              {tabs.length > 1 && (
                <div className="flex border-b border-gray-100 px-2 pt-1">
                  {tabs.map((tab) => (
                    <button
                      key={String(tab.key)}
                      onClick={() => setActiveTab(tab.key)}
                      className={`px-3 py-2 text-xs font-sans font-medium rounded-t transition-colors focus:outline-none ${
                        activeTab === tab.key
                          ? 'text-blue-600 border-b-2 border-blue-600 -mb-px'
                          : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Tab content */}
              {activeTab === 'contact' ? (
                <ContactTab
                  guest={guest}
                  onSubmit={(values) => onUpdateContact(guest.id, values)}
                  isPending={isContactPending}
                />
              ) : activeInvitation ? (
                <InvitationTab
                  invitation={activeInvitation}
                  onSubmit={onUpdateInvitation}
                  isPending={isInvitationPending}
                />
              ) : null}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
