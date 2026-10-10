import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function ScreenHeader({ title, subtitle, back = false, right = null }) {
  const navigate = useNavigate();

  return (
    <header className="mb-6 flex items-start gap-3">
      {back && (
        <button
          type="button"
          aria-label="Go back"
          onClick={() => navigate(-1)}
          className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-white/70 transition-colors hover:text-white"
        >
          <ChevronLeft className="h-[18px] w-[18px]" />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="font-heading text-[23px] font-bold leading-tight tracking-tight text-white">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-[13px] text-white/45">{subtitle}</p>}
      </div>
      {right}
    </header>
  );
}