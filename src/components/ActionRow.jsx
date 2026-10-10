import { Link } from 'react-router-dom';
import { Plus, Sparkles, Users } from 'lucide-react';

const ACTIONS = [
  { to: '/bills/new', label: 'Add bill', Icon: Plus },
  { to: '/deals', label: 'Deals', Icon: Sparkles },
  { to: '/lines', label: 'Family', Icon: Users },
];

export default function ActionRow() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {ACTIONS.map(({ to, label, Icon }) => (
        <Link
          key={to}
          to={to}
          className="flex flex-col items-center gap-2.5 rounded-3xl border border-white/[0.06] bg-white/[0.04] px-2 py-4 transition-colors hover:border-white/16 hover:bg-white/[0.07]"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-white/[0.16] to-white/[0.03] text-white">
            <Icon className="h-[18px] w-[18px]" strokeWidth={2.2} />
          </span>
          <span className="text-[11.5px] font-medium text-white/70">{label}</span>
        </Link>
      ))}
    </div>
  );
}