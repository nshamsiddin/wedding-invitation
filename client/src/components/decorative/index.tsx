import type { Language } from '../../lib/i18n';

export function TulipSVG({
  className,
  color = '#C9707A',
  size = 28,
}: {
  className?: string;
  color?: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 36"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M14 4 C11 0 6 0 6 6 C6 12 10 16 14 18 C18 16 22 12 22 6 C22 0 17 0 14 4 Z"
        fill={color}
        opacity="0.85"
      />
      <path
        d="M7 8 C3 6 0 10 1 14 C2 18 6 20 10 20 C11 17 11 13 7 8 Z"
        fill={color}
        opacity="0.6"
      />
      <path
        d="M21 8 C25 6 28 10 27 14 C26 18 22 20 18 20 C17 17 17 13 21 8 Z"
        fill={color}
        opacity="0.6"
      />
      <path
        d="M14 18 L14 34"
        stroke="#9BAF8E"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M14 26 Q8 22 7 18"
        stroke="#9BAF8E"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M14 28 Q20 24 21 20"
        stroke="#9BAF8E"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function TulipDivider({ light = false }: { light?: boolean }) {
  const lineColor = light
    ? 'rgba(255,255,255,0.5)'
    : 'rgba(196,154,108,0.35)';
  return (
    <div
      className="flex items-end justify-center gap-4 my-10"
      aria-hidden="true"
    >
      <div
        className="flex-1 h-px"
        style={{
          background: `linear-gradient(to right, transparent, ${lineColor})`,
        }}
      />
      <TulipSVG size={22} color={light ? '#F7E8E0' : '#C9707A'} />
      <TulipSVG size={28} color={light ? '#FEFCF7' : '#C49A6C'} />
      <TulipSVG size={22} color={light ? '#F7E8E0' : '#C9707A'} />
      <div
        className="flex-1 h-px"
        style={{
          background: `linear-gradient(to left, transparent, ${lineColor})`,
        }}
      />
    </div>
  );
}

export function Petal({
  color,
  size,
  style,
}: {
  color: string;
  size: number;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      style={style}
      aria-hidden="true"
    >
      <ellipse
        cx="20"
        cy="20"
        rx="10"
        ry="18"
        fill={color}
        opacity="0.55"
        transform="rotate(-20 20 20)"
      />
      <ellipse
        cx="20"
        cy="20"
        rx="8"
        ry="14"
        fill={color}
        opacity="0.3"
        transform="rotate(15 20 20)"
      />
    </svg>
  );
}

export function OttomanCorner({
  className,
  style,
}: {
  className: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      width="56"
      height="56"
      viewBox="0 0 56 56"
      fill="none"
      className={`absolute pointer-events-none ${className}`}
      style={style}
      aria-hidden="true"
    >
      <path
        d="M 2 2 L 2 18 M 2 2 L 18 2"
        stroke="#C49A6C"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d="M 2 2 Q 14 6 20 20"
        stroke="#C49A6C"
        strokeWidth="0.7"
        fill="none"
        opacity="0.4"
      />
      <circle cx="2" cy="2" r="2.5" fill="#C49A6C" opacity="0.5" />
      <circle cx="10" cy="10" r="1.5" fill="#C9707A" opacity="0.35" />
    </svg>
  );
}

export function formatEventDate(dateStr: string, lang: Language): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const opts: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  };
  if (lang === 'tr') return date.toLocaleDateString('tr-TR', opts);
  if (lang === 'uz') return date.toLocaleDateString('uz-UZ', opts);
  return date.toLocaleDateString('en-GB', opts);
}
