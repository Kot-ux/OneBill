import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { currency } from '@/lib/phoneBills';

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-[#1d1d20] px-3 py-2 shadow-2xl">
      <p className="text-[11px] text-white/45">{label}</p>
      <p className="font-heading text-[13px] font-bold text-white">
        {currency(payload[0].value)}
      </p>
    </div>
  );
}

export default function SpendChart({ data = [], tickInterval = 0 }) {
  return (
    <div className="h-[180px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 0, bottom: 0, left: 0 }} barCategoryGap="32%">
          <defs>
            <linearGradient id="spendBar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#6d4aff" />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            interval={tickInterval}
            tick={{ fill: 'rgba(255,255,255,0.38)', fontSize: 10 }}
          />
          <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} content={<ChartTooltip />} />
          <Bar dataKey="amount" fill="url(#spendBar)" radius={[9, 9, 9, 9]} maxBarSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}