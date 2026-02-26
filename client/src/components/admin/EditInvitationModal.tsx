import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { updateInvitationSchema, type UpdateInvitationValues } from '@invitation/shared';
import type { AdminInvitation, AdminGuest } from '../../lib/api';

interface Props {
  invitation: AdminInvitation | null;
  guest: AdminGuest | null;
  onClose: () => void;
  onSubmit: (invitationId: number, values: UpdateInvitationValues) => void;
  isPending: boolean;
}

const STATUS_OPTIONS = [
  { value: 'attending', label: 'Attending' },
  { value: 'declined',  label: 'Declined' },
  { value: 'maybe',     label: 'Maybe' },
  { value: 'pending',   label: 'Pending' },
] as const;

export default function EditInvitationModal({ invitation, guest, onClose, onSubmit, isPending }: Props) {
  const isOpen = invitation !== null;

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
    if (invitation) {
      reset({
        status: invitation.status,
        guestCount: invitation.guestCount,
        dietary: invitation.dietary ?? '',
        message: invitation.message ?? '',
      });
    }
  }, [invitation, reset]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const INPUT_CLASS = 'w-full bg-gray-800 border border-gray-700 focus:border-gold-400 rounded-lg px-3 py-2.5 text-white font-sans text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gold-400 transition-colors';

  return (
    <AnimatePresence>
      {isOpen && invitation && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
            aria-hidden="true"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog" aria-modal="true" aria-labelledby="edit-inv-title">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div>
                  <h2 id="edit-inv-title" className="font-serif text-xl text-white">Edit RSVP</h2>
                  {guest && (
                    <p className="text-gray-500 text-xs font-sans mt-0.5">
                      {guest.name} · {invitation.eventName ?? invitation.eventSlug}
                    </p>
                  )}
                </div>
                <button onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-gold-400"
                  aria-label="Close dialog">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit((values) => invitation && onSubmit(invitation.id, values))}
                noValidate className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="inv-status" className="block text-sm font-medium font-sans text-gray-300 mb-1.5">Status</label>
                    <select id="inv-status" {...register('status')} className={`${INPUT_CLASS} appearance-none`}>
                      {STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value} className="bg-gray-800">{o.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="inv-guest-count" className="block text-sm font-medium font-sans text-gray-300 mb-1.5">Guest Count</label>
                    <select id="inv-guest-count" {...register('guestCount', { valueAsNumber: true })}
                      disabled={watchedStatus !== 'attending'}
                      className={`${INPUT_CLASS} appearance-none disabled:opacity-40`}>
                      {[1,2,3,4,5].map((n) => (
                        <option key={n} value={n} className="bg-gray-800">{n}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="inv-dietary" className="block text-sm font-medium font-sans text-gray-300 mb-1.5">Dietary Restrictions</label>
                  <input id="inv-dietary" type="text" {...register('dietary')}
                    className={INPUT_CLASS} placeholder="None" />
                </div>

                <div>
                  <label htmlFor="inv-message" className="block text-sm font-medium font-sans text-gray-300 mb-1.5">Message</label>
                  <textarea id="inv-message" rows={2} {...register('message')}
                    className={`${INPUT_CLASS} resize-none`} placeholder="None" />
                  {errors.message && <p className="mt-1 text-xs text-red-400 font-sans" role="alert">{errors.message.message}</p>}
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={onClose}
                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-sans font-medium text-sm py-2.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500">
                    Cancel
                  </button>
                  <button type="submit" disabled={isPending}
                    className="flex-1 bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-gray-950 font-sans font-semibold text-sm py-2.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gold-400 disabled:cursor-not-allowed">
                    {isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
