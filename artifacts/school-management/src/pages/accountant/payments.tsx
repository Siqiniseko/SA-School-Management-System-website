import React, { useState } from "react";
import {
  useListPayments, useProcessPayment, useListFees, useListLearners,
  getListPaymentsQueryKey, getListFeesQueryKey,
} from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, CreditCard } from "lucide-react";

function fmt(n: number) { return `R ${(n / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}` }

const METHOD_LABELS: Record<string, string> = { cash: "Cash", eft: "EFT", card: "Card", debit_order: "Debit Order" };

export default function AccountantPayments() {
  const { data: payments, isLoading } = useListPayments();
  const { data: fees } = useListFees();
  const { data: learners } = useListLearners();
  const processPayment = useProcessPayment();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const unpaidFees = fees?.filter(f => f.status !== "paid") ?? [];

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ feeId: "", learnerId: "", amount: "", paymentMethod: "cash", cardNumber: "", cardName: "" });
  const [saving, setSaving] = useState(false);

  const selectedFee = unpaidFees.find(f => f.id.toString() === form.feeId);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: getListPaymentsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListFeesQueryKey() });
  };

  const handleFeeSelect = (feeId: string) => {
    const fee = unpaidFees.find(f => f.id.toString() === feeId);
    setForm(f => ({ ...f, feeId, learnerId: fee?.learnerId.toString() ?? "", amount: fee ? ((fee.totalAmount - fee.paidAmount) / 100).toFixed(2) : "" }));
  };

  const handleSave = async () => {
    const amount = Math.round(parseFloat(form.amount) * 100);
    if (!form.feeId || !form.learnerId || isNaN(amount) || amount <= 0) {
      toast({ title: "Please fill in all required fields", variant: "destructive" }); return;
    }
    setSaving(true);
    try {
      await processPayment.mutateAsync({
        data: { feeId: parseInt(form.feeId), learnerId: parseInt(form.learnerId), amount, paymentMethod: form.paymentMethod as any, cardNumber: form.cardNumber || null, cardName: form.cardName || null },
      });
      toast({ title: "Payment processed" });
      refresh(); setOpen(false);
      setForm({ feeId: "", learnerId: "", amount: "", paymentMethod: "cash", cardNumber: "", cardName: "" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const total = payments?.reduce((s, p) => s + p.amount, 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Payments</h1>
        <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" /> Record Payment</Button>
      </div>

      <Card>
        <CardContent className="pt-6 flex items-center gap-3">
          <CreditCard className="h-8 w-8 text-green-500" />
          <div>
            <p className="text-sm text-muted-foreground">Total Collected</p>
            <p className="text-2xl font-bold text-green-600">{fmt(total)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Learner</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? [1,2,3].map(i => (
                <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
              )) : [...(payments ?? [])].sort((a,b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()).map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-sm">{p.referenceNumber}</TableCell>
                  <TableCell className="font-medium">{p.learnerName}</TableCell>
                  <TableCell className="font-bold text-green-600">{fmt(p.amount)}</TableCell>
                  <TableCell>{METHOD_LABELS[p.paymentMethod] ?? p.paymentMethod}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(p.paymentDate).toLocaleDateString("en-ZA", { dateStyle: "medium" })}</TableCell>
                  <TableCell><span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 capitalize">{p.status}</span></TableCell>
                </TableRow>
              ))}
              {!isLoading && payments?.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No payments recorded</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Fee Record *</Label>
              <Select value={form.feeId || "none"} onValueChange={v => handleFeeSelect(v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Select fee" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select...</SelectItem>
                  {unpaidFees.map(f => (
                    <SelectItem key={f.id} value={f.id.toString()}>
                      {f.learnerName} – {f.description} ({fmt(f.totalAmount - f.paidAmount)} due)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedFee && (
              <div className="bg-muted rounded-lg p-3 text-sm">
                <p className="font-medium">{selectedFee.learnerName}</p>
                <p className="text-muted-foreground">Outstanding: {fmt(selectedFee.totalAmount - selectedFee.paidAmount)}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Amount (R) *</Label>
                <Input type="number" step="0.01" min="1" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Method</Label>
                <Select value={form.paymentMethod} onValueChange={v => setForm(f => ({ ...f, paymentMethod: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="eft">EFT</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="debit_order">Debit Order</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.paymentMethod === "card" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Card Number</Label>
                  <Input value={form.cardNumber} onChange={e => setForm(f => ({ ...f, cardNumber: e.target.value }))} maxLength={16} />
                </div>
                <div className="space-y-1">
                  <Label>Name on Card</Label>
                  <Input value={form.cardName} onChange={e => setForm(f => ({ ...f, cardName: e.target.value }))} />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Processing..." : "Record Payment"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
