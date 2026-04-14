import { useContext, useEffect, useRef } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { addGuestSchema, type AddGuestValues } from '@invitation/shared';
import type { AdminEvent } from '../../lib/api';
import { useAdminTranslation } from '../../lib/i18n/admin';
import { LanguageContext } from '../../context/LanguageContext';
import AdminModal from './AdminModal';
import {
  ADMIN_INPUT_CLASS,
  ADMIN_LABEL_CLASS,
  ADMIN_SELECT_CLASS,
  ADMIN_PRIMARY_BTN_CLASS,
  ADMIN_SECONDARY_BTN_CLASS,
} from './adminTokens';
import StatusPicker from './StatusPicker';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: AddGuestValues) => void;
  isPending: boolean;
  events: AdminEvent[];
  defaultEventId?: number;
}

const GUEST_COUNT_OPTIONS = Array.from({ length: 10 }, (_, i) => i + 1);

export default function AddGuestModal({
  isOpen,
  onClose,
  onSubmit,
  isPending,
  events,
  defaultEventId,
}: Props) {
  const at = useAdminTranslation();
  const { language: currentLanguage } = useContext(LanguageContext);

  const tashkentEvent = events.find((e) => e.slug === 'tashkent');
  const isTashkentDefault = tashkentEvent !== undefined && defaultEventId === tashkentEvent.id;

  const buildInitialStatuses = (ids: number[]) =>
    Object.fromEntries(
      ids.map((id) => [
        String(id),
        tashkentEvent && id === tashkentEvent.id ? 'attending' : 'pending',
      ]),
    ) as Record<string, 'attending' | 'declined' | 'maybe' | 'pending'>;

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AddGuestValues>({
    resolver: zodResolver(addGuestSchema),
    mode: 'onTouched',
    defaultValues: {
      status: isTashkentDefault ? 'attending' : 'pending',
      eventStatuses: defaultEventId ? buildInitialStatuses([defaultEventId]) : {},
      guestCount: 1,
      dietary: '',
      message: '',
      eventIds: defaultEventId ? [defaultEventId] : [],
      partnerName: '',
      language: currentLanguage,
    },
  });

  const selectedEventIds = useWatch({ control, name: 'eventIds' });
  const eventStatuses = watch('eventStatuses') ?? {};
  const showTableNumber = tashkentEvent !== undefined && selectedEventIds.includes(tashkentEvent.id);

  useEffect(() => {
    if (isOpen) {
      const ids = defaultEventId ? [defaultEventId] : [];
      reset({
        status: isTashkentDefault ? 'attending' : 'pending',
        eventStatuses: buildInitialStatuses(ids),
        guestCount: 1,
        dietary: '',
        message: '',
        eventIds: ids,
        partnerName: '',
        language: currentLanguage,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, reset, defaultEventId, isTashkentDefault, currentLanguage]);

  const prevShowTableNumber = useRef(showTableNumber);
  useEffect(() => {
    if (showTableNumber && !prevShowTableNumber.current && tashkentEvent) {
      setValue(`eventStatuses.${tashkentEvent.id}`, 'attending');
    }
    prevShowTableNumber.current = showTableNumber;
  }, [showTableNumber, setValue, tashkentEvent]);

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={at.addGuestTitle}
      size="md"
      titleId="add-guest-title"
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="p-6 space-y-4">
        {/* Full Name */}
        <div>
          <label htmlFor="add-name" className={ADMIN_LABEL_CLASS}>
            {at.fullName}{' '}
            <span className="text-red-500 normal-case tracking-normal font-normal" aria-hidden="true">*</span>
          </label>
          <input
            id="add-name"
            type="text"
            autoFocus
            aria-required="true"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'add-name-error' : undefined}
            {...register('name')}
            className={`${ADMIN_INPUT_CLASS} ${errors.name ? 'border-red-400 focus:border-red-400 focus-visible:ring-red-400/40' : ''}`}
            placeholder="Jane Smith"
          />
          {errors.name && (
            <p id="add-name-error" className="mt-1 text-xs text-red-600 font-sans" role="alert">
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="add-phone" className={ADMIN_LABEL_CLASS}>{at.phone}</label>
          <input
            id="add-phone"
            type="tel"
            {...register('phone')}
            className={ADMIN_INPUT_CLASS}
            placeholder="+90 555 000 0000 (optional)"
          />
        </div>

        {/* Partner Name */}
        <div>
          <label htmlFor="add-partner-name" className={ADMIN_LABEL_CLASS}>{at.partnerName}</label>
          <input
            id="add-partner-name"
            type="text"
            {...register('partnerName')}
            className={ADMIN_INPUT_CLASS}
            placeholder="Jane Smith (optional)"
          />
        </div>

        {/* Event assignment + per-event RSVP status */}
        <fieldset>
          <legend className={`${ADMIN_LABEL_CLASS} font-semibold`}>
            {at.inviteTo}{' '}
            <span className="text-red-500 normal-case tracking-normal font-normal" aria-hidden="true">*</span>
          </legend>
          <Controller
            name="eventIds"
            control={control}
            render={({ field }) => (
              <div className="space-y-2 mt-1.5">
                {events.map((ev) => {
                  const checked = field.value.includes(ev.id);
                  return (
                    <div
                      key={ev.id}
                      className={`rounded-lg border transition-colors ${
                        checked
                          ? 'bg-[rgba(184,146,74,0.10)] border-[rgba(184,146,74,0.65)]'
                          : 'bg-[#FDFAF5] border-[rgba(184,146,74,0.45)]'
                      }`}
                    >
                      {/* Checkbox row */}
                      <label className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-[rgba(184,146,74,0.06)] rounded-lg transition-colors`}>
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              field.onChange([...field.value, ev.id]);
                              const defaultStatus = tashkentEvent && ev.id === tashkentEvent.id ? 'attending' : 'pending';
                              setValue('eventStatuses', { ...eventStatuses, [String(ev.id)]: defaultStatus });
                            } else {
                              field.onChange(field.value.filter((id) => id !== ev.id));
                              const next = { ...eventStatuses };
                              delete next[String(ev.id)];
                              setValue('eventStatuses', next);
                            }
                          }}
                        />
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                            checked ? 'bg-[#B8924A] border-[#B8924A]' : 'border-[rgba(184,146,74,0.6)] bg-[#FDFAF5]'
                          }`}
                          aria-hidden="true"
                        >
                          {checked && (
                            <svg className="w-2.5 h-2.5 text-[#2A1F1A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-sans font-medium text-sm text-[#2A1F1A]">{ev.name}</p>
                          <p className="text-xs text-[rgba(42,31,26,0.7)]">{ev.date} · {ev.venueName}</p>
                        </div>
                      </label>

                      {/* Per-event status picker — shown only when event is selected */}
                      {checked && (
                        <div className="px-3 pb-3">
                          <p className="text-[10px] font-sans font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'rgba(42,31,26,0.45)' }}>
                            {at.statusLabel}
                          </p>
                          <StatusPicker
                            value={eventStatuses[String(ev.id)] ?? 'pending'}
                            onChange={(val) =>
                              setValue('eventStatuses', { ...eventStatuses, [String(ev.id)]: val as 'attending' | 'declined' | 'maybe' | 'pending' })
                            }
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          />
          {errors.eventIds && (
            <p className="mt-1.5 text-xs text-red-600 font-sans" role="alert">
              {errors.eventIds.message}
            </p>
          )}
        </fieldset>

        {/* Invitation Language */}
        <div>
          <label htmlFor="add-language" className={ADMIN_LABEL_CLASS}>{at.languageLabel}</label>
          <select
            id="add-language"
            {...register('language')}
            className={ADMIN_SELECT_CLASS}
          >
            <option value="en">EN — English</option>
            <option value="tr">TR — Türkçe</option>
            <option value="uz">UZ — O'zbek</option>
          </select>
        </div>

        {/* Guest Count */}
        <div>
          <label htmlFor="add-guest-count" className={ADMIN_LABEL_CLASS}>{at.guestCountLabel}</label>
          <select
            id="add-guest-count"
            {...register('guestCount', { valueAsNumber: true })}
            className={ADMIN_SELECT_CLASS}
          >
            {GUEST_COUNT_OPTIONS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        {/* Table Number — Tashkent only */}
        {showTableNumber && (
          <div>
            <label htmlFor="add-table-number" className={ADMIN_LABEL_CLASS}>
              {at.tableNumberLabel}{' '}
              <span className="normal-case tracking-normal font-normal text-[rgba(42,31,26,0.5)]">(Tashkent)</span>
            </label>
            <input
              id="add-table-number"
              type="number"
              min={1}
              max={500}
              {...register('tableNumber', {
                setValueAs: (v) => (v === '' || v == null || isNaN(Number(v)) ? null : Number(v)),
              })}
              className={ADMIN_INPUT_CLASS}
              placeholder="e.g. 12 (optional)"
            />
            {errors.tableNumber && (
              <p className="mt-1 text-xs text-red-600 font-sans" role="alert">
                {errors.tableNumber.message}
              </p>
            )}
          </div>
        )}

        {/* Dietary */}
        <div>
          <label htmlFor="add-dietary" className={ADMIN_LABEL_CLASS}>{at.dietaryLabel}</label>
          <input
            id="add-dietary"
            type="text"
            {...register('dietary')}
            className={ADMIN_INPUT_CLASS}
            placeholder="Optional"
          />
        </div>

        {/* Note */}
        <div>
          <label htmlFor="add-message" className={ADMIN_LABEL_CLASS}>{at.noteLabel}</label>
          <textarea
            id="add-message"
            rows={2}
            {...register('message')}
            className={`${ADMIN_INPUT_CLASS} resize-none`}
            placeholder="Optional"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2" style={{ borderTop: '1px solid rgba(184,146,74,0.3)' }}>
          <button type="button" onClick={onClose} className={ADMIN_SECONDARY_BTN_CLASS}>
            {at.cancel}
          </button>
          <button type="submit" disabled={isPending} className={ADMIN_PRIMARY_BTN_CLASS}>
            {isPending ? at.adding : at.addGuest}
          </button>
        </div>
      </form>
    </AdminModal>
  );
}
