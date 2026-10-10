import { NavLink } from 'react-router-dom';
import { LayoutGrid, Receipt, Sparkles, PieChart, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const ITEMS = [
  { to: '/', label: 'Home', Icon: LayoutGrid },
  { to: '/bills', label: 'Bills', Icon: Receipt },
  { to: '/deals', label: 'Deals', Icon: Sparkles },
  { to: '/analytics', label: 'Insights', Icon: PieChart },
  { to: '/settings', label: 'Settings', Icon: Settings },
];

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40">
      <div
        className="mx-auto w-full max-w-[480px] px-5 pb-4"
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
      >
        <div className="grid grid-cols-5 items-center rounded-[1.5rem] border border-white/[0.07] bg-[#161618]/90 px-1.5 py-2 shadow-[0_-10px_40px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl">
          {ITEMS.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 rounded-2xl py-1.5 text-[10px] font-medium transition-colors',
                  isActive ? 'text-white' : 'text-white/40 hover:text-white/70',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-300',
                      isActive
                        ? 'bg-white text-[#111] shadow-[0_8px_20px_-8px_rgba(255,255,255,0.55)]'
                        : 'bg-transparent',
                    )}
                  >
                    <Icon className="h-[17px] w-[17px]" strokeWidth={2.2} />
                  </span>
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}