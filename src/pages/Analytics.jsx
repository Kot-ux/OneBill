const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Download, Loader2, Signal, Wifi } from 'lucide-react';

import ScreenHeader from '@/components/ScreenHeader';
import SpendChart from '@/components/SpendChart';
import CategoryGrid from '@/components/CategoryGrid';
import UsageMeter from '@/components/UsageMeter';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  categoryLabel,
  currency,
  formatShortDate,
  isoDate,
  planFit,
} from '@/lib/phoneBills';
import { cn } from '@/lib/utils';

const RANGES = [
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
];

function buildRange(range) {
  const today = new Date(`${isoDate()}T00:00:00`);
  if (range === 'year') {
    const months = [];
    for (let index = 11; index >= 0; index -= 1) {
      const date = new Date(today.getFullYear(), today.getMonth() - index, 1);
      months.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
    }
    return {
      start: `${months[0]}-01`,
      end: isoDate(),
      unit: 'month',
      keys: months,
      labelFor: (key) =>
        new Date(`${key}-01T00:00:00`).toLocaleDateString('en-CA', { month: 'short' }),
      days: 365,
    };
  }

  const span = range === 'week' ? 6 : 29;
  const startDate = new Date(today.getTime() - span * 86400000);
  const keys = [];
  const cursor = new Date(startDate.getTime());
  while (cursor <= today) {
    keys.push(isoDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return {
    start: keys[0],
    end: isoDate(),
    unit: 'day',
    keys,
    labelFor: (key) => formatShortDate(key),
    days: keys.length,
  };
}

export default function Analytics() {
  const [tab, setTab] = useState('spend');
  const [range, setRange] = useState('month');
  const [lines, setLines] = useState([]);
  const [chartRows, setChartRows] = useState([]);
  const [categoryRows, setCategoryRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const linePage = await db.entities.PhoneLine.filter({}, { sort: 'owner_name', limit: 50 });
      if (alive) setLines(linePage.items || []);
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (tab !== 'spend') return undefined;
    let alive = true;
    setLoading(true);
    (async () => {
      const config = buildRange(range);
      const query = { due_date: { $gte: config.start, $lte: config.end } };
      const [chartAgg, categoryAgg] = await Promise.all([
        db.entities.Bill.aggregate({
          query,
          dateBucket: { field: 'due_date', unit: config.unit },
          sum: ['amount'],
        }),
        db.entities.Bill.aggregate({
          query,
          groupBy: 'category',
          sum: ['amount'],
          sort: '-sum_amount',
        }),
      ]);
      if (!alive) return;
      const buckets = {};
      (chartAgg.rows || []).forEach((row) => {
        buckets[row.due_date] = Number(row.sum_amount) || 0;
      });
      setChartRows(
        config.keys.map((key) => ({ key, label: config.labelFor(key), amount: buckets[key] || 0 })),
      );
      setCategoryRows(categoryAgg.rows || []);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [range, tab]);

  const periodTotal = categoryRows.reduce(
    (total, row) => total + (Number(row.sum_amount) || 0),
    0,
  );
  const billsCount = categoryRows.reduce((total, row) => total + (row.count || 0), 0);
  const largest = categoryRows[0];
  const days = buildRange(range).days;

  const usageTotals = useMemo(() => {
    const used = lines.reduce((total, line) => total + (Number(line.data_used_gb) || 0), 0);
    const allowance = lines.reduce(
      (total, line) => total + (Number(line.data_allowance_gb) || 0),
      0,
    );
    return { used, allowance };
  }, [lines]);

  return (
    <div className="space-y-5">
      <ScreenHeader
        title="Analytics"
        subtitle="Where your telecom money goes"
        right={
          <span className="mt-1 flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.07] bg-white/[0.04] text-white/45">
            <Download className="h-4 w-4" />
          </span>
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-2 rounded-full border border-white/[0.06] bg-white/[0.04] p-1">
          <TabsTrigger
            value="spend"
            className="rounded-full py-2 text-[13px] font-medium text-white/55 data-[state=active]:bg-white data-[state=active]:text-[#111]"
          >
            Spend
          </TabsTrigger>
          <TabsTrigger
            value="usage"
            className="rounded-full py-2 text-[13px] font-medium text-white/55 data-[state=active]:bg-white data-[state=active]:text-[#111]"
          >
            Usage
          </TabsTrigger>
        </TabsList>

        <TabsContent value="spend" className="mt-5 space-y-5">
          <section className="rounded-[1.5rem] border border-white/[0.06] bg-white/[0.03] p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-white/40">
                  Total spend
                </p>
                <p className="mt-2 font-heading text-[30px] font-extrabold leading-none tracking-tight text-white">
                  {loading ? '—' : currency(periodTotal)}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex h-9 items-center gap-2 rounded-full border border-white/12 bg-black/25 px-3.5 text-[12.5px] font-medium text-white/85"
                  >
                    {RANGES.find((item) => item.key === range)?.label}
                    <ChevronDown className="h-3.5 w-3.5 text-white/50" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-36 border-white/10 bg-[#1d1d21] text-white"
                >
                  {RANGES.map((item) => (
                    <DropdownMenuItem
                      key={item.key}
                      onClick={() => setRange(item.key)}
                      className="text-[13px] focus:bg-white/10 focus:text-white"
                    >
                      {item.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="mt-4">
              {loading ? (
                <div className="flex h-[180px] items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-white/30" />
                </div>
              ) : (
                <SpendChart
                  data={chartRows}
                  tickInterval={range === 'month' ? 5 : range === 'year' ? 0 : 0}
                />
              )}
            </div>
          </section>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-3xl border border-white/[0.06] bg-white/[0.03] p-4">
              <p className="text-[11px] text-white/45">Bills</p>
              <p className="mt-1.5 font-heading text-[17px] font-bold text-white">{billsCount}</p>
            </div>
            <div className="rounded-3xl border border-white/[0.06] bg-white/[0.03] p-4">
              <p className="text-[11px] text-white/45">Per day</p>
              <p className="mt-1.5 font-heading text-[17px] font-bold text-white">
                {currency(periodTotal / days)}
              </p>
            </div>
            <div className="min-w-0 rounded-3xl border border-white/[0.06] bg-white/[0.03] p-4">
              <p className="text-[11px] text-white/45">Biggest</p>
              <p className="mt-1.5 truncate font-heading text-[13px] font-bold text-white">
                {largest ? categoryLabel(largest.category) : '—'}
              </p>
            </div>
          </div>

          <section className="space-y-3">
            <h2 className="px-1 font-heading text-[15px] font-bold text-white">
              Category breakdown
            </h2>
            {categoryRows.length ? (
              <CategoryGrid rows={categoryRows} total={periodTotal} />
            ) : (
              <p className="px-1 text-[12.5px] text-white/40">
                Nothing spent in this period yet.
              </p>
            )}
          </section>
        </TabsContent>

        <TabsContent value="usage" className="mt-5 space-y-4">
          <section className="rounded-[1.5rem] border border-white/[0.06] bg-white/[0.03] p-5">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-white/40">
              Data across all lines
            </p>
            <p className="mt-2 font-heading text-[30px] font-extrabold leading-none tracking-tight text-white">
              {usageTotals.used.toFixed(1)} GB
            </p>
            <p className="mt-2 text-[12.5px] text-white/50">
              of {usageTotals.allowance} GB included each month
            </p>
            <div className="mt-4">
              <UsageMeter
                label="All lines combined"
                used={Number(usageTotals.used.toFixed(1))}
                total={usageTotals.allowance}
                unit="GB"
              />
            </div>
          </section>

          {lines.map((line) => {
            const fit = planFit(line);
            return (
              <section
                key={line.id}
                className="rounded-[1.5rem] border border-white/[0.06] bg-white/[0.03] p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold text-white">{line.label}</p>
                    <p className="mt-0.5 text-[12px] text-white/45">
                      {line.plan_name || line.carrier} · {currency(line.monthly_cost)}/mo
                    </p>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 rounded-full border px-2.5 py-1 text-[10.5px] font-semibold',
                      fit.score >= 85
                        ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
                        : fit.score >= 60
                          ? 'border-amber-400/20 bg-amber-400/10 text-amber-300'
                          : 'border-rose-500/25 bg-rose-500/10 text-rose-300',
                    )}
                  >
                    {fit.score}% fit
                  </span>
                </div>

                <div className="mt-4 space-y-3.5">
                  <UsageMeter
                    label="Data"
                    used={Number(line.data_used_gb) || 0}
                    total={Number(line.data_allowance_gb) || 0}
                    unit="GB"
                    Icon={Wifi}
                  />
                  <UsageMeter
                    label="Minutes"
                    used={Number(line.minutes_used) || 0}
                    total={0}
                    unit="min"
                    tone="teal"
                    Icon={Signal}
                  />
                  <UsageMeter
                    label="Texts"
                    used={Number(line.sms_used) || 0}
                    total={0}
                    unit="msgs"
                    tone="sky"
                  />
                </div>

                <p className="mt-4 text-[12px] leading-relaxed text-white/45">{fit.note}</p>
              </section>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}