const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Plus, Receipt, Search } from 'lucide-react';

import ScreenHeader from '@/components/ScreenHeader';
import BillRow from '@/components/BillRow';
import EmptyState from '@/components/EmptyState';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { currency, isoDate } from '@/lib/phoneBills';
import { cn } from '@/lib/utils';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'unpaid', label: 'Unpaid' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'paid', label: 'Paid' },
];

export default function Bills() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [items, setItems] = useState([]);
  const [lines, setLines] = useState([]);
  const [summary, setSummary] = useState({ count: 0, total: 0 });
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const buildQuery = () => {
    const query = {};
    if (filter === 'paid') query.status = 'paid';
    if (filter === 'unpaid') query.status = 'unpaid';
    if (filter === 'overdue') {
      query.status = 'unpaid';
      query.due_date = { $lt: isoDate() };
    }
    const term = search.trim();
    if (term) {
      query.$or = [
        { description: { $regex: term, $options: 'i' } },
        { carrier: { $regex: term, $options: 'i' } },
      ];
    }
    return query;
  };

  const load = async () => {
    setLoading(true);
    const query = buildQuery();
    const [page, grouped] = await Promise.all([
      db.entities.Bill.filter(query, { sort: '-due_date', limit: 25 }),
      db.entities.Bill.aggregate({ query, groupBy: 'status', sum: ['amount'] }),
    ]);
    setItems(page.items || []);
    setCursor(page.has_more ? page.next_cursor : null);
    setHasMore(Boolean(page.has_more));
    const rows = grouped.rows || [];
    setSummary({
      count: rows.reduce((total, row) => total + (row.count || 0), 0),
      total: rows.reduce((total, row) => total + (Number(row.sum_amount) || 0), 0),
    });
    setLoading(false);
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      const linePage = await db.entities.PhoneLine.filter({}, { limit: 50 });
      if (alive) setLines(linePage.items || []);
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const timeout = setTimeout(load, search.trim() ? 300 : 0);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, search]);

  const loadMore = async () => {
    if (!cursor) return;
    setLoadingMore(true);
    const page = await db.entities.Bill.filter(buildQuery(), {
      sort: '-due_date',
      limit: 25,
      cursor,
    });
    setItems((prev) => [...prev, ...(page.items || [])]);
    setCursor(page.has_more ? page.next_cursor : null);
    setHasMore(Boolean(page.has_more));
    setLoadingMore(false);
  };

  const markPaid = async (bill) => {
    await db.entities.Bill.update(bill.id, { status: 'paid', paid_date: isoDate() });
    toast({ title: 'Marked as paid', description: `${currency(bill.amount)} · ${bill.carrier}` });
    load();
  };

  const lineName = (id) => lines.find((line) => line.id === id)?.label || '';

  return (
    <div className="space-y-5">
      <ScreenHeader
        title="Bills"
        subtitle={`${summary.count} ${summary.count === 1 ? 'bill' : 'bills'} · ${currency(summary.total)}`}
        right={
          <Link
            to="/bills/new"
            aria-label="Add a bill"
            className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#111] transition-transform hover:scale-[1.04]"
          >
            <Plus className="h-4 w-4" strokeWidth={2.4} />
          </Link>
        }
      />

      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search carrier or description"
          className="h-12 rounded-2xl border-white/[0.07] bg-white/[0.04] pl-11 text-[13.5px] text-white placeholder:text-white/30"
        />
      </div>

      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {FILTERS.map((item) => (
          <button
            key={item.key}
            type="button"
            data-testid={`bill-filter-${item.key}`}
            onClick={() => setFilter(item.key)}
            className={cn(
              'shrink-0 rounded-full border px-4 py-2 text-[12.5px] font-medium transition-colors',
              filter === item.key
                ? 'border-transparent bg-white text-[#111]'
                : 'border-white/[0.08] bg-white/[0.03] text-white/55 hover:text-white/80',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-white/35" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Nothing here yet"
          description="No bills match this view. Add a bill or scan one from your carrier."
          action={
            <Button
              onClick={() => navigate('/bills/new')}
              className="rounded-full bg-white px-6 text-[#111] hover:bg-white/90"
            >
              Add a bill
            </Button>
          }
        />
      ) : (
        <div className="divide-y divide-white/[0.04]">
          {items.map((bill) => (
            <BillRow
              key={bill.id}
              bill={bill}
              lineName={lineName(bill.line_id)}
              onOpen={() => navigate(`/bills/${bill.id}`)}
              onMarkPaid={markPaid}
            />
          ))}
        </div>
      )}

      {hasMore && !loading && (
        <Button
          variant="ghost"
          onClick={loadMore}
          disabled={loadingMore}
          className="w-full rounded-2xl border border-white/[0.07] bg-white/[0.03] text-[13px] text-white/70 hover:bg-white/[0.07] hover:text-white"
        >
          {loadingMore ? 'Loading…' : 'Load more'}
        </Button>
      )}
    </div>
  );
}