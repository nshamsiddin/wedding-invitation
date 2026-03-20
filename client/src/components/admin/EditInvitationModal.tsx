import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateInvitationSchema, type UpdateInvitationValues } from '@invitation/shared';
import type { AdminInvitation, AdminGuest } from '../../lib/api';
import { useAdminTranslation } from '../../lib/i18n/admin';
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
  invitation: AdminInvitation | null;
  guest: AdminGuest | null;
  onClose: () => void;
  onSubmit: (invitationId: number, values: UpdateInvitationValues) => void;
  isPending: boolean;
}

const GUEST_COUNT_OPTIONS = Array.from({ length: 10 }, (_, i) => i + 1);

export default function EditInvitationModal({
  invitation,
  guest,
  onClose,
  onSubmit,
  isPending,
}: Props) {
  const at = useAdminTranslation();
  const isOpen = invitation !== null;

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
  const isTashkent = invitation?.eventSlug === 'tashkent';

  useEffect(() => {
    if (invitation) {
      reset({
        status:      invitation.status,
        guestCount:  invitation.guestCount,
        dietary:     invitation.dietary ?? '',
        message:     invitation.message ?? '',
        tableNumber: invitation.tableNumber ?? undefined,
        language:    (invitation.language as 'en' | 'tr' | 'uz') ?? 'en',
      });
    }
  }, [invitation, reset]);

  const subtitle = guest
    ? `${guest.name} · ${invitation?.eventName ?? invitation?.eventSlug ?? ''}`
    : undefined;

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={at.editRsvpTitle}
      subtitle={subtitle}
      titleId="edit-inv-title"
    >
      <form
        onSubmit={handleSubmit((values) => invitation && onSubmit(invitation.id, values))}
        noValidate
        className="p-6 space-y-4"
      >
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
          <label htmlFor="inv-guest-count" className={ADMIN_LABEL_CLASS}>{at.guestCountLabel}</label>
          <select
            id="inv-guest-count"
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
            <label htmlFor="inv-table" className={ADMIN_LABEL_CLASS}>
              {at.tableNumberLabel}{' '}
              <span className="normal-case tracking-normal font-normal text-[rgba(42,31,26,0.5)]">(Tashkent)</span>
            </label>
            <input
              id="inv-table"
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

        <div>
          <label htmlFor="inv-language" className={ADMIN_LABEL_CLASS}>{at.languageLabel}</label>
          <select
            id="inv-language"
            {...register('language')}
            className={ADMIN_SELECT_CLASS}
          >
            <option value="en">EN — English</option>
            <option value="tr">TR — Türkçe</option>
            <option value="uz">UZ — O'zbekcha</option>
          </select>
        </div>

        <div>
          <label htmlFor="inv-dietary" className={ADMIN_LABEL_CLASS}>{at.dietaryLabel}</label>
          <input
            id="inv-dietary"
            type="text"
            {...register('dietary')}
            className={ADMIN_INPUT_CLASS}
            placeholder="None"
          />
        </div>

        <div>
          <label htmlFor="inv-message" className={ADMIN_LABEL_CLASS}>{at.messageLabel}</label>
          <textarea
            id="inv-message"
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

        <div className="flex gap-3 pt-2" style={{ borderTop: '1px solid rgba(184,146,74,0.3)' }}>
          <button type="button" onClick={onClose} className={ADMIN_SECONDARY_BTN_CLASS}>
            {at.cancel}
          </button>
          <button type="submit" disabled={isPending} className={ADMIN_PRIMARY_BTN_CLASS}>
            {isPending ? at.saving : at.saveChanges}
          </button>
        </div>
      </form>
    </AdminModal>
  );
}
