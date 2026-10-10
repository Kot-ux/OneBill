import { cn } from '@/lib/utils';

const STYLES = {
  paid: {
    label: 'Paid',
    className: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
  },
  unpaid: {
    label: 'Unpaid',
    className: 'border-white/10 bg-white/[0.06] text-white/60',
  },
  due_soon: {
    label: 'Due soon',
    className: 'border-amber-400/20 bg-amber-400/10 text-amber-300',
  },
  overdue: {
    label: 'Overdue',
    className: 'border-rose-500/25 bg-rose-500/10 text-rose-300',
  },
};

export default function StatusChip({ state, label, className }) {
  const style = STYLES[state] || STYLES.unpaid;
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]',
        style.className,
        className,
      )}
    >
      {label || style.label}
    </span>
  );
}