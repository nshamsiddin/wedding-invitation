import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { updateGuestContactSchema, type UpdateGuestContactValues } from '@invitation/shared';
import type { AdminGuest } from '../../lib/api';

interface Props {
  guest: AdminGuest | null;
  onClose: () => void;
  onSubmit: (id: number, values: UpdateGuestContactValues) => void;
  isPending: boolean;
}

export default function EditGuestModal({ guest, onClose, onSubmit, isPending }: Props) {
  const isOpen = guest !== null;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateGuestContactValues>({
    resolver: zodResolver(updateGuestContactSchema),
  });

  useEffect(() => {
    if (guest) {
      reset({ name: guest.name, email: guest.email, phone: guest.phone ?? '' });
    }
  }, [guest, reset]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const INPUT_CLASS = 'w-full bg-white border border-gray-300 focus:border-blue-500 rounded-lg px-3 py-2.5 text-gray-900 font-sans text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors';
  const LABEL_CLASS = 'block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40"
            aria-hidden="true"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog" aria-modal="true" aria-labelledby="edit-guest-title">
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="bg-white border border-gray-200 rounded-xl w-full max-w-sm shadow-xl"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div>
                  <h2 id="edit-guest-title" className="font-sans font-semibold text-base text-gray-900">Edit Contact</h2>
                  <p className="text-gray-400 text-xs font-sans mt-0.5">Update name, email, or phone</p>
                </div>
                <button onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Close dialog">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit((values) => guest && onSubmit(guest.id, values))}
                noValidate className="p-6 space-y-4">
                <div>
                  <label htmlFor="edit-name" className={LABEL_CLASS}>Full Name</label>
                  <input id="edit-name" type="text" autoFocus aria-invalid={!!errors.name}
                    {...register('name')} className={INPUT_CLASS} />
                  {errors.name && <p className="mt-1 text-xs text-red-600 font-sans" role="alert">{errors.name.message}</p>}
                </div>

                <div>
                  <label htmlFor="edit-email" className={LABEL_CLASS}>Email</label>
                  <input id="edit-email" type="email" aria-invalid={!!errors.email}
                    {...register('email')} className={INPUT_CLASS} />
                  {errors.email && <p className="mt-1 text-xs text-red-600 font-sans" role="alert">{errors.email.message}</p>}
                </div>

                <div>
                  <label htmlFor="edit-phone" className={LABEL_CLASS}>Phone</label>
                  <input id="edit-phone" type="tel" {...register('phone')}
                    className={INPUT_CLASS} placeholder="Optional" />
                </div>

                <div className="flex gap-3 pt-2 border-t border-gray-100">
                  <button type="button" onClick={onClose}
                    className="flex-1 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-sans font-medium text-sm py-2.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400">
                    Cancel
                  </button>
                  <button type="submit" disabled={isPending}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-sans font-semibold text-sm py-2.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed">
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
