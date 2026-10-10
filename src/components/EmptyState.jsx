import { Info } from 'lucide-react';

export default function EmptyState({ icon: Icon = Info, title, description, action = null }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.06] text-white/50">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-4 font-heading text-[15px] font-bold text-white">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-[280px] text-[12.5px] leading-relaxed text-white/45">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}