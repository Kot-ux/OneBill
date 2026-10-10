import { Eye, EyeOff, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { currency, formatShortDate } from '@/lib/phoneBills';

export default function HeroCard({
  lines = [],
  selectedLine,
  onSelectLine,
  totalDue = 0,
  openCount = 0,
  nextDueDate,
  hidden,
  onToggleHidden,
  onToggleAutopay,
}) {
  return (
    <section className="rise relative overflow-hidden rounded-[1.75rem] border border-white/[0.07] bg-[#1b1b1f] p-5">
      <div className="aurora pointer-events-none absolute -inset-20 opacity-60 blur-2xl" />
      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex h-9 max-w-[190px] items-center gap-2 rounded-full border border-white/12 bg-black/35 px-3.5 text-[12.5px] font-medium text-white/90 backdrop-blur-sm transition-colors hover:border-white/25"
              >
                <span className="truncate">
                  {selectedLine
                    ? `${selectedLine.label}${selectedLine.phone_number ? ` ···· ${String(selectedLine.phone_number).slice(-4)}` : ''}`
                    : 'All lines'}
                </span>
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-white/50" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-64 border-white/10 bg-[#1d1d21] text-white"
            >
              <DropdownMenuLabel className="text-[11px] uppercase tracking-wide text-white/40">
                Phone lines
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => onSelectLine('all')}
                className="text-[13px] focus:bg-white/10 focus:text-white"
              >
                All lines
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              {lines.map((line) => (
                <DropdownMenuItem
                  key={line.id}
                  onClick={() => onSelectLine(line.id)}
                  className="text-[13px] focus:bg-white/10 focus:text-white"
                >
                  <span className="truncate">{line.label}</span>
                  <span className="ml-auto text-[11px] text-white/40">{line.carrier}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {selectedLine && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-white/60">Auto-pay</span>
              <Switch
                checked={Boolean(selectedLine.autopay)}
                onCheckedChange={onToggleAutopay}
                className="data-[state=checked]:bg-white/90 data-[state=unchecked]:bg-white/20"
              />
            </div>
          )}
        </div>

        <div className="mt-8">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-white/45">
            Total due
          </p>
          <div className="mt-2.5 flex items-end gap-3">
            <span className="font-heading text-[40px] font-extrabold leading-none tracking-tight text-white">
              {hidden ? '••••••' : currency(totalDue)}
            </span>
            <button
              type="button"
              aria-label={hidden ? 'Show amount' : 'Hide amount'}
              onClick={onToggleHidden}
              className="mb-1 text-white/45 transition-colors hover:text-white/85"
            >
              {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-3 text-[12.5px] text-white/55">
            {openCount === 0
              ? 'Everything is settled — nice work.'
              : `${openCount} open ${openCount === 1 ? 'bill' : 'bills'}${nextDueDate ? ` · next due ${formatShortDate(nextDueDate)}` : ''}`}
          </p>
        </div>
      </div>
    </section>
  );
}