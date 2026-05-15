import React, { useState } from "react";
import { getPaymentReceipt, useListPayments, useListLearners } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { openPaymentSlipWindow, printPaymentSlip } from "@/lib/payment-slip";
import { CheckCircle, CreditCard, Printer } from "lucide-react";

function fmt(n: number) { return `R ${(n / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}` }
function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-ZA", { dateStyle: "medium" });
}

const METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  eft: "EFT",
  credit_card: "Credit Card",
  debit_card: "Debit Card",
  direct_deposit: "Direct Deposit",
};

export default function ParentPayments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: allLearners } = useListLearners();
  const myLearners = (allLearners ?? []).filter(l => l.parentId === user?.id);
  const myLearnerIds = myLearners.map(l => l.id);

  const { data: payments, isLoading } = useListPayments();
  const myPayments = (payments ?? []).filter(p => myLearnerIds.includes(p.learnerId));
  const [printingId, setPrintingId] = useState<number | null>(null);

  const totalPaid = myPayments.reduce((s, p) => s + p.amount, 0);

  const handlePrintSlip = async (paymentId: number) => {
    const printWindow = openPaymentSlipWindow();
    setPrintingId(paymentId);

    try {
      const receipt = await getPaymentReceipt(paymentId);
      const didPrint = printPaymentSlip(receipt, printWindow);

      if (!didPrint) {
        toast({
          title: "Slip window blocked",
          description: "Allow pop-ups for this app, then try Print Slip again.",
          variant: "destructive",
        });
      }
    } catch (e: any) {
      printWindow?.close();
      toast({ title: "Could not print slip", description: e.message, variant: "destructive" });
    } finally {
      setPrintingId(null);
    }
  };

  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Payment History</h1>

      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <p className="font-semibold text-green-800">Total Paid (All Time)</p>
              <p className="text-2xl font-bold text-green-600">{fmt(totalPaid)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {myPayments.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No payment history yet</CardContent></Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>All Payments</CardTitle></CardHeader>
          <CardContent>
            <div className="divide-y">
              {[...myPayments].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(p => (
                <div key={p.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">{p.referenceNumber}</p>
                      <p className="text-sm text-muted-foreground">{p.learnerName} · {METHOD_LABELS[p.paymentMethod] ?? p.paymentMethod}</p>
                      <p className="text-xs text-muted-foreground">{fmtDate(p.processedAt ?? p.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePrintSlip(p.id)}
                      disabled={printingId === p.id}
                    >
                      <Printer className="mr-2 h-4 w-4" />
                      {printingId === p.id ? "Preparing..." : "Print Slip"}
                    </Button>
                    <div className="text-right">
                    <p className="font-bold text-green-600">{fmt(p.amount)}</p>
                    <p className="text-xs text-muted-foreground capitalize">{p.status}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
