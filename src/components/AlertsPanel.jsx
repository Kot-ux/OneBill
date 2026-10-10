import { Clock, RefreshCw, TrendingUp, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';

const TONE_CARD = {
  danger: 'border-rose-500/25 bg-rose-500/[0.07]',
  warn: 'border-amber-400/25 bg-amber-400/[0.06]',
  info: 'border-white/10 bg-white/[0.04]',
};

const TONE_ICON = {
  danger: 'bg-rose-500/15 text-rose-300',
  warn: 'bg-amber-400/15 text-amber-300',
  info: 'bg-sky-400/15 text-sky-300',
};

const KIND_ICON = {
  due: Clock,
  hike: TrendingUp,
  overage: Wifi,
  contract: RefreshCw,
};

export default function AlertsPanel({ alerts = [], limit = 3 }) {
  if (!alerts.length) return null;
  const shown = alerts.slice(0, limit);

  return (
    <section className="space-y-2.5">
      <div className="flex items-baseline justify-between px-1">
        <h2 className="font-heading text-[15px] font-bold text-white">Smart alerts</h2>
        <span className="text-[11.5px] text-white/40">{alerts.length} active</span>
      </div>
      {shown.map((alert) => {
        const Icon = KIND_ICON[alert.kind] || Clock;
        return (
          <div
            key={alert.id}
            className={cn('flex gap-3 rounded-3xl border p-4', TONE_CARD[alert.tone])}
          >
            <span
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                TONE_ICON[alert.tone],
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={2.2} />
            </span>
            <div className="min-w-0">
              <p className="text-[13.5px] font-semibold text-white">{alert.title}</p>
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-white/55">
                {alert.detail}
              </p>
            </div>
          </div>
        );
      })}
    </section>
  );
}