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
      partnerName: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({ status: 'pending', guestCount: 1, dietary: '', message: '', eventIds: [], partnerName: '' });
    }
  }, [isOpen, reset]);

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
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog" aria-modal="true" aria-labelledby="add-guest-title"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="bg-white border border-gray-200 rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 id="add-guest-title" className="font-sans font-semibold text-base text-gray-900">Add Guest</h2>
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

              <form onSubmit={handleSubmit(onSubmit)} noValidate className="p-6 space-y-4">
                {/* Name */}
                <div>
                  <label htmlFor="add-name" className={LABEL_CLASS}>
                    Full Name <span className="text-red-500" aria-hidden="true">*</span>
                  </label>
                  <input id="add-name" type="text" autoFocus aria-required="true" {...register('name')}
                    className={INPUT_CLASS} placeholder="Jane Smith" />
                  {errors.name && <p className="mt-1 text-xs text-red-600 font-sans" role="alert">{errors.name.message}</p>}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="add-email" className={LABEL_CLASS}>
                    Email <span className="text-red-500" aria-hidden="true">*</span>
                  </label>
                  <input id="add-email" type="email" aria-required="true" {...register('email')}
                    className={INPUT_CLASS} placeholder="jane@example.com" />
                  {errors.email && <p className="mt-1 text-xs text-red-600 font-sans" role="alert">{errors.email.message}</p>}
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="add-phone" className={LABEL_CLASS}>Phone</label>
                  <input id="add-phone" type="tel" {...register('phone')}
                    className={INPUT_CLASS} placeholder="+90 555 000 0000 (optional)" />
                </div>

                {/* Partner Name */}
                <div>
                  <label htmlFor="add-partner-name" className={LABEL_CLASS}>Partner Name</label>
                  <input id="add-partner-name" type="text" {...register('partnerName')}
                    className={INPUT_CLASS} placeholder="Jane Smith (optional)" />
                </div>

                {/* Event assignment */}
                <fieldset>
                  <legend className={`${LABEL_CLASS}`}>
                    Invite to <span className="text-red-500" aria-hidden="true">*</span>
                  </legend>
                  <Controller
                    name="eventIds"
                    control={control}
                    render={({ field }) => (
                      <div className="space-y-2 mt-1.5">
                        {events.map((ev) => {
                          const checked = field.value.includes(ev.id);
                          return (
                            <label
                              key={ev.id}
                              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                                checked
                                  ? 'bg-blue-50 border-blue-300 text-gray-900'
                                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
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
                              <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${checked ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'}`}>
                                {checked && (
                                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-sm font-sans">{ev.name}</p>
                                <p className="text-xs text-gray-400">{ev.date} · {ev.venueName}</p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  />
                  {errors.eventIds && (
                    <p className="mt-1.5 text-xs text-red-600 font-sans" role="alert">{errors.eventIds.message}</p>
                  )}
                </fieldset>

                {/* Status + Guest Count */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="add-status" className={LABEL_CLASS}>Status</label>
                    <select id="add-status" {...register('status')}
                      className={`${INPUT_CLASS} appearance-none`}>
                      {['attending','declined','maybe','pending'].map((s) => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="add-guest-count" className={LABEL_CLASS}>Guest Count</label>
                    <select id="add-guest-count" {...register('guestCount', { valueAsNumber: true })}
                      className={`${INPUT_CLASS} appearance-none`}>
                      {[1,2,3,4,5].map((n) => (
                        <option key={n} value={n}>{n}</option>
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

                <div className="flex gap-3 pt-2 border-t border-gray-100">
                  <button type="button" onClick={onClose}
                    className="flex-1 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-sans font-medium text-sm py-2.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400">
                    Cancel
                  </button>
                  <button type="submit" disabled={isPending}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-sans font-semibold text-sm py-2.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed">
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
