import React, { useState } from "react";
import {
  getListFeesQueryKey,
  getListPaymentsQueryKey,
  getPaymentReceipt,
  useListFees,
  useListLearners,
  useProcessPayment,
  type ProcessPaymentBodyPaymentMethod,
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { openPaymentSlipWindow, printPaymentSlip } from "@/lib/payment-slip";
import { CreditCard, CheckCircle, AlertCircle, Printer } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  paid: "bg-green-100 text-green-700",
  partial: "bg-yellow-100 text-yellow-700",
  unpaid: "bg-red-100 text-red-700",
  overdue: "bg-red-200 text-red-800",
};

function fmt(n: number) { return `R ${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}` }

export default function ParentFees() {
  const { user } = useAuth();
  const { data: allLearners } = useListLearners();
  const myLearners = (allLearners ?? []).filter(l => l.parentId === user?.id);
  const myLearnerIds = myLearners.map(l => l.id);

  const { data: fees, isLoading } = useListFees();
  const myFees = (fees ?? []).filter(f => myLearnerIds.includes(f.learnerId));

  const processPayment = useProcessPayment();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState<(typeof myFees)[0] | null>(null);
  const [form, setForm] = useState({ amount: "", paymentMethod: "cash", cardNumber: "", cardName: "" });
  const [saving, setSaving] = useState(false);

  const openPay = (fee: (typeof myFees)[0]) => {
    setSelectedFee(fee);
    setForm({ amount: (fee.outstandingBalance / 100).toFixed(2), paymentMethod: "cash", cardNumber: "", cardName: "" });
    setOpen(true);
  };

  const handlePay = async () => {
    if (!selectedFee) return;
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) { toast({ title: "Invalid amount", variant: "destructive" }); return; }
    if (Math.round(amount * 100) > selectedFee.outstandingBalance) {
      toast({ title: "Amount is too high", description: "Payment cannot exceed the outstanding balance.", variant: "destructive" });
      return;
    }

    const printWindow = openPaymentSlipWindow();
    setSaving(true);
    try {
      const payment = await processPayment.mutateAsync({
        data: {
          feeId: selectedFee.id,
          learnerId: selectedFee.learnerId,
          amount: Math.round(amount * 100),
          paymentMethod: form.paymentMethod as ProcessPaymentBodyPaymentMethod,
          cardNumber: form.cardNumber || null,
          cardName: form.cardName || null,
        },
      });
      const receipt = await getPaymentReceipt(payment.id);
      const didPrint = printPaymentSlip(receipt, printWindow);

      toast({
        title: "Payment processed successfully",
        description: didPrint ? "Payment slip opened for printing." : "Payment recorded, but the slip window was blocked.",
      });
      queryClient.invalidateQueries({ queryKey: getListFeesQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListPaymentsQueryKey() });
      setOpen(false);
    } catch (e: any) {
      printWindow?.close();
      toast({ title: "Payment failed", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const unpaidTotal = myFees.reduce((s, f) => s + f.outstandingBalance, 0);

  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">School Fees</h1>

      {unpaidTotal > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-orange-500" />
              <div>
                <p className="font-semibold text-orange-800">Outstanding Balance</p>
                <p className="text-2xl font-bold text-orange-600">{fmt(unpaidTotal / 100)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {myLearners.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No learners linked to your account</CardContent></Card>
      ) : myFees.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No fee records found</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {myFees.map(fee => {
            const remaining = fee.outstandingBalance;
            return (
              <Card key={fee.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{fee.description}</p>
                      <p className="text-sm text-muted-foreground">{fee.learnerName} · Term {fee.term} {fee.year}</p>
                      <p className="text-sm text-muted-foreground mt-1">Due: {new Date(fee.dueDate).toLocaleDateString("en-ZA")}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[fee.status] ?? "bg-gray-100"}`}>{fee.status}</span>
                      <p className="text-lg font-bold mt-1">{fmt(fee.totalAmount / 100)}</p>
                      <p className="text-sm text-muted-foreground">Paid: {fmt(fee.amountPaid / 100)}</p>
                    </div>
                  </div>
                  {remaining > 0 && (
                    <div className="mt-4">
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden mb-3">
                        <div className="h-full bg-primary" style={{ width: `${Math.min((fee.amountPaid / fee.totalAmount) * 100, 100)}%` }} />
                      </div>
                      <Button className="w-full" onClick={() => openPay(fee)}>
                        <CreditCard className="mr-2 h-4 w-4" /> Pay {fmt(remaining / 100)}
                      </Button>
                    </div>
                  )}
                  {remaining === 0 && (
                    <div className="mt-3 flex items-center gap-2 text-green-600 text-sm font-medium">
                      <CheckCircle className="h-4 w-4" /> Fully paid
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Make Payment</DialogTitle></DialogHeader>
          {selectedFee && (
            <div className="space-y-4 py-2">
              <div className="bg-muted rounded-lg p-3 text-sm">
                <p className="font-medium">{selectedFee.description}</p>
                <p className="text-muted-foreground">{selectedFee.learnerName} · Outstanding: {fmt(selectedFee.outstandingBalance / 100)}</p>
              </div>
              <div className="space-y-1">
                <Label>Amount (R) *</Label>
                <Input type="number" step="0.01" min="1" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Payment Method</Label>
                <Select value={form.paymentMethod} onValueChange={v => setForm(f => ({ ...f, paymentMethod: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="eft">EFT / Bank Transfer</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="debit_card">Debit Card</SelectItem>
                    <SelectItem value="direct_deposit">Direct Deposit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.paymentMethod === "credit_card" && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label>Card Number</Label>
                    <Input value={form.cardNumber} onChange={e => setForm(f => ({ ...f, cardNumber: e.target.value }))} placeholder="**** **** **** ****" maxLength={16} />
                  </div>
                  <div className="space-y-1">
                    <Label>Name on Card</Label>
                    <Input value={form.cardName} onChange={e => setForm(f => ({ ...f, cardName: e.target.value }))} placeholder="J DLAMINI" />
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handlePay} disabled={saving}>
              {saving ? "Processing..." : <><Printer className="mr-2 h-4 w-4" /> Pay and Print Slip</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
