import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { addGuestSchema, type AddGuestValues } from '@invitation/shared';
import type { AdminEvent } from '../../lib/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: AddGuestValues) => void;
  isPending: boolean;
  events: AdminEvent[];
}

export default function AddGuestModal({ isOpen, onClose, onSubmit, isPending, events }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<AddGuestValues>({
    resolver: zodResolver(addGuestSchema),
    defaultValues: {
      status: 'pending',
      guestCount: 1,
      dietary: '',
      message: '',
      eventIds: [],
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({ status: 'pending', guestCount: 1, dietary: '', message: '', eventIds: [] });
    }
  }, [isOpen, reset]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const INPUT_CLASS = 'w-full bg-gray-800 border border-gray-700 focus:border-gold-400 rounded-lg px-3 py-2.5 text-white font-sans text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gold-400 transition-colors';
  const LABEL_CLASS = 'block text-sm font-medium font-sans text-gray-300 mb-1.5';

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
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog" aria-modal="true" aria-labelledby="add-guest-title"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h2 id="add-guest-title" className="font-serif text-xl text-white">Add Guest</h2>
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

              <form onSubmit={handleSubmit(onSubmit)} noValidate className="p-6 space-y-4">
                {/* Name */}
                <div>
                  <label htmlFor="add-name" className={LABEL_CLASS}>
                    Full Name <span className="text-gold-400">*</span>
                  </label>
                  <input id="add-name" type="text" autoFocus aria-required="true" {...register('name')}
                    className={INPUT_CLASS} placeholder="Jane Smith" />
                  {errors.name && <p className="mt-1 text-xs text-red-400 font-sans" role="alert">{errors.name.message}</p>}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="add-email" className={LABEL_CLASS}>
                    Email <span className="text-gold-400">*</span>
                  </label>
                  <input id="add-email" type="email" aria-required="true" {...register('email')}
                    className={INPUT_CLASS} placeholder="jane@example.com" />
                  {errors.email && <p className="mt-1 text-xs text-red-400 font-sans" role="alert">{errors.email.message}</p>}
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="add-phone" className={LABEL_CLASS}>Phone</label>
                  <input id="add-phone" type="tel" {...register('phone')}
                    className={INPUT_CLASS} placeholder="+90 555 000 0000 (optional)" />
                </div>

                {/* Event assignment */}
                <fieldset>
                  <legend className={`${LABEL_CLASS} mb-2`}>
                    Invite to <span className="text-gold-400">*</span>
                  </legend>
                  <Controller
                    name="eventIds"
                    control={control}
                    render={({ field }) => (
                      <div className="space-y-2">
                        {events.map((ev) => {
                          const checked = field.value.includes(ev.id);
                          return (
                            <label
                              key={ev.id}
                              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                checked
                                  ? 'bg-gold-500/10 border-gold-500/40 text-white'
                                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                              }`}
                            >
                              <input
                                type="checkbox"
                                className="sr-only"
                                checked={checked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    field.onChange([...field.value, ev.id]);
                                  } else {
                                    field.onChange(field.value.filter((id) => id !== ev.id));
                                  }
                                }}
                              />
                              <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${checked ? 'bg-gold-500 border-gold-500' : 'border-gray-600'}`}>
                                {checked && (
                                  <svg className="w-2.5 h-2.5 text-gray-950" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-sm font-sans">{ev.name}</p>
                                <p className="text-xs text-gray-500">{ev.date} · {ev.venueName}</p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  />
                  {errors.eventIds && (
                    <p className="mt-1.5 text-xs text-red-400 font-sans" role="alert">{errors.eventIds.message}</p>
                  )}
                </fieldset>

                {/* Status + Guest Count */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="add-status" className={LABEL_CLASS}>Status</label>
                    <select id="add-status" {...register('status')}
                      className={`${INPUT_CLASS} appearance-none`}>
                      {['attending','declined','maybe','pending'].map((s) => (
                        <option key={s} value={s} className="bg-gray-800 capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="add-guest-count" className={LABEL_CLASS}>Guest Count</label>
                    <select id="add-guest-count" {...register('guestCount', { valueAsNumber: true })}
                      className={`${INPUT_CLASS} appearance-none`}>
                      {[1,2,3,4,5].map((n) => (
                        <option key={n} value={n} className="bg-gray-800">{n}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Dietary */}
                <div>
                  <label htmlFor="add-dietary" className={LABEL_CLASS}>Dietary Restrictions</label>
                  <input id="add-dietary" type="text" {...register('dietary')}
                    className={INPUT_CLASS} placeholder="Optional" />
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="add-message" className={LABEL_CLASS}>Note</label>
                  <textarea id="add-message" rows={2} {...register('message')}
                    className={`${INPUT_CLASS} resize-none`} placeholder="Optional" />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={onClose}
                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-sans font-medium text-sm py-2.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500">
                    Cancel
                  </button>
                  <button type="submit" disabled={isPending}
                    className="flex-1 bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-gray-950 font-sans font-semibold text-sm py-2.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gold-400 disabled:cursor-not-allowed">
                    {isPending ? 'Adding...' : 'Add Guest'}
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
