import { cn } from '@/lib/utils';

export default function InitialAvatar({ name = '', className, toneClass }) {
  const initials =
    String(name)
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase() || '?';

  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br font-heading text-[13px] font-bold text-white',
        toneClass || 'from-slate-500 to-slate-700',
        className,
      )}
    >
      {initials}
    </span>
  );
}