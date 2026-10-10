import { Outlet } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';

export default function AppShell() {
  return (
    <div className="min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 hidden lg:block bg-[radial-gradient(60%_50%_at_50%_0%,rgba(124,92,255,0.12),transparent_70%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-[480px] flex-col px-5 pt-8 pb-36">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}