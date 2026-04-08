import React, { useState } from "react";
import { useGetFeeSummary, useListFees, useListPayments } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, DollarSign, Users } from "lucide-react";

function fmt(n: number) { return `R ${(n / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}` }

const TERMS = [1, 2, 3, 4];
const YEARS = [2024, 2025, 2026];

export default function AccountantReports() {
  const [term, setTerm] = useState<string>("all");
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());

  const { data: feeSummary, isLoading: summaryLoading } = useGetFeeSummary();

  const { data: fees, isLoading: feesLoading } = useListFees(
    term === "all" ? {} : { term: parseInt(term) }
  );
  const { data: payments, isLoading: paymentsLoading } = useListPayments();

  const isLoading = summaryLoading || feesLoading || paymentsLoading;

  const filteredFees = fees?.filter(f => f.year === parseInt(year) && (term === "all" || f.term === parseInt(term))) ?? [];
  const totalBilled = filteredFees.reduce((s, f) => s + f.totalAmount, 0);
  const totalPaid = filteredFees.reduce((s, f) => s + f.paidAmount, 0);
  const totalOutstanding = totalBilled - totalPaid;
  const collectionRate = totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 100) : 0;

  const statusBreakdown = filteredFees.reduce((acc, f) => {
    acc[f.status] = (acc[f.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Financial Reports</h1>

      <div className="flex gap-4">
        <div className="space-y-1">
          <Label>Year</Label>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>{YEARS.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Term</Label>
          <Select value={term} onValueChange={setTerm}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Terms</SelectItem>
              {TERMS.map(t => <SelectItem key={t} value={t.toString()}>Term {t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-blue-500" /> Total Billed
                </CardTitle>
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{fmt(totalBilled)}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" /> Collected
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{fmt(totalPaid)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-500" /> Outstanding
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{fmt(totalOutstanding)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-500" /> Collection Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${collectionRate >= 80 ? "text-green-600" : collectionRate >= 60 ? "text-yellow-600" : "text-destructive"}`}>{collectionRate}%</div>
                <div className="mt-2 h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className={`h-full ${collectionRate >= 80 ? "bg-green-500" : collectionRate >= 60 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${collectionRate}%` }} />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Fee Status Breakdown</CardTitle></CardHeader>
              <CardContent>
                {filteredFees.length === 0 ? (
                  <p className="text-center py-6 text-muted-foreground">No data for this period</p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(statusBreakdown).map(([status, count]) => {
                      const pct = Math.round((count / filteredFees.length) * 100);
                      const colors: Record<string, string> = { paid: "bg-green-500", partial: "bg-yellow-500", unpaid: "bg-red-400", overdue: "bg-red-700" };
                      return (
                        <div key={status}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="capitalize font-medium">{status}</span>
                            <span className="text-muted-foreground">{count} records ({pct}%)</span>
                          </div>
                          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                            <div className={`h-full ${colors[status] ?? "bg-gray-400"}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
              <CardContent>
                <div className="divide-y">
                  <div className="flex justify-between py-3">
                    <span className="text-muted-foreground">Total fee records</span>
                    <span className="font-medium">{filteredFees.length}</span>
                  </div>
                  <div className="flex justify-between py-3">
                    <span className="text-muted-foreground">Fully paid</span>
                    <span className="font-medium text-green-600">{statusBreakdown["paid"] ?? 0}</span>
                  </div>
                  <div className="flex justify-between py-3">
                    <span className="text-muted-foreground">Partially paid</span>
                    <span className="font-medium text-yellow-600">{statusBreakdown["partial"] ?? 0}</span>
                  </div>
                  <div className="flex justify-between py-3">
                    <span className="text-muted-foreground">Unpaid</span>
                    <span className="font-medium text-destructive">{statusBreakdown["unpaid"] ?? 0}</span>
                  </div>
                  <div className="flex justify-between py-3">
                    <span className="text-muted-foreground">Overdue</span>
                    <span className="font-medium text-destructive">{statusBreakdown["overdue"] ?? 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
