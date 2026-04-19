import { useState, useRef, useContext, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import type { AdminEvent } from '../../lib/api';
import { adminApi } from '../../lib/api';
import type { BulkAddGuestsResult } from '@invitation/shared';
import AdminModal from './AdminModal';
import {
  ADMIN_LABEL_CLASS,
  ADMIN_SELECT_CLASS,
  ADMIN_PRIMARY_BTN_CLASS,
  ADMIN_SECONDARY_BTN_CLASS,
  ADMIN_INPUT_CLASS,
} from './adminTokens';
import { LanguageContext } from '../../context/LanguageContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  events: AdminEvent[];
  defaultEventId?: number;
}

type Step = 'input' | 'preview' | 'result';

const GUEST_COUNT_OPTIONS = Array.from({ length: 10 }, (_, i) => i + 1);

function parseLinesFromText(raw: string): string[] {
  return raw
    .split('\n')
    .map((l) => l.trim().replace(/\s+/g, ' '))
    .filter((l) => l.length >= 2);
}

function escapeCsvCell(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function buildInvitationsCsv(rows: BulkAddGuestsResult['createdInvitations']): string {
  const header = ['Guest Name', 'Event Name', 'Invitation Link'];
  const body = rows.map((row) =>
    [row.guestName, row.eventName, row.invitationUrl].map(escapeCsvCell).join(',')
  );
  return [header.join(','), ...body].join('\n');
}

export default function BulkAddGuestsModal({ isOpen, onClose, events, defaultEventId }: Props) {
  const { language: currentLanguage } = useContext(LanguageContext);
  const qc = useQueryClient();

  const [step, setStep] = useState<Step>('input');
  const [rawText, setRawText] = useState('');
  const [selectedEventIds, setSelectedEventIds] = useState<number[]>(
    defaultEventId ? [defaultEventId] : [],
  );
  const [language, setLanguage] = useState<'en' | 'tr' | 'uz'>(
    (currentLanguage as 'en' | 'tr' | 'uz') ?? 'en',
  );
  const [guestCount, setGuestCount] = useState(1);
  const [tableNumber, setTableNumber] = useState<number | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);
  const [previewResult, setPreviewResult] = useState<BulkAddGuestsResult | null>(null);
  const [finalResult, setFinalResult] = useState<BulkAddGuestsResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setStep('input');
      setRawText('');
      setSelectedEventIds(defaultEventId ? [defaultEventId] : []);
      setLanguage((currentLanguage as 'en' | 'tr' | 'uz') ?? 'en');
      setGuestCount(1);
      setTableNumber(null);
      setInputError(null);
      setPreviewResult(null);
      setFinalResult(null);
    }
  }, [isOpen, defaultEventId, currentLanguage]);

  const previewMutation = useMutation({
    mutationFn: (names: string[]) =>
      adminApi.bulkAddGuests({
        names,
        eventIds: selectedEventIds,
        language,
        guestCount,
        tableNumber,
        dryRun: true,
      }),
    onSuccess: (result) => {
      setPreviewResult(result);
      setStep('preview');
    },
    onError: () => toast.error('Failed to check for duplicates. Please try again.'),
  });

  const importMutation = useMutation({
    mutationFn: (names: string[]) =>
      adminApi.bulkAddGuests({
        names,
        eventIds: selectedEventIds,
        language,
        guestCount,
        tableNumber,
        dryRun: false,
      }),
    onSuccess: (result) => {
      setFinalResult(result);
      setStep('result');
      qc.invalidateQueries({ queryKey: ['admin'] });
    },
    onError: () => toast.error('Import failed. Please try again.'),
  });

  const parsedNames = parseLinesFromText(rawText);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text === 'string') setRawText(text);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handlePreview = () => {
    if (parsedNames.length === 0) {
      setInputError('Enter at least one name (minimum 2 characters per line).');
      return;
    }
    if (selectedEventIds.length === 0) {
      setInputError('Select at least one event.');
      return;
    }
    setInputError(null);
    previewMutation.mutate(parsedNames);
  };

  const handleImport = () => {
    if (!previewResult || previewResult.newNames.length === 0) return;
    importMutation.mutate(previewResult.newNames);
  };

  const handleDownloadCsv = () => {
    const rows = finalResult?.createdInvitations ?? [];
    if (rows.length === 0) {
      toast.error('No invitation links available to download.');
      return;
    }

    const csv = buildInvitationsCsv(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    anchor.href = url;
    anchor.download = `bulk-invitations-${date}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const toggleEvent = (id: number) => {
    setSelectedEventIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="Bulk Import Guests"
      subtitle={
        step === 'input'
          ? 'Paste names or upload a .txt file — one guest per line'
          : step === 'preview'
            ? 'Review before importing'
            : undefined
      }
      size="md"
      titleId="bulk-import-title"
    >
      {/* ── Step 1: Input ─────────────────────────────────────────────────── */}
      {step === 'input' && (
        <div className="p-6 space-y-5">
          {/* Names textarea + file upload */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="bulk-names" className={ADMIN_LABEL_CLASS} style={{ marginBottom: 0 }}>
                Guest Names{' '}
                <span className="text-red-500 normal-case tracking-normal font-normal" aria-hidden="true">*</span>
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1 text-xs font-sans font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)] rounded transition-colors"
                style={{ color: 'rgba(184,146,74,0.9)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#B8924A'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(184,146,74,0.9)'; }}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Upload .txt
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,text/plain"
                onChange={handleFileUpload}
                className="sr-only"
                aria-hidden="true"
                tabIndex={-1}
              />
            </div>
            <textarea
              id="bulk-names"
              rows={8}
              value={rawText}
              onChange={(e) => { setRawText(e.target.value); setInputError(null); }}
              placeholder={'John Smith\nJane Doe\nAli Yılmaz'}
              className={`${ADMIN_INPUT_CLASS} resize-none font-mono text-sm`}
              aria-describedby={inputError ? 'bulk-input-error' : 'bulk-names-hint'}
            />
            <p id="bulk-names-hint" className="mt-1 text-xs font-sans" style={{ color: 'rgba(42,31,26,0.5)' }}>
              One name per line · Minimum 2 characters each
            </p>
            {parsedNames.length > 0 && (
              <p className="mt-1 text-xs font-sans font-medium" style={{ color: 'rgba(184,146,74,0.85)' }}>
                {parsedNames.length} {parsedNames.length === 1 ? 'name' : 'names'} detected
              </p>
            )}
            {inputError && (
              <p id="bulk-input-error" className="mt-1 text-xs text-red-600 font-sans" role="alert">
                {inputError}
              </p>
            )}
          </div>

          {/* Event selection */}
          <fieldset>
            <legend className={`${ADMIN_LABEL_CLASS} font-semibold`}>
              Invite To{' '}
              <span className="text-red-500 normal-case tracking-normal font-normal" aria-hidden="true">*</span>
            </legend>
            <div className="space-y-2 mt-1.5">
              {events.map((ev) => {
                const checked = selectedEventIds.includes(ev.id);
                return (
                  <label
                    key={ev.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      checked
                        ? 'bg-[rgba(184,146,74,0.10)] border-[rgba(184,146,74,0.65)]'
                        : 'bg-[#FDFAF5] border-[rgba(184,146,74,0.45)] hover:bg-[#F5EFE4] hover:border-[rgba(184,146,74,0.65)]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      onChange={() => { toggleEvent(ev.id); setInputError(null); }}
                    />
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                        checked
                          ? 'bg-[#B8924A] border-[#B8924A]'
                          : 'border-[rgba(184,146,74,0.6)] bg-[#FDFAF5]'
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
                );
              })}
            </div>
          </fieldset>

          {/* Language */}
          <div>
            <label htmlFor="bulk-language" className={ADMIN_LABEL_CLASS}>Invitation Language</label>
            <select
              id="bulk-language"
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'en' | 'tr' | 'uz')}
              className={ADMIN_SELECT_CLASS}
            >
              <option value="en">EN — English</option>
              <option value="tr">TR — Türkçe</option>
              <option value="uz">UZ — O&apos;zbek</option>
            </select>
          </div>

          {/* Guest count */}
          <div>
            <label htmlFor="bulk-guest-count" className={ADMIN_LABEL_CLASS}>Default Guest Count</label>
            <select
              id="bulk-guest-count"
              value={guestCount}
              onChange={(e) => setGuestCount(Number(e.target.value))}
              className={ADMIN_SELECT_CLASS}
            >
              {GUEST_COUNT_OPTIONS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          {/* Table number */}
          <div>
            <label htmlFor="bulk-table-number" className={ADMIN_LABEL_CLASS}>Table Number</label>
            <input
              id="bulk-table-number"
              type="number"
              min={1}
              max={500}
              value={tableNumber ?? ''}
              onChange={(e) => {
                const next = e.target.value.trim();
                if (next === '') {
                  setTableNumber(null);
                  return;
                }
                const parsed = Number.parseInt(next, 10);
                setTableNumber(Number.isNaN(parsed) ? null : parsed);
              }}
              className={ADMIN_INPUT_CLASS}
              placeholder="Optional"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2" style={{ borderTop: '1px solid rgba(184,146,74,0.3)' }}>
            <button type="button" onClick={onClose} className={ADMIN_SECONDARY_BTN_CLASS}>
              Cancel
            </button>
            <button
              type="button"
              onClick={handlePreview}
              disabled={previewMutation.isPending}
              className={ADMIN_PRIMARY_BTN_CLASS}
            >
              {previewMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <span
                    className="inline-block w-3.5 h-3.5 rounded-full border-2 border-t-transparent animate-spin"
                    style={{ borderColor: '#2A1F1A transparent transparent transparent' }}
                    aria-hidden="true"
                  />
                  Checking…
                </span>
              ) : (
                `Preview ${parsedNames.length > 0 ? `(${parsedNames.length})` : ''}`
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Preview ───────────────────────────────────────────────── */}
      {step === 'preview' && previewResult && (
        <div className="p-6 space-y-5">
          {/* Summary banner */}
          <div
            className="rounded-lg px-4 py-3 text-sm font-sans"
            style={{
              background: previewResult.newNames.length > 0
                ? 'rgba(184,146,74,0.08)'
                : 'rgba(220,38,38,0.05)',
              border: `1px solid ${previewResult.newNames.length > 0 ? 'rgba(184,146,74,0.35)' : 'rgba(220,38,38,0.25)'}`,
            }}
          >
            <p className="font-semibold" style={{ color: '#2A1F1A' }}>
              {previewResult.newNames.length > 0
                ? `${previewResult.newNames.length} guest${previewResult.newNames.length === 1 ? '' : 's'} will be created`
                : 'No new guests to import'}
            </p>
            {previewResult.duplicateNames.length > 0 && (
              <p className="mt-0.5 text-xs" style={{ color: 'rgba(42,31,26,0.65)' }}>
                {previewResult.duplicateNames.length} duplicate{previewResult.duplicateNames.length === 1 ? '' : 's'} will be skipped
              </p>
            )}
          </div>

          {/* New names list */}
          {previewResult.newNames.length > 0 && (
            <div>
              <p className={ADMIN_LABEL_CLASS}>New Guests</p>
              <ul className="space-y-1 max-h-48 overflow-y-auto rounded-lg border p-2" style={{ borderColor: 'rgba(184,146,74,0.3)' }}>
                {previewResult.newNames.map((name) => (
                  <li
                    key={name}
                    className="flex items-center gap-2 px-2 py-1.5 rounded text-sm font-sans"
                    style={{ color: '#2A1F1A' }}
                  >
                    <span
                      className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(34,197,94,0.15)', color: '#16a34a' }}
                      aria-hidden="true"
                    >
                      <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    {name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Duplicate names list */}
          {previewResult.duplicateNames.length > 0 && (
            <div>
              <p className={ADMIN_LABEL_CLASS}>Skipped — Already Exist</p>
              <ul className="space-y-1 max-h-36 overflow-y-auto rounded-lg border p-2" style={{ borderColor: 'rgba(184,146,74,0.3)' }}>
                {previewResult.duplicateNames.map((name) => (
                  <li
                    key={name}
                    className="flex items-center gap-2 px-2 py-1.5 rounded text-sm font-sans"
                    style={{ color: 'rgba(42,31,26,0.6)' }}
                  >
                    <span
                      className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
                      style={{ background: 'rgba(234,179,8,0.15)', color: '#b45309' }}
                      aria-hidden="true"
                    >
                      !
                    </span>
                    {name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2" style={{ borderTop: '1px solid rgba(184,146,74,0.3)' }}>
            <button
              type="button"
              onClick={() => setStep('input')}
              className={ADMIN_SECONDARY_BTN_CLASS}
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={importMutation.isPending || previewResult.newNames.length === 0}
              className={ADMIN_PRIMARY_BTN_CLASS}
            >
              {importMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <span
                    className="inline-block w-3.5 h-3.5 rounded-full border-2 border-t-transparent animate-spin"
                    style={{ borderColor: '#2A1F1A transparent transparent transparent' }}
                    aria-hidden="true"
                  />
                  Importing…
                </span>
              ) : (
                previewResult.newNames.length > 0
                  ? `Import ${previewResult.newNames.length} Guest${previewResult.newNames.length === 1 ? '' : 's'}`
                  : 'Nothing to Import'
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Result ────────────────────────────────────────────────── */}
      {step === 'result' && finalResult && (
        <div className="p-6 space-y-5">
          {/* Success banner */}
          <div
            className="rounded-lg px-4 py-4 flex items-start gap-3"
            style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.3)' }}
          >
            <div
              className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(34,197,94,0.15)' }}
              aria-hidden="true"
            >
              <svg className="w-4 h-4" style={{ color: '#16a34a' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="font-sans font-semibold text-sm" style={{ color: '#2A1F1A' }}>
                {finalResult.created} guest{finalResult.created === 1 ? '' : 's'} added successfully
              </p>
              {finalResult.duplicateNames.length > 0 && (
                <p className="text-xs font-sans mt-0.5" style={{ color: 'rgba(42,31,26,0.65)' }}>
                  {finalResult.duplicateNames.length} duplicate{finalResult.duplicateNames.length === 1 ? '' : 's'} skipped
                </p>
              )}
            </div>
          </div>

          {/* Skipped names */}
          {finalResult.duplicateNames.length > 0 && (
            <div>
              <p className={ADMIN_LABEL_CLASS}>Skipped — Already Existed</p>
              <ul className="space-y-1 max-h-36 overflow-y-auto rounded-lg border p-2" style={{ borderColor: 'rgba(184,146,74,0.3)' }}>
                {finalResult.duplicateNames.map((name) => (
                  <li
                    key={name}
                    className="px-2 py-1.5 text-sm font-sans"
                    style={{ color: 'rgba(42,31,26,0.6)' }}
                  >
                    {name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2" style={{ borderTop: '1px solid rgba(184,146,74,0.3)' }}>
            <button type="button" onClick={onClose} className={ADMIN_SECONDARY_BTN_CLASS}>
              Done
            </button>
            <button
              type="button"
              onClick={handleDownloadCsv}
              className={ADMIN_SECONDARY_BTN_CLASS}
              disabled={(finalResult.createdInvitations?.length ?? 0) === 0}
            >
              Download CSV
            </button>
            <button
              type="button"
              onClick={() => {
                setStep('input');
                setRawText('');
                setTableNumber(null);
                setPreviewResult(null);
                setFinalResult(null);
              }}
              className={ADMIN_PRIMARY_BTN_CLASS}
            >
              Import More
            </button>
          </div>
        </div>
      )}
    </AdminModal>
  );
}
