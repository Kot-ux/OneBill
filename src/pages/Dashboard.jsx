const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Loader2, Plus } from 'lucide-react';

import { useAuth } from '@/lib/AuthContext';
import InitialAvatar from '@/components/InitialAvatar';
import HeroCard from '@/components/HeroCard';
import ActionRow from '@/components/ActionRow';
import AlertsPanel from '@/components/AlertsPanel';
import BillRow from '@/components/BillRow';
import { buildAlerts, currency, formatShortDate } from '@/lib/phoneBills';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [lines, setLines] = useState([]);
  const [bills, setBills] = useState([]);
  const [statusRows, setStatusRows] = useState([]);
  const [selectedLineId, setSelectedLineId] = useState('all');
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [linePage, billPage, grouped] = await Promise.all([
        db.entities.PhoneLine.filter({}, { sort: 'owner_name', limit: 50 }),
        db.entities.Bill.filter({}, { sort: '-due_date', limit: 50 }),
        db.entities.Bill.aggregate({ groupBy: 'status', sum: ['amount'] }),
      ]);
      if (!alive) return;
      setLines(linePage.items || []);
      setBills(billPage.items || []);
      setStatusRows(grouped.rows || []);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const alerts = useMemo(
    () =>
      buildAlerts({
        lines,
        bills,
        prefs: {
          due: user?.alert_due,
          hike: user?.alert_hike,
          overage: user?.alert_overage,
          contract: user?.alert_contract,
        },
      }),
    [lines, bills, user],
  );

  const lineName = (id) => lines.find((line) => line.id === id)?.label || '';
  const selectedLine = lines.find((line) => line.id === selectedLineId) || null;
  const openBills = bills.filter((bill) => bill.status !== 'paid');
  const scopedOpen =
    selectedLineId === 'all'
      ? openBills
      : openBills.filter((bill) => bill.line_id === selectedLineId);
  const allLinesDue = statusRows
    .filter((row) => row.status !== 'paid')
    .reduce((total, row) => total + (Number(row.sum_amount) || 0), 0);
  const totalDue =
    selectedLineId === 'all'
      ? allLinesDue
      : scopedOpen.reduce((total, bill) => total + (Number(bill.amount) || 0), 0);
  const nextDue = [...scopedOpen].sort((a, b) =>
    String(a.due_date).localeCompare(String(b.due_date)),
  )[0];
  const recent = [...bills]
    .sort((a, b) => String(b.due_date).localeCompare(String(a.due_date)))
    .slice(0, 5);

  const toggleAutopay = async (value) => {
    if (!selectedLine) return;
    setLines((prev) =>
      prev.map((line) => (line.id === selectedLine.id ? { ...line, autopay: value } : line)),
    );
    await db.entities.PhoneLine.update(selectedLine.id, { autopay: value });
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-32">
        <Loader2 className="h-6 w-6 animate-spin text-white/35" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <InitialAvatar
          name={user?.full_name || 'You'}
          toneClass="from-violet-500 to-fuchsia-500"
          className="h-11 w-11"
        />
        <div className="min-w-0 flex-1">
          <p className="text-[12px] text-white/45">Welcome back</p>
          <p className="truncate font-heading text-[16px] font-bold text-white">
            {user?.full_name || 'You'}
          </p>
        </div>
        <button
          type="button"
          aria-label="Bills and reminders"
          onClick={() => navigate('/bills')}
          className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.04] text-white/70 transition-colors hover:text-white"
        >
          <Bell className="h-[18px] w-[18px]" />
          {alerts.length > 0 && (
            <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-rose-400 ring-2 ring-background" />
          )}
        </button>
      </header>

      <HeroCard
        lines={lines}
        selectedLine={selectedLine}
        onSelectLine={setSelectedLineId}
        totalDue={totalDue}
        openCount={scopedOpen.length}
        nextDueDate={nextDue?.due_date}
        hidden={hidden}
        onToggleHidden={() => setHidden((prev) => !prev)}
        onToggleAutopay={toggleAutopay}
      />

      <ActionRow />

      <AlertsPanel alerts={alerts} limit={3} />

      <section className="space-y-1">
        <div className="flex items-baseline justify-between px-1 pb-1">
          <h2 className="font-heading text-[15px] font-bold text-white">Recent bills</h2>
          <Link to="/bills" className="text-[12px] font-medium text-white/50 hover:text-white/80">
            View all
          </Link>
        </div>
        {recent.length === 0 ? (
          <Link
            to="/bills/new"
            className="flex items-center justify-between rounded-3xl border border-dashed border-white/12 bg-white/[0.02] px-5 py-6 transition-colors hover:border-white/25"
          >
            <div>
              <p className="text-[13.5px] font-semibold text-white">No bills yet</p>
              <p className="mt-0.5 text-[12px] text-white/45">
                Add your first bill or scan one to get started.
              </p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#111]">
              <Plus className="h-4 w-4" />
            </span>
          </Link>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {recent.map((bill) => (
              <BillRow
                key={bill.id}
                bill={bill}
                lineName={lineName(bill.line_id)}
                onOpen={() => navigate(`/bills/${bill.id}`)}
              />
            ))}
          </div>
        )}
      </section>

      <p className="px-1 pt-1 text-[11.5px] text-white/30">
        Tracking {lines.length} {lines.length === 1 ? 'line' : 'lines'} ·{' '}
        {currency(allLinesDue)} open
      </p>
    </div>
  );
}