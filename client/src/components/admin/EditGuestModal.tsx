import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { addGuestSchema, type AddGuestValues, type Guest } from '@invitation/shared';

interface Props {
  guest: Guest | null;
  onClose: () => void;
  onSubmit: (id: number, values: AddGuestValues) => void;
  isPending: boolean;
}

const STATUS_OPTIONS = [
  { value: 'attending', label: 'Attending' },
  { value: 'declined', label: 'Declined' },
  { value: 'maybe', label: 'Maybe' },
  { value: 'pending', label: 'Pending' },
] as const;

export default function EditGuestModal({ guest, onClose, onSubmit, isPending }: Props) {
  const isOpen = guest !== null;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddGuestValues>({
    resolver: zodResolver(addGuestSchema),
  });

  useEffect(() => {
    if (guest) {
      reset({
        name: guest.name,
        email: guest.email,
        status: guest.status as AddGuestValues['status'],
        guestCount: guest.guestCount,
        dietary: guest.dietary ?? '',
        message: guest.message ?? '',
      });
    }
  }, [guest, reset]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const handleFormSubmit = (values: AddGuestValues) => {
    if (guest) onSubmit(guest.id, values);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
            aria-hidden="true"
          />
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-guest-title"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h2 id="edit-guest-title" className="font-serif text-xl text-white">
                  Edit Guest
                </h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-gold-400"
                  aria-label="Close dialog"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit(handleFormSubmit)} noValidate className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label htmlFor="edit-name" className="block text-sm font-medium font-sans text-gray-300 mb-1.5">
                      Full Name
                    </label>
                    <input
                      id="edit-name"
                      autoFocus
                      type="text"
                      aria-invalid={!!errors.name}
                      {...register('name')}
                      className="w-full bg-gray-800 border border-gray-700 focus:border-gold-400 rounded-lg px-3 py-2.5 text-white font-sans text-sm focus:outline-none focus:ring-1 focus:ring-gold-400 transition-colors"
                    />
                    {errors.name && <p className="mt-1 text-xs text-red-400 font-sans" role="alert">{errors.name.message}</p>}
                  </div>

                  <div className="col-span-2">
                    <label htmlFor="edit-email" className="block text-sm font-medium font-sans text-gray-300 mb-1.5">
                      Email
                    </label>
                    <input
                      id="edit-email"
                      type="email"
                      aria-invalid={!!errors.email}
                      {...register('email')}
                      className="w-full bg-gray-800 border border-gray-700 focus:border-gold-400 rounded-lg px-3 py-2.5 text-white font-sans text-sm focus:outline-none focus:ring-1 focus:ring-gold-400 transition-colors"
                    />
                    {errors.email && <p className="mt-1 text-xs text-red-400 font-sans" role="alert">{errors.email.message}</p>}
                  </div>

                  <div>
                    <label htmlFor="edit-status" className="block text-sm font-medium font-sans text-gray-300 mb-1.5">
                      Status
                    </label>
                    <select
                      id="edit-status"
                      {...register('status')}
                      className="w-full bg-gray-800 border border-gray-700 focus:border-gold-400 rounded-lg px-3 py-2.5 text-white font-sans text-sm focus:outline-none focus:ring-1 focus:ring-gold-400 transition-colors appearance-none"
                    >
                      {STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value} className="bg-gray-800">
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="edit-guest-count" className="block text-sm font-medium font-sans text-gray-300 mb-1.5">
                      Guest Count
                    </label>
                    <select
                      id="edit-guest-count"
                      {...register('guestCount', { valueAsNumber: true })}
                      className="w-full bg-gray-800 border border-gray-700 focus:border-gold-400 rounded-lg px-3 py-2.5 text-white font-sans text-sm focus:outline-none focus:ring-1 focus:ring-gold-400 transition-colors appearance-none"
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n} className="bg-gray-800">
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label htmlFor="edit-dietary" className="block text-sm font-medium font-sans text-gray-300 mb-1.5">
                      Dietary Restrictions
                    </label>
                    <input
                      id="edit-dietary"
                      type="text"
                      {...register('dietary')}
                      className="w-full bg-gray-800 border border-gray-700 focus:border-gold-400 rounded-lg px-3 py-2.5 text-white font-sans text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gold-400 transition-colors"
                      placeholder="None"
                    />
                  </div>

                  <div className="col-span-2">
                    <label htmlFor="edit-message" className="block text-sm font-medium font-sans text-gray-300 mb-1.5">
                      Message
                    </label>
                    <textarea
                      id="edit-message"
                      rows={2}
                      {...register('message')}
                      className="w-full bg-gray-800 border border-gray-700 focus:border-gold-400 rounded-lg px-3 py-2.5 text-white font-sans text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gold-400 transition-colors resize-none"
                      placeholder="None"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-sans font-medium text-sm py-2.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-gray-950 font-sans font-semibold text-sm py-2.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gold-400 disabled:cursor-not-allowed"
                  >
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
