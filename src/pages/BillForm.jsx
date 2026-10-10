const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, Check, Loader2, Paperclip, Pencil, Trash2, X } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { useToast } from '@/components/ui/use-toast';
import { CATEGORIES, currency, isoDate } from '@/lib/phoneBills';

const EMPTY_FORM = {
  amount: '',
  category: 'plan',
  due_date: isoDate(),
  line_id: '',
  carrier: '',
  description: '',
  status: 'unpaid',
};

export default function BillForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileRef = useRef(null);
  const isEdit = Boolean(id);

  const [lines, setLines] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingAmount, setEditingAmount] = useState(false);
  const [attachmentUri, setAttachmentUri] = useState('');
  const [saving, setSaving] = useState(false);
  const [reading, setReading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const linePage = await db.entities.PhoneLine.filter({}, { sort: 'owner_name', limit: 50 });
      if (!alive) return;
      const lineList = linePage.items || [];
      setLines(lineList);

      if (isEdit) {
        const bill = await db.entities.Bill.get(id);
        if (!alive) return;
        setForm({
          amount: bill.amount === 0 || bill.amount ? String(bill.amount) : '',
          category: bill.category || 'plan',
          due_date: bill.due_date || isoDate(),
          line_id: bill.line_id || '',
          carrier: bill.carrier || '',
          description: bill.description || '',
          status: bill.status || 'unpaid',
        });
        setAttachmentUri(bill.attachment_uri || '');
      } else if (lineList.length) {
        setForm((prev) => ({
          ...prev,
          line_id: lineList[0].id,
          carrier: lineList[0].carrier,
        }));
      }
    })();
    return () => {
      alive = false;
    };
  }, [id, isEdit]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const selectLine = (lineId) => {
    const line = lines.find((item) => item.id === lineId);
    setForm((prev) => ({
      ...prev,
      line_id: lineId,
      carrier: line ? line.carrier : prev.carrier,
      category: prev.category || 'plan',
    }));
  };

  const handleFile = async (event) => {
    const file = event.target.files && event.target.files[0];
    event.target.value = '';
    if (!file) return;
    setReading(true);
    try {
      const { file_uri } = await db.integrations.Core.UploadPrivateFile({ file });
      setAttachmentUri(file_uri);
      const response = await db.functions.invoke('readBillFile', { file_uri });
      const fields = response.data || {};
      setForm((prev) => ({
        ...prev,
        amount: fields.amount ? String(fields.amount) : prev.amount,
        due_date: fields.due_date || prev.due_date,
        category: CATEGORIES.some((item) => item.value === fields.category)
          ? fields.category
          : prev.category,
        description: fields.description || prev.description,
      }));
      if (fields.carrier) {
        const needle = String(fields.carrier).toLowerCase();
        const match = lines.find(
          (line) =>
            line.carrier.toLowerCase().includes(needle) ||
            needle.includes(line.carrier.toLowerCase()),
        );
        if (match) selectLine(match.id);
      }
      toast({
        title: 'Bill details filled in',
        description: 'Check the amount and due date before saving.',
      });
    } catch (error) {
      toast({
        title: "Couldn't read that file",
        description: 'The attachment is saved — just fill the details in yourself.',
      });
    }
    setReading(false);
  };

  const save = async () => {
    const amount = Number(form.amount);
    if (!amount || amount <= 0) {
      toast({ title: 'Add an amount first', variant: 'destructive' });
      return;
    }
    if (!form.line_id) {
      toast({ title: 'Add a phone line first', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const payload = {
      amount,
      category: form.category,
      due_date: form.due_date,
      line_id: form.line_id,
      carrier: form.carrier,
      description: form.description.trim(),
      status: form.status,
      attachment_uri: attachmentUri,
      paid_date: form.status === 'paid' ? isoDate() : '',
    };
    if (isEdit) {
      await db.entities.Bill.update(id, payload);
    } else {
      await db.entities.Bill.create(payload);
    }
    setSaving(false);
    navigate('/bills');
  };

  const remove = async () => {
    await db.entities.Bill.delete(id);
    navigate('/bills');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="relative mx-auto w-full max-w-[480px] px-5 pt-8 pb-40">
        <div className="mb-6 flex items-center gap-3">
          <button
            type="button"
            aria-label="Cancel"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-white/70"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="font-heading text-[19px] font-bold text-white">
              {isEdit ? 'Edit bill' : 'New bill'}
            </h1>
            <p className="text-[12px] text-white/45">
              {isEdit ? 'Update the details or mark it paid' : 'Log a bill or scan one from your carrier'}
            </p>
          </div>
          {isEdit && (
            <button
              type="button"
              aria-label="Delete bill"
              onClick={() => setConfirmDelete(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-white/50 transition-colors hover:border-rose-500/30 hover:text-rose-300"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        <section className="rise relative overflow-hidden rounded-[1.75rem] border border-white/[0.07] bg-[#1b1b1f] p-6">
          <div className="aurora pointer-events-none absolute -inset-20 opacity-60 blur-2xl" />
          <div className="relative">
            {editingAmount ? (
              <input
                autoFocus
                type="number"
                inputMode="decimal"
                value={form.amount}
                onChange={(event) => set('amount', event.target.value)}
                onBlur={() => setEditingAmount(false)}
                placeholder="0.00"
                className="w-full bg-transparent font-heading text-[46px] font-extrabold leading-none tracking-tight text-white outline-none placeholder:text-white/25"
              />
            ) : (
              <p className="font-heading text-[46px] font-extrabold leading-none tracking-tight text-white">
                {form.amount ? currency(form.amount) : '$0.00'}
              </p>
            )}
            <button
              type="button"
              onClick={() => setEditingAmount(true)}
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/25 px-3.5 py-2 text-[12px] font-medium text-white/85 backdrop-blur-sm transition-colors hover:border-white/30"
            >
              <Pencil className="h-3.5 w-3.5" />
              Change amount
            </button>
          </div>
        </section>

        <div className="mt-6 space-y-4">
          <div>
            <Label className="text-[12px] text-white/50">Phone line</Label>
            <Select value={form.line_id} onValueChange={selectLine}>
              <SelectTrigger className="mt-2 h-12 rounded-2xl border-white/[0.07] bg-white/[0.04] text-[13.5px] text-white">
                <SelectValue placeholder="Choose a line" />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-[#1d1d21] text-white">
                {lines.map((line) => (
                  <SelectItem key={line.id} value={line.id} className="focus:bg-white/10">
                    {line.label} · {line.carrier}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {lines.length === 0 && (
              <p className="mt-2 text-[11.5px] text-amber-300/80">
                Add a phone line first so bills can be sorted correctly.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[12px] text-white/50">Category</Label>
              <Select value={form.category} onValueChange={(value) => set('category', value)}>
                <SelectTrigger className="mt-2 h-12 rounded-2xl border-white/[0.07] bg-white/[0.04] text-[13.5px] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-[#1d1d21] text-white">
                  {CATEGORIES.map((item) => (
                    <SelectItem key={item.value} value={item.value} className="focus:bg-white/10">
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[12px] text-white/50">Due date</Label>
              <div className="relative mt-2">
                <Input
                  type="date"
                  value={form.due_date}
                  onChange={(event) => set('due_date', event.target.value)}
                  className="h-12 rounded-2xl border-white/[0.07] bg-white/[0.04] pr-10 text-[13.5px] text-white"
                />
                <Calendar className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
              </div>
            </div>
          </div>

          {isEdit && (
            <div>
              <Label className="text-[12px] text-white/50">Payment status</Label>
              <Select value={form.status} onValueChange={(value) => set('status', value)}>
                <SelectTrigger className="mt-2 h-12 rounded-2xl border-white/[0.07] bg-white/[0.04] text-[13.5px] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-[#1d1d21] text-white">
                  <SelectItem value="unpaid" className="focus:bg-white/10">
                    Unpaid
                  </SelectItem>
                  <SelectItem value="paid" className="focus:bg-white/10">
                    Paid
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label className="text-[12px] text-white/50">Description</Label>
            <Textarea
              value={form.description}
              onChange={(event) => set('description', event.target.value)}
              placeholder="What is this charge for?"
              rows={3}
              className="mt-2 rounded-2xl border-white/[0.07] bg-white/[0.04] text-[13.5px] text-white placeholder:text-white/30"
            />
          </div>

          {attachmentUri && (
            <p className="flex items-center gap-2 px-1 text-[11.5px] text-white/40">
              <Paperclip className="h-3.5 w-3.5" /> Bill file attached
            </p>
          )}
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*,application/pdf"
        onChange={handleFile}
        className="hidden"
      />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent className="border-white/10 bg-[#1a1a1e] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-white">
              Delete this bill?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[12.5px] text-white/50">
              It disappears from your totals and history. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full border-white/10 bg-transparent text-white/70 hover:bg-white/5 hover:text-white">
              Keep it
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={remove}
              className="rounded-full bg-rose-500 text-white hover:bg-rose-500/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div
        className="fixed inset-x-0 bottom-0 z-40 px-5 pb-4"
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
      >
        <div className="mx-auto flex max-w-[440px] items-center justify-between rounded-[1.6rem] bg-white px-5 py-3 shadow-[0_-14px_44px_-18px_rgba(0,0,0,0.95)]">
          <button
            type="button"
            aria-label="Cancel"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#111]/55 transition-colors hover:bg-black/[0.06] hover:text-[#111]"
          >
            <X className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Attach or scan a bill"
            onClick={() => fileRef.current && fileRef.current.click()}
            disabled={reading}
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#111]/55 transition-colors hover:bg-black/[0.06] hover:text-[#111] disabled:opacity-50"
          >
            {reading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Paperclip className="h-5 w-5" />
            )}
          </button>
          <button
            type="button"
            aria-label="Save bill"
            onClick={save}
            disabled={saving}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[#111] text-white transition-transform hover:scale-[1.04] disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}