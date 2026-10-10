const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRight,
  Download,
  FileText,
  LogOut,
  ShieldCheck,
  Users,
} from 'lucide-react';

import { useAuth } from '@/lib/AuthContext';
import ScreenHeader from '@/components/ScreenHeader';
import InitialAvatar from '@/components/InitialAvatar';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { categoryLabel, currency, isoDate } from '@/lib/phoneBills';

const PREFERENCES = [
  {
    key: 'alert_due',
    label: 'Payment reminders',
    description: 'Nudges before a bill is due and when one slips past its date.',
  },
  {
    key: 'alert_hike',
    label: 'Price hike detection',
    description: 'Tells you when a carrier quietly raises your monthly bill.',
  },
  {
    key: 'alert_overage',
    label: 'Overage warnings',
    description: 'Flags any line running past its data allowance.',
  },
  {
    key: 'alert_contract',
    label: 'Contract & renewal alerts',
    description: 'Warns you before a contract ends or auto-renews.',
  },
];

const csvCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [prefs, setPrefs] = useState({
    alert_due: true,
    alert_hike: true,
    alert_overage: true,
    alert_contract: true,
  });
  const [counts, setCounts] = useState({ lines: 0, bills: 0 });
  const [busy, setBusy] = useState('');

  useEffect(() => {
    setPrefs({
      alert_due: user?.alert_due !== false,
      alert_hike: user?.alert_hike !== false,
      alert_overage: user?.alert_overage !== false,
      alert_contract: user?.alert_contract !== false,
    });
  }, [user]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [lines, bills] = await Promise.all([
        db.entities.PhoneLine.count({}),
        db.entities.Bill.count({}),
      ]);
      if (alive) setCounts({ lines, bills });
    })();
    return () => {
      alive = false;
    };
  }, []);

  const togglePref = async (key, value) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
    await db.auth.updateMe({ [key]: value });
  };

  const fetchAllBills = async () => {
    const rows = [];
    let cursor;
    let guard = 0;
    do {
      const page = await db.entities.Bill.filter({}, { sort: '-due_date', limit: 200, cursor });
      rows.push(...(page.items || []));
      cursor = page.has_more ? page.next_cursor : undefined;
      guard += 1;
    } while (cursor && guard < 20);
    return rows;
  };

  const exportCsv = async () => {
    setBusy('csv');
    const rows = await fetchAllBills();
    const header = ['Due date', 'Carrier', 'Category', 'Amount', 'Status', 'Paid date', 'Description'];
    const csv = [
      header,
      ...rows.map((bill) => [
        bill.due_date,
        bill.carrier,
        categoryLabel(bill.category),
        Number(bill.amount) || 0,
        bill.status,
        bill.paid_date || '',
        bill.description || '',
      ]),
    ]
      .map((cells) => cells.map(csvCell).join(','))
      .join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `phone-bills-${isoDate()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setBusy('');
    toast({ title: 'CSV exported', description: `${rows.length} bills ready for a spreadsheet.` });
  };

  const exportPdf = async () => {
    setBusy('pdf');
    const rows = await fetchAllBills();
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    const total = rows.reduce((sum, bill) => sum + (Number(bill.amount) || 0), 0);
    doc.setFontSize(16);
    doc.text('Phone bill expense report', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated ${isoDate()}  ·  ${rows.length} bills  ·  ${currency(total)}`, 14, 27);
    let y = 40;
    rows.forEach((bill) => {
      if (y > 275) {
        doc.addPage();
        y = 20;
      }
      doc.text(
        `${bill.due_date}   ${bill.carrier}   ${categoryLabel(bill.category)}   ${currency(bill.amount)}   ${bill.status}`,
        14,
        y,
      );
      y += 7;
    });
    doc.save(`phone-bill-report-${isoDate()}.pdf`);
    setBusy('');
    toast({ title: 'PDF ready', description: 'Hand it in with your next expense claim.' });
  };

  const handleLogout = async () => {
    await db.auth.logout();
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <ScreenHeader title="Settings" subtitle="Alerts, exports and account" />

      <section className="flex items-center gap-3.5 rounded-[1.5rem] border border-white/[0.06] bg-white/[0.03] p-5">
        <InitialAvatar
          name={user?.full_name || 'You'}
          toneClass="from-violet-500 to-fuchsia-500"
          className="h-12 w-12"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-heading text-[15px] font-bold text-white">
            {user?.full_name || 'You'}
          </p>
          <p className="truncate text-[12px] text-white/45">{user?.email || ''}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-heading text-[15px] font-bold text-white">{counts.lines}</p>
          <p className="text-[10.5px] text-white/40">lines</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-heading text-[15px] font-bold text-white">{counts.bills}</p>
          <p className="text-[10.5px] text-white/40">bills</p>
        </div>
      </section>

      <section className="space-y-2.5">
        <h2 className="px-1 font-heading text-[15px] font-bold text-white">Smart alerts</h2>
        <div className="divide-y divide-white/[0.05] rounded-[1.5rem] border border-white/[0.06] bg-white/[0.03] px-5">
          {PREFERENCES.map((preference) => (
            <div key={preference.key} className="flex items-center gap-4 py-4">
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-medium text-white">{preference.label}</p>
                <p className="mt-0.5 text-[11.5px] leading-relaxed text-white/45">
                  {preference.description}
                </p>
              </div>
              <Switch
                checked={Boolean(prefs[preference.key])}
                onCheckedChange={(value) => togglePref(preference.key, value)}
                className="shrink-0 data-[state=checked]:bg-white/90 data-[state=unchecked]:bg-white/20"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-2.5">
        <h2 className="px-1 font-heading text-[15px] font-bold text-white">Export & reports</h2>
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={exportCsv}
            disabled={busy === 'csv'}
            variant="ghost"
            className="h-auto flex-col items-start gap-3 rounded-3xl border border-white/[0.06] bg-white/[0.03] px-4 py-4 text-left hover:bg-white/[0.06]"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.08] text-white/70">
              <Download className="h-4 w-4" />
            </span>
            <span className="text-[12.5px] font-semibold text-white">
              {busy === 'csv' ? 'Preparing…' : 'CSV spreadsheet'}
            </span>
          </Button>
          <Button
            onClick={exportPdf}
            disabled={busy === 'pdf'}
            variant="ghost"
            className="h-auto flex-col items-start gap-3 rounded-3xl border border-white/[0.06] bg-white/[0.03] px-4 py-4 text-left hover:bg-white/[0.06]"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.08] text-white/70">
              <FileText className="h-4 w-4" />
            </span>
            <span className="text-[12.5px] font-semibold text-white">
              {busy === 'pdf' ? 'Preparing…' : 'PDF expense report'}
            </span>
          </Button>
        </div>
      </section>

      <section className="space-y-2.5">
        <h2 className="px-1 font-heading text-[15px] font-bold text-white">Manage</h2>
        <div className="divide-y divide-white/[0.05] rounded-[1.5rem] border border-white/[0.06] bg-white/[0.03] px-5">
          <Link to="/lines" className="flex items-center gap-3 py-4">
            <Users className="h-4 w-4 text-white/45" />
            <span className="flex-1 text-[13.5px] font-medium text-white">Lines & family</span>
            <ChevronRight className="h-4 w-4 text-white/30" />
          </Link>
          <div className="flex items-start gap-3 py-4">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-white/45" />
            <div>
              <p className="text-[13.5px] font-medium text-white">Your bills stay private</p>
              <p className="mt-0.5 text-[11.5px] leading-relaxed text-white/45">
                Bill files are stored in private storage and only ever opened through short-lived
                links tied to your account. Biometric sign-in arrives with the phone build.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Button
        onClick={handleLogout}
        variant="ghost"
        className="w-full rounded-2xl border border-white/[0.06] bg-white/[0.03] py-6 text-[13px] text-white/60 hover:bg-white/[0.06] hover:text-white"
      >
        <LogOut className="mr-2 h-4 w-4" /> Log out
      </Button>
    </div>
  );
}