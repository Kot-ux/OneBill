export const CARRIERS = [
  'Rogers',
  'Bell',
  'Telus',
  'Freedom Mobile',
  'Koodo',
  'Fido',
  'Public Mobile',
  'Chatr',
  'Videotron',
  'Other',
];

export const CATEGORIES = [
  { value: 'plan', label: 'Plan' },
  { value: 'data', label: 'Data overage' },
  { value: 'calls', label: 'Calls' },
  { value: 'add_ons', label: 'Add-ons' },
  { value: 'roaming', label: 'Roaming' },
  { value: 'device', label: 'Device' },
  { value: 'taxes', label: 'Taxes & fees' },
  { value: 'other', label: 'Other' },
];

const CARRIER_TONES = {
  Rogers: 'from-rose-500 to-red-600',
  Bell: 'from-sky-500 to-blue-600',
  Telus: 'from-violet-500 to-purple-600',
  'Freedom Mobile': 'from-fuchsia-500 to-pink-600',
  Koodo: 'from-teal-400 to-cyan-500',
  Fido: 'from-amber-400 to-orange-500',
  'Public Mobile': 'from-indigo-500 to-violet-600',
  Chatr: 'from-emerald-400 to-green-500',
  Videotron: 'from-purple-500 to-indigo-600',
};

const FALLBACK_TONES = [
  'from-slate-500 to-slate-700',
  'from-blue-500 to-indigo-600',
  'from-pink-500 to-rose-600',
  'from-teal-500 to-emerald-600',
];

export function carrierTone(carrier = '') {
  if (CARRIER_TONES[carrier]) return CARRIER_TONES[carrier];
  const sum = String(carrier)
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return FALLBACK_TONES[sum % FALLBACK_TONES.length];
}

export function categoryLabel(value) {
  const found = CATEGORIES.find((item) => item.value === value);
  return found ? found.label : 'Other';
}

export function currency(value) {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

export function compactCurrency(value) {
  const amount = Number(value) || 0;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}k`;
  return `$${Math.round(amount)}`;
}

export function isoDate(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const target = new Date(`${dateStr}T00:00:00`);
  const today = new Date(`${isoDate()}T00:00:00`);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

export function formatShortDate(dateStr) {
  if (!dateStr) return '';
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-CA', {
    month: 'short',
    day: 'numeric',
  });
}

export function formatMonthYear(dateStr) {
  if (!dateStr) return '';
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-CA', {
    month: 'short',
    year: 'numeric',
  });
}

export function billState(bill) {
  if (bill.status === 'paid') return 'paid';
  const days = daysUntil(bill.due_date);
  if (days === null) return 'unpaid';
  if (days < 0) return 'overdue';
  if (days <= 7) return 'due_soon';
  return 'unpaid';
}

export function sumAmounts(rows) {
  return rows.reduce((total, row) => total + (Number(row.amount) || 0), 0);
}

export function planFit(line) {
  const allowance = Number(line.data_allowance_gb) || 0;
  const used = Number(line.data_used_gb) || 0;
  if (!allowance) return { score: 60, note: 'No data allowance on file yet.' };
  const ratio = used / allowance;
  if (ratio > 1) {
    return {
      score: Math.max(25, Math.round(70 - (ratio - 1) * 90)),
      note: `${(used - allowance).toFixed(1)} GB past the allowance — add a data pass or move up a tier.`,
    };
  }
  if (ratio < 0.35) {
    return {
      score: Math.round(50 + ratio * 45),
      note: `Only ${Math.round(ratio * 100)}% of the allowance used — a smaller plan would cost less.`,
    };
  }
  return {
    score: Math.min(99, Math.round(88 + ratio * 10)),
    note: 'Usage sits comfortably inside the plan.',
  };
}

export function ownerSplit(lines = []) {
  const totals = {};
  lines.forEach((line) => {
    const owner = line.owner_name || 'Unassigned';
    const share = Number.isFinite(Number(line.split_percentage))
      ? Number(line.split_percentage)
      : 100;
    const cost = (Number(line.monthly_cost) || 0) * (share / 100);
    totals[owner] = (totals[owner] || 0) + cost;
  });
  return Object.entries(totals)
    .map(([owner, amount]) => ({ owner, amount }))
    .sort((a, b) => b.amount - a.amount);
}

const TONE_WEIGHT = { danger: 0, warn: 1, info: 2 };

export function buildAlerts({ lines = [], bills = [], prefs = {} }) {
  const enabled = (key) => prefs[key] !== false;
  const alerts = [];

  if (enabled('due')) {
    const open = bills.filter((bill) => bill.status !== 'paid');
    const overdue = open.filter((bill) => (daysUntil(bill.due_date) ?? 0) < 0);
    if (overdue.length) {
      alerts.push({
        id: 'overdue',
        kind: 'due',
        tone: 'danger',
        title: `${overdue.length} overdue ${overdue.length === 1 ? 'bill' : 'bills'}`,
        detail: `${currency(sumAmounts(overdue))} past its due date — pay now to avoid a late fee.`,
      });
    }
    const soon = open.filter((bill) => {
      const days = daysUntil(bill.due_date);
      return days !== null && days >= 0 && days <= 7;
    });
    if (soon.length) {
      const next = [...soon].sort((a, b) =>
        String(a.due_date).localeCompare(String(b.due_date)),
      )[0];
      alerts.push({
        id: 'due-soon',
        kind: 'due',
        tone: 'warn',
        title: `${soon.length} ${soon.length === 1 ? 'bill' : 'bills'} due this week`,
        detail: `${currency(sumAmounts(soon))} due by ${formatShortDate(next.due_date)}.`,
      });
    }
  }

  if (enabled('hike')) {
    const byLine = {};
    bills.forEach((bill) => {
      const key = bill.line_id || bill.carrier || 'unknown';
      byLine[key] = byLine[key] || [];
      byLine[key].push(bill);
    });
    Object.entries(byLine).forEach(([key, rows]) => {
      const sorted = [...rows].sort((a, b) =>
        String(a.due_date).localeCompare(String(b.due_date)),
      );
      if (sorted.length < 2) return;
      const latest = sorted[sorted.length - 1];
      const previous = sorted[sorted.length - 2];
      const previousAmount = Number(previous.amount) || 0;
      const latestAmount = Number(latest.amount) || 0;
      if (previousAmount <= 0) return;
      const delta = latestAmount - previousAmount;
      if (delta / previousAmount < 0.07) return;
      const line = lines.find((item) => item.id === latest.line_id);
      alerts.push({
        id: `hike-${key}`,
        kind: 'hike',
        tone: 'warn',
        title: `${line ? line.label : latest.carrier} went up ${Math.round(
          (delta / previousAmount) * 100,
        )}%`,
        detail: `${currency(latestAmount)} this cycle vs ${currency(previousAmount)} last cycle — ${currency(
          delta * 12,
        )} a year more.`,
      });
    });
  }

  if (enabled('overage')) {
    lines.forEach((line) => {
      const allowance = Number(line.data_allowance_gb) || 0;
      const used = Number(line.data_used_gb) || 0;
      if (!allowance || used <= allowance) return;
      alerts.push({
        id: `overage-${line.id}`,
        kind: 'overage',
        tone: 'danger',
        title: `${line.label} is over its data limit`,
        detail: `${(used - allowance).toFixed(1)} GB past the ${allowance} GB allowance — overage charges apply.`,
      });
    });
  }

  if (enabled('contract')) {
    lines.forEach((line) => {
      const days = daysUntil(line.contract_end_date);
      if (days === null || days < 0 || days > 60) return;
      alerts.push({
        id: `contract-${line.id}`,
        kind: 'contract',
        tone: line.autopay ? 'warn' : 'info',
        title: line.autopay
          ? `Auto-renewal in ${days} days`
          : `Contract ends in ${days} days`,
        detail: `${line.plan_name || 'Plan'} on ${line.carrier} — ${
          line.autopay ? 'auto-pay is on, so it renews as-is' : 'renegotiate or switch now'
        } by ${formatShortDate(line.contract_end_date)}.`,
      });
    });
  }

  return alerts.sort((a, b) => TONE_WEIGHT[a.tone] - TONE_WEIGHT[b.tone]);
}

export function bestDealForLine(line, deals = []) {
  const used = Number(line.data_used_gb) || 0;
  const candidates = deals
    .filter((deal) => Number(deal.data_gb) >= used)
    .sort((a, b) => Number(a.monthly_price) - Number(b.monthly_price));
  if (!candidates.length) return null;
  const best = candidates[0];
  const monthlySaving = (Number(line.monthly_cost) || 0) - Number(best.monthly_price);
  return {
    deal: best,
    monthlySaving,
    yearlySaving: monthlySaving * 12,
  };
}