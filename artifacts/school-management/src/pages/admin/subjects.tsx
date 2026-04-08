import React, { useState } from "react";
import {
  useListSubjects, useCreateSubject, useUpdateSubject, useDeleteSubject,
  useListUsers, getListSubjectsQueryKey,
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

export default function AdminSubjects() {
  const { data: subjects, isLoading } = useListSubjects();
  const { data: users } = useListUsers();
  const createSubject = useCreateSubject();
  const updateSubject = useUpdateSubject();
  const deleteSubject = useDeleteSubject();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const teachers = users?.filter(u => u.role === "teacher") ?? [];

  const blank = { name: "", code: "", grade: "Gr 10", teacherId: "" };
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...blank });
  const [saving, setSaving] = useState(false);

  const refresh = () => queryClient.invalidateQueries({ queryKey: getListSubjectsQueryKey() });

  const openAdd = () => { setEditId(null); setForm({ ...blank }); setOpen(true); };
  const openEdit = (s: any) => {
    setEditId(s.id);
    setForm({ name: s.name, code: s.code, grade: s.grade, teacherId: s.teacherId?.toString() ?? "" });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.code || !form.grade) { toast({ title: "Name, code and grade are required", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const payload = { name: form.name, code: form.code, grade: form.grade, teacherId: form.teacherId ? parseInt(form.teacherId) : null };
      if (editId) {
        await updateSubject.mutateAsync({ id: editId, data: payload });
        toast({ title: "Subject updated" });
      } else {
        await createSubject.mutateAsync({ data: payload });
        toast({ title: "Subject created" });
      }
      refresh(); setOpen(false);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete subject "${name}"?`)) return;
    try {
      await deleteSubject.mutateAsync({ id });
      toast({ title: "Subject deleted" }); refresh();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Subjects</h1>
        <Button onClick={openAdd}><Plus className="mr-2 h-4 w-4" /> Add Subject</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Teacher</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? [1,2,3].map(i => (
                <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
              )) : subjects?.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="font-mono text-sm">{s.code}</TableCell>
                  <TableCell>{s.grade}</TableCell>
                  <TableCell>{s.teacherName || "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id, s.name)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && subjects?.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No subjects found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Edit Subject" : "Add Subject"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Subject Name *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Mathematics" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Code *</Label>
                <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="e.g. MATH" maxLength={8} />
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
              <Label>Teacher</Label>
              <Select value={form.teacherId || "none"} onValueChange={v => setForm(f => ({ ...f, teacherId: v === "none" ? "" : v }))}>
                <SelectTrigger><SelectValue placeholder="Assign a teacher" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {teachers.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.fullName}</SelectItem>)}
                </SelectContent>
              </Select>
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
