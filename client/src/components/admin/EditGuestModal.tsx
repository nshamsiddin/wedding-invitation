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

  const INPUT_CLASS = 'w-full bg-gray-800 border border-gray-700 focus:border-gold-400 rounded-lg px-3 py-2.5 text-white font-sans text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gold-400 transition-colors';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
            aria-hidden="true"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog" aria-modal="true" aria-labelledby="edit-guest-title">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div>
                  <h2 id="edit-guest-title" className="font-serif text-xl text-white">Edit Contact</h2>
                  <p className="text-gray-500 text-xs font-sans mt-0.5">Update name, email, or phone</p>
                </div>
                <button onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-gold-400"
                  aria-label="Close dialog">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit((values) => guest && onSubmit(guest.id, values))}
                noValidate className="p-6 space-y-4">
                <div>
                  <label htmlFor="edit-name" className="block text-sm font-medium font-sans text-gray-300 mb-1.5">Full Name</label>
                  <input id="edit-name" type="text" autoFocus aria-invalid={!!errors.name}
                    {...register('name')} className={INPUT_CLASS} />
                  {errors.name && <p className="mt-1 text-xs text-red-400 font-sans" role="alert">{errors.name.message}</p>}
                </div>

                <div>
                  <label htmlFor="edit-email" className="block text-sm font-medium font-sans text-gray-300 mb-1.5">Email</label>
                  <input id="edit-email" type="email" aria-invalid={!!errors.email}
                    {...register('email')} className={INPUT_CLASS} />
                  {errors.email && <p className="mt-1 text-xs text-red-400 font-sans" role="alert">{errors.email.message}</p>}
                </div>

                <div>
                  <label htmlFor="edit-phone" className="block text-sm font-medium font-sans text-gray-300 mb-1.5">Phone</label>
                  <input id="edit-phone" type="tel" {...register('phone')}
                    className={INPUT_CLASS} placeholder="Optional" />
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
