import { useAdminTranslation } from '../../lib/i18n/admin';

interface StatusPickerProps {
  value: string;
  onChange: (value: string) => void;
}

const STATUS_META = [
  {
    value: 'attending',
    dotColor:    '#4A9E78',
    textColor:   '#2D6B50',
    activeBg:    'rgba(74,158,120,0.10)',
    activeBorder:'#4A9E78',
  },
  {
    value: 'declined',
    dotColor:    '#C0615A',
    textColor:   '#8B3A36',
    activeBg:    'rgba(192,97,90,0.10)',
    activeBorder:'#C0615A',
  },
  {
    value: 'maybe',
    dotColor:    '#C4924A',
    textColor:   '#7A5520',
    activeBg:    'rgba(196,146,74,0.10)',
    activeBorder:'#C4924A',
  },
  {
    value: 'pending',
    dotColor:    '#B0A9A4',
    textColor:   'rgba(42,31,26,0.55)',
    activeBg:    'rgba(176,169,164,0.12)',
    activeBorder:'#B0A9A4',
  },
] as const;

export default function StatusPicker({ value, onChange }: StatusPickerProps) {
  const at = useAdminTranslation();

  const labels: Record<string, string> = {
    attending: at.statusAttending,
    declined:  at.statusDeclined,
    maybe:     at.statusMaybe,
    pending:   at.statusPending,
  };

  return (
    <div className="grid grid-cols-4 gap-1.5" role="radiogroup" aria-label={at.statusLabel}>
      {STATUS_META.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(opt.value)}
            className="flex flex-col items-center gap-1.5 px-1.5 py-2.5 rounded-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)]"
            style={
              isSelected
                ? {
                    background:   opt.activeBg,
                    border:       `1.5px solid ${opt.activeBorder}`,
                  }
                : {
                    background:   '#FDFAF5',
                    border:       '1px solid rgba(184,146,74,0.45)',
                  }
            }
          >
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: isSelected ? opt.dotColor : 'rgba(42,31,26,0.25)' }}
            />
            <span
              className="text-[10px] font-sans font-semibold leading-tight text-center"
              style={{ color: isSelected ? opt.textColor : 'rgba(42,31,26,0.50)' }}
            >
              {labels[opt.value]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
