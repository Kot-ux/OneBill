const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useEffect, useState } from 'react';
import { Loader2, Pencil, Plus, Trash2, Users } from 'lucide-react';

import ScreenHeader from '@/components/ScreenHeader';
import InitialAvatar from '@/components/InitialAvatar';
import UsageMeter from '@/components/UsageMeter';
import LineFormDialog from '@/components/LineFormDialog';
import EmptyState from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  carrierTone,
  currency,
  formatShortDate,
  ownerSplit,
  planFit,
} from '@/lib/phoneBills';

export default function Lines() {
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const linePage = await db.entities.PhoneLine.filter({}, { sort: 'owner_name', limit: 50 });
      if (!alive) return;
      setLines(linePage.items || []);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const handleSave = async (payload) => {
    if (editing) {
      await db.entities.PhoneLine.update(editing.id, payload);
      setLines((prev) =>
        prev.map((line) => (line.id === editing.id ? { ...line, ...payload } : line)),
      );
    } else {
      const created = await db.entities.PhoneLine.create(payload);
      setLines((prev) => [...prev, created]);
    }
    setEditing(null);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    await db.entities.PhoneLine.delete(pendingDelete.id);
    setLines((prev) => prev.filter((line) => line.id !== pendingDelete.id));
    setPendingDelete(null);
  };

  const split = ownerSplit(lines);
  const total = split.reduce((sum, entry) => sum + entry.amount, 0);

  return (
    <div className="space-y-5">
      <ScreenHeader
        title="Lines & family"
        subtitle="Who is on the plan and who pays what"
        back
        right={
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
            className="mt-0.5 h-10 rounded-full bg-white px-4 text-[12.5px] font-semibold text-[#111] hover:bg-white/90"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add
          </Button>
        }
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-white/35" />
        </div>
      ) : (
        <>
          {split.length > 0 && (
            <section className="rounded-[1.5rem] border border-white/[0.06] bg-white/[0.03] p-5">
              <div className="flex items-baseline justify-between">
                <h2 className="font-heading text-[15px] font-bold text-white">Who owes what</h2>
                <span className="font-heading text-[15px] font-bold text-white">
                  {currency(total)}
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {split.map((entry, index) => {
                  const share = total > 0 ? (entry.amount / total) * 100 : 0;
                  return (
                    <div key={entry.owner} className="flex items-center gap-3">
                      <InitialAvatar
                        name={entry.owner}
                        toneClass={
                          ['from-violet-500 to-fuchsia-500', 'from-teal-400 to-emerald-500', 'from-sky-400 to-indigo-500'][
                            index % 3
                          ]
                        }
                        className="h-9 w-9 rounded-xl"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-white">
                          {entry.owner}
                        </p>
                        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/[0.08]">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                            style={{ width: `${share}%` }}
                          />
                        </div>
                      </div>
                      <span className="shrink-0 text-[13px] font-semibold text-white/80">
                        {currency(entry.amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {lines.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No lines yet"
              description="Add each phone number you pay for and the family split sorts itself out."
              action={
                <Button
                  onClick={() => {
                    setEditing(null);
                    setDialogOpen(true);
                  }}
                  className="rounded-full bg-white px-6 text-[#111] hover:bg-white/90"
                >
                  Add a line
                </Button>
              }
            />
          ) : (
            lines.map((line) => {
              const fit = planFit(line);
              return (
                <section
                  key={line.id}
                  className="rounded-[1.5rem] border border-white/[0.06] bg-white/[0.03] p-5"
                >
                  <div className="flex items-start gap-3.5">
                    <InitialAvatar
                      name={line.carrier}
                      toneClass={carrierTone(line.carrier)}
                      className="h-11 w-11 rounded-xl"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-semibold text-white">{line.label}</p>
                      <p className="truncate text-[11.5px] text-white/45">
                        {line.carrier}
                        {line.phone_number ? ` · ${line.phone_number}` : ''}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        aria-label="Edit line"
                        onClick={() => {
                          setEditing(line);
                          setDialogOpen(true);
                        }}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] text-white/45 transition-colors hover:text-white"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label="Remove line"
                        onClick={() => setPendingDelete(line)}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] text-white/45 transition-colors hover:border-rose-500/30 hover:text-rose-300"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-[12px]">
                    <div className="rounded-2xl border border-white/[0.06] bg-black/20 px-3.5 py-3">
                      <p className="text-white/40">Monthly</p>
                      <p className="mt-1 font-heading text-[15px] font-bold text-white">
                        {currency(line.monthly_cost)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/[0.06] bg-black/20 px-3.5 py-3">
                      <p className="text-white/40">Plan fit</p>
                      <p className="mt-1 font-heading text-[15px] font-bold text-white">
                        {fit.score}%
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3.5">
                    <UsageMeter
                      label="Data"
                      used={Number(line.data_used_gb) || 0}
                      total={Number(line.data_allowance_gb) || 0}
                      unit="GB"
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2 text-[11.5px] text-white/45">
                    <span className="rounded-full border border-white/[0.08] px-2.5 py-1">
                      {line.owner_name || 'Unassigned'} · {line.split_percentage ?? 100}% share
                    </span>
                    <span className="rounded-full border border-white/[0.08] px-2.5 py-1">
                      {line.autopay ? 'Auto-pay on' : 'Auto-pay off'}
                    </span>
                    {line.contract_end_date && (
                      <span className="rounded-full border border-white/[0.08] px-2.5 py-1">
                        Contract ends {formatShortDate(line.contract_end_date)}
                      </span>
                    )}
                    <span className="rounded-full border border-white/[0.08] px-2.5 py-1">
                      {line.minutes_used || 0} min · {line.sms_used || 0} texts
                    </span>
                  </div>

                  <p className="mt-3 text-[11.5px] leading-relaxed text-white/40">{fit.note}</p>
                </section>
              );
            })
          )}
        </>
      )}

      <LineFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
        line={editing}
        onSave={handleSave}
      />

      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent className="border-white/10 bg-[#1a1a1e] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-white">
              Remove {pendingDelete?.label}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[12.5px] text-white/50">
              The line and its usage disappear from your dashboard. Bills already logged stay in
              your history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full border-white/10 bg-transparent text-white/70 hover:bg-white/5 hover:text-white">
              Keep it
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="rounded-full bg-rose-500 text-white hover:bg-rose-500/90"
            >
              Remove line
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}