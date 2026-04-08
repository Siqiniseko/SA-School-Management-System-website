import React, { useState } from "react";
import {
  useListLearners, useCreateLearner, useUpdateLearner, useDeleteLearner,
  useListClasses, useListUsers,
  getListLearnersQueryKey,
} from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Pencil } from "lucide-react";

const SA_GRADES = ["Gr R","Gr 1","Gr 2","Gr 3","Gr 4","Gr 5","Gr 6","Gr 7","Gr 8","Gr 9","Gr 10","Gr 11","Gr 12"];

export default function AdminLearners() {
  const { data: learners, isLoading } = useListLearners();
  const { data: classes } = useListClasses();
  const { data: users } = useListUsers();
  const createLearner = useCreateLearner();
  const updateLearner = useUpdateLearner();
  const deleteLearner = useDeleteLearner();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const parents = users?.filter(u => u.role === "parent") ?? [];

  const blank = { admissionNumber: "", fullName: "", grade: "Gr 10", classId: "", parentId: "", dateOfBirth: "", gender: "" };
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...blank });
  const [saving, setSaving] = useState(false);

  const refresh = () => queryClient.invalidateQueries({ queryKey: getListLearnersQueryKey() });

  const openAdd = () => { setEditId(null); setForm({ ...blank }); setOpen(true); };
  const openEdit = (l: any) => {
    setEditId(l.id);
    setForm({ admissionNumber: l.admissionNumber, fullName: l.fullName, grade: l.grade, classId: l.classId?.toString() ?? "", parentId: l.parentId?.toString() ?? "", dateOfBirth: l.dateOfBirth ?? "", gender: l.gender ?? "" });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.admissionNumber || !form.fullName || !form.grade) {
      toast({ title: "Please fill in required fields", variant: "destructive" }); return;
    }
    setSaving(true);
    try {
      const payload = { admissionNumber: form.admissionNumber, fullName: form.fullName, grade: form.grade, classId: form.classId ? parseInt(form.classId) : null, parentId: form.parentId ? parseInt(form.parentId) : null, dateOfBirth: form.dateOfBirth || null, gender: form.gender || null };
      if (editId) {
        await updateLearner.mutateAsync({ id: editId, data: payload });
        toast({ title: "Learner updated" });
      } else {
        await createLearner.mutateAsync({ data: payload });
        toast({ title: "Learner added" });
      }
      refresh(); setOpen(false);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete learner "${name}"?`)) return;
    try {
      await deleteLearner.mutateAsync({ id });
      toast({ title: "Learner deleted" }); refresh();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Learners</h1>
        <Button onClick={openAdd}><Plus className="mr-2 h-4 w-4" /> Add Learner</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admission No</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? [1,2,3].map(i => (
                <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
              )) : learners?.map(l => (
                <TableRow key={l.id}>
                  <TableCell className="font-mono text-sm">{l.admissionNumber}</TableCell>
                  <TableCell className="font-medium">{l.fullName}</TableCell>
                  <TableCell>{l.grade}</TableCell>
                  <TableCell>{l.className || "—"}</TableCell>
                  <TableCell>{l.gender || "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(l)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(l.id, l.fullName)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && learners?.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No learners found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Learner" : "Add Learner"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Admission Number *</Label>
                <Input value={form.admissionNumber} onChange={e => setForm(f => ({ ...f, admissionNumber: e.target.value }))} placeholder="RA-2024-006" />
              </div>
              <div className="space-y-1">
                <Label>Grade *</Label>
                <Select value={form.grade} onValueChange={v => setForm(f => ({ ...f, grade: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SA_GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Full Name *</Label>
              <Input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} placeholder="e.g. Kago Sithole" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Class</Label>
                <Select value={form.classId || "none"} onValueChange={v => setForm(f => ({ ...f, classId: v === "none" ? "" : v }))}>
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {classes?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Gender</Label>
                <Select value={form.gender || "none"} onValueChange={v => setForm(f => ({ ...f, gender: v === "none" ? "" : v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not specified</SelectItem>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Parent / Guardian</Label>
                <Select value={form.parentId || "none"} onValueChange={v => setForm(f => ({ ...f, parentId: v === "none" ? "" : v }))}>
                  <SelectTrigger><SelectValue placeholder="Select parent" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {parents.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.fullName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Date of Birth</Label>
                <Input type="date" value={form.dateOfBirth} onChange={e => setForm(f => ({ ...f, dateOfBirth: e.target.value }))} />
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
