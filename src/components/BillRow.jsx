import { CheckCircle2 } from 'lucide-react';
import InitialAvatar from '@/components/InitialAvatar';
import StatusChip from '@/components/StatusChip';
import {
  billState,
  carrierTone,
  categoryLabel,
  currency,
  daysUntil,
  formatShortDate,
} from '@/lib/phoneBills';

export default function BillRow({ bill, lineName, onOpen, onMarkPaid }) {
  const state = billState(bill);
  const days = daysUntil(bill.due_date);
  const dueText =
    state === 'paid'
      ? bill.paid_date
        ? `Paid ${formatShortDate(bill.paid_date)}`
        : 'Paid'
      : days === 0
        ? 'Due today'
        : days !== null && days < 0
          ? `${Math.abs(days)} ${Math.abs(days) === 1 ? 'day' : 'days'} overdue`
          : days !== null && days <= 7
            ? `Due in ${days} ${days === 1 ? 'day' : 'days'}`
            : `Due ${formatShortDate(bill.due_date)}`;

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => onOpen && onOpen(bill)}
        className="flex min-w-0 flex-1 items-center gap-3.5 rounded-2xl px-1 py-3 text-left transition-colors hover:bg-white/[0.03]"
      >
        <InitialAvatar
          name={bill.carrier}
          toneClass={carrierTone(bill.carrier)}
          className="h-11 w-11 rounded-[0.9rem]"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold text-white">
            {lineName || bill.carrier}
          </p>
          <p className="truncate text-[12px] text-white/45">
            {categoryLabel(bill.category)} · {dueText}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className="font-heading text-[15px] font-bold text-white">
            {currency(bill.amount)}
          </span>
          <StatusChip state={state} />
        </div>
      </button>
      {onMarkPaid && state !== 'paid' && (
        <button
          type="button"
          aria-label="Mark as paid"
          onClick={() => onMarkPaid(bill)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-white/40 transition-colors hover:border-emerald-400/40 hover:text-emerald-300"
        >
          <CheckCircle2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}