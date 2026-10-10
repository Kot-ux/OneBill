import { categoryLabel, currency } from '@/lib/phoneBills';

const TONES = [
  'from-violet-500 to-fuchsia-500',
  'from-teal-400 to-emerald-500',
  'from-sky-400 to-indigo-500',
  'from-amber-400 to-orange-500',
  'from-rose-500 to-pink-500',
  'from-cyan-400 to-blue-500',
  'from-purple-500 to-violet-600',
  'from-lime-400 to-emerald-500',
];

export default function CategoryGrid({ rows = [], total = 0 }) {
  if (!rows.length) return null;

  return (
    <div className="grid grid-cols-2 gap-3">
      {rows.map((row, index) => {
        const share = total > 0 ? (Number(row.sum_amount) / total) * 100 : 0;
        return (
          <div
            key={row.category}
            className="rounded-3xl border border-white/[0.06] bg-white/[0.035] p-4"
          >
            <p className="truncate text-[12px] font-medium text-white/55">
              {categoryLabel(row.category)}
            </p>
            <p className="mt-2 font-heading text-[19px] font-bold tracking-tight text-white">
              {currency(row.sum_amount)}
            </p>
            <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/[0.08]">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${TONES[index % TONES.length]}`}
                style={{ width: `${share}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}