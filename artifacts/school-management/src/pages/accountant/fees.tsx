import React, { useState } from "react";
import {
  useListFees, useCreateFeeRecord, useUpdateFeeRecord, useDeleteFeeRecord,
  useListLearners, getListFeesQueryKey,
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
import { Plus, Pencil, Trash2 } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  paid: "bg-green-100 text-green-700",
  partial: "bg-yellow-100 text-yellow-700",
  unpaid: "bg-red-100 text-red-700",
  overdue: "bg-red-200 text-red-800",
};
function fmt(n: number) { return `R ${(n / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}` }

const blank = { learnerId: "", description: "", totalAmount: "", dueDate: "", term: "1", year: new Date().getFullYear().toString() };

export default function AccountantFees() {
  const { data: fees, isLoading } = useListFees();
  const { data: learners } = useListLearners();
  const createFee = useCreateFeeRecord();
  const updateFee = useUpdateFeeRecord();
  const deleteFee = useDeleteFeeRecord();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...blank });
  const [saving, setSaving] = useState(false);

  const refresh = () => queryClient.invalidateQueries({ queryKey: getListFeesQueryKey() });

  const openAdd = () => { setEditId(null); setForm({ ...blank }); setOpen(true); };
  const openEdit = (f: any) => {
    setEditId(f.id);
    setForm({ learnerId: f.learnerId.toString(), description: f.description, totalAmount: (f.totalAmount / 100).toFixed(2), dueDate: f.dueDate.split("T")[0], term: f.term.toString(), year: f.year.toString() });
    setOpen(true);
  };

  const handleSave = async () => {
    const total = Math.round(parseFloat(form.totalAmount) * 100);
    if (!form.learnerId || !form.description || isNaN(total) || !form.dueDate) {
      toast({ title: "All fields are required", variant: "destructive" }); return;
    }
    setSaving(true);
    try {
      if (editId) {
        await updateFee.mutateAsync({ id: editId, data: { description: form.description, totalAmount: total, dueDate: form.dueDate } });
        toast({ title: "Fee record updated" });
      } else {
        await createFee.mutateAsync({ data: { learnerId: parseInt(form.learnerId), description: form.description, totalAmount: total, dueDate: form.dueDate, term: parseInt(form.term), year: parseInt(form.year) } });
        toast({ title: "Fee record created" });
      }
      refresh(); setOpen(false);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this fee record?")) return;
    try {
      await deleteFee.mutateAsync({ id });
      toast({ title: "Fee record deleted" }); refresh();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const totalOutstanding = fees?.reduce((s, f) => s + f.outstandingBalance, 0) ?? 0;
  const totalCollected = fees?.reduce((s, f) => s + f.amountPaid, 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Fee Records</h1>
        <Button onClick={openAdd}><Plus className="mr-2 h-4 w-4" /> Add Fee Record</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="pt-6">
          <p className="text-sm font-medium text-muted-foreground">Total Billed</p>
          <p className="text-2xl font-bold">{fmt(fees?.reduce((s, f) => s + f.totalAmount, 0) ?? 0)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-sm font-medium text-muted-foreground">Collected</p>
          <p className="text-2xl font-bold text-green-600">{fmt(totalCollected)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-sm font-medium text-muted-foreground">Outstanding</p>
          <p className="text-2xl font-bold text-destructive">{fmt(totalOutstanding)}</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Learner</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Term/Year</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? [1,2,3].map(i => (
                <TableRow key={i}><TableCell colSpan={8}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
              )) : fees?.map(f => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">{f.learnerName}</TableCell>
                  <TableCell>{f.description}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">T{f.term} {f.year}</TableCell>
                  <TableCell>{fmt(f.totalAmount)}</TableCell>
                  <TableCell>{fmt(f.amountPaid)}</TableCell>
                  <TableCell><span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[f.status] ?? "bg-gray-100"}`}>{f.status}</span></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(f.dueDate).toLocaleDateString("en-ZA")}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(f)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(f.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && fees?.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No fee records</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Edit Fee Record" : "Add Fee Record"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            {!editId && (
              <div className="space-y-1">
                <Label>Learner *</Label>
                <Select value={form.learnerId || "none"} onValueChange={v => setForm(f => ({ ...f, learnerId: v === "none" ? "" : v }))}>
                  <SelectTrigger><SelectValue placeholder="Select learner" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select...</SelectItem>
                    {learners?.map(l => <SelectItem key={l.id} value={l.id.toString()}>{l.fullName} ({l.grade})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1">
              <Label>Description *</Label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="e.g. Term 1 School Fees 2025" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Total Amount (R) *</Label>
                <Input type="number" step="0.01" min="0" value={form.totalAmount} onChange={e => setForm(f => ({ ...f, totalAmount: e.target.value }))} placeholder="5000.00" />
              </div>
              <div className="space-y-1">
                <Label>Due Date *</Label>
                <Input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Term</Label>
                <Select value={form.term} onValueChange={v => setForm(f => ({ ...f, term: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{[1,2,3,4].map(t => <SelectItem key={t} value={t.toString()}>Term {t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Year</Label>
                <Input type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} min="2020" max="2030" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
