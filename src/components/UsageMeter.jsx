import { cn } from '@/lib/utils';

const FILLS = {
  violet: 'from-violet-500 to-fuchsia-500',
  teal: 'from-teal-400 to-emerald-500',
  sky: 'from-sky-400 to-indigo-500',
  danger: 'from-rose-500 to-orange-500',
};

export default function UsageMeter({ label, used, total, unit = '', tone = 'violet', Icon }) {
  const usedValue = Number(used) || 0;
  const totalValue = Number(total) || 0;
  const percent = totalValue > 0 ? Math.min(100, (usedValue / totalValue) * 100) : 0;
  const over = totalValue > 0 && usedValue > totalValue;

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-[12px] font-medium text-white/60">
          {Icon && <Icon className="h-3.5 w-3.5 text-white/40" />}
          {label}
        </span>
        <span className={cn('text-[12px] font-semibold', over ? 'text-rose-300' : 'text-white/70')}>
          {usedValue}
          {totalValue > 0 ? ` / ${totalValue}` : ''} {unit}
        </span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
        <div
          className={cn(
            'h-full rounded-full bg-gradient-to-r transition-all duration-700',
            over ? FILLS.danger : FILLS[tone],
          )}
          style={{ width: `${totalValue > 0 ? percent : 0}%` }}
        />
      </div>
    </div>
  );
}