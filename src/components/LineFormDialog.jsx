import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CARRIERS } from '@/lib/phoneBills';

const EMPTY_LINE = {
  label: '',
  phone_number: '',
  carrier: 'Rogers',
  owner_name: '',
  plan_name: '',
  monthly_cost: '',
  data_allowance_gb: '',
  data_used_gb: '',
  minutes_used: '',
  sms_used: '',
  contract_end_date: '',
  split_percentage: 100,
  autopay: false,
};

export default function LineFormDialog({ open, onOpenChange, line, onSave }) {
  const [form, setForm] = useState(EMPTY_LINE);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(
      line
        ? {
            label: line.label || '',
            phone_number: line.phone_number || '',
            carrier: line.carrier || 'Rogers',
            owner_name: line.owner_name || '',
            plan_name: line.plan_name || '',
            monthly_cost: line.monthly_cost ?? '',
            data_allowance_gb: line.data_allowance_gb ?? '',
            data_used_gb: line.data_used_gb ?? '',
            minutes_used: line.minutes_used ?? '',
            sms_used: line.sms_used ?? '',
            contract_end_date: line.contract_end_date || '',
            split_percentage: line.split_percentage ?? 100,
            autopay: Boolean(line.autopay),
          }
        : EMPTY_LINE,
    );
  }, [open, line]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!form.label.trim()) return;
    setSaving(true);
    await onSave({
      ...form,
      label: form.label.trim(),
      monthly_cost: Number(form.monthly_cost) || 0,
      data_allowance_gb: Number(form.data_allowance_gb) || 0,
      data_used_gb: Number(form.data_used_gb) || 0,
      minutes_used: Number(form.minutes_used) || 0,
      sms_used: Number(form.sms_used) || 0,
      split_percentage: Number(form.split_percentage) || 100,
      is_active: true,
    });
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto border-white/10 bg-[#1a1a1e] text-white sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="font-heading text-[18px] font-bold text-white">
            {line ? 'Edit line' : 'Add a line'}
          </DialogTitle>
          <DialogDescription className="text-[12.5px] text-white/45">
            Everything you track about this number lives here.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label className="text-[12px] text-white/55">Line name</Label>
            <Input
              value={form.label}
              onChange={(e) => set('label', e.target.value)}
              placeholder="Julie's iPhone 15"
              className="mt-1.5 border-white/10 bg-white/[0.05] text-white"
            />
          </div>
          <div>
            <Label className="text-[12px] text-white/55">Phone number</Label>
            <Input
              value={form.phone_number}
              onChange={(e) => set('phone_number', e.target.value)}
              placeholder="(416) 555-0143"
              className="mt-1.5 border-white/10 bg-white/[0.05] text-white"
            />
          </div>
          <div>
            <Label className="text-[12px] text-white/55">Carrier</Label>
            <Select value={form.carrier} onValueChange={(value) => set('carrier', value)}>
              <SelectTrigger className="mt-1.5 border-white/10 bg-white/[0.05] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-[#1d1d21] text-white">
                {CARRIERS.map((carrier) => (
                  <SelectItem key={carrier} value={carrier} className="focus:bg-white/10">
                    {carrier}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[12px] text-white/55">Who uses it</Label>
            <Input
              value={form.owner_name}
              onChange={(e) => set('owner_name', e.target.value)}
              placeholder="Julie Quinn"
              className="mt-1.5 border-white/10 bg-white/[0.05] text-white"
            />
          </div>
          <div>
            <Label className="text-[12px] text-white/55">Plan name</Label>
            <Input
              value={form.plan_name}
              onChange={(e) => set('plan_name', e.target.value)}
              placeholder="Infinite 20GB"
              className="mt-1.5 border-white/10 bg-white/[0.05] text-white"
            />
          </div>
          <div>
            <Label className="text-[12px] text-white/55">Monthly cost</Label>
            <Input
              type="number"
              inputMode="decimal"
              value={form.monthly_cost}
              onChange={(e) => set('monthly_cost', e.target.value)}
              placeholder="85"
              className="mt-1.5 border-white/10 bg-white/[0.05] text-white"
            />
          </div>
          <div>
            <Label className="text-[12px] text-white/55">Data included (GB)</Label>
            <Input
              type="number"
              inputMode="decimal"
              value={form.data_allowance_gb}
              onChange={(e) => set('data_allowance_gb', e.target.value)}
              placeholder="20"
              className="mt-1.5 border-white/10 bg-white/[0.05] text-white"
            />
          </div>
          <div>
            <Label className="text-[12px] text-white/55">Data used (GB)</Label>
            <Input
              type="number"
              inputMode="decimal"
              value={form.data_used_gb}
              onChange={(e) => set('data_used_gb', e.target.value)}
              placeholder="17.4"
              className="mt-1.5 border-white/10 bg-white/[0.05] text-white"
            />
          </div>
          <div>
            <Label className="text-[12px] text-white/55">Minutes used</Label>
            <Input
              type="number"
              inputMode="numeric"
              value={form.minutes_used}
              onChange={(e) => set('minutes_used', e.target.value)}
              placeholder="420"
              className="mt-1.5 border-white/10 bg-white/[0.05] text-white"
            />
          </div>
          <div>
            <Label className="text-[12px] text-white/55">Texts used</Label>
            <Input
              type="number"
              inputMode="numeric"
              value={form.sms_used}
              onChange={(e) => set('sms_used', e.target.value)}
              placeholder="210"
              className="mt-1.5 border-white/10 bg-white/[0.05] text-white"
            />
          </div>
          <div>
            <Label className="text-[12px] text-white/55">Contract ends</Label>
            <Input
              type="date"
              value={form.contract_end_date}
              onChange={(e) => set('contract_end_date', e.target.value)}
              className="mt-1.5 border-white/10 bg-white/[0.05] text-white"
            />
          </div>
          <div className="col-span-2 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div>
              <p className="text-[12.5px] font-medium text-white">
                Owner pays {form.split_percentage}% of this line
              </p>
              <p className="text-[11.5px] text-white/40">Used for the family split</p>
            </div>
            <Input
              type="number"
              inputMode="numeric"
              value={form.split_percentage}
              onChange={(e) => set('split_percentage', e.target.value)}
              className="w-20 border-white/10 bg-white/[0.05] text-center text-white"
            />
          </div>
          <div className="col-span-2 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <p className="text-[12.5px] font-medium text-white">Auto-pay enabled</p>
            <Switch
              checked={form.autopay}
              onCheckedChange={(value) => set('autopay', value)}
              className="data-[state=checked]:bg-white/90 data-[state=unchecked]:bg-white/20"
            />
          </div>
        </div>

        <DialogFooter className="mt-5 gap-2 sm:gap-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-white/60 hover:bg-white/5 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !form.label.trim()}
            className="rounded-full bg-white px-6 text-[#111] hover:bg-white/90"
          >
            {saving ? 'Saving…' : 'Save line'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}