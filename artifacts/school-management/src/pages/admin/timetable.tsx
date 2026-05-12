import React, { useState } from "react";
import {
  useListTimetableEntries, useCreateTimetableEntry, useDeleteTimetableEntry,
  useListClasses, useListSubjects, useListUsers, getListTimetableEntriesQueryKey,
  TimetableEntry,
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
import { Plus, Trash2 } from "lucide-react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export default function AdminTimetable() {
  const { data: entries, isLoading } = useListTimetableEntries();
  const { data: classes } = useListClasses();
  const { data: subjects } = useListSubjects();
  const { data: users } = useListUsers();
  const createEntry = useCreateTimetableEntry();
  const deleteEntry = useDeleteTimetableEntry();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const teachers = (users ?? []).filter(u => u.role === "teacher");

  const blank = { classId: "", subjectId: "", teacherId: "", dayOfWeek: "Monday", startTime: "07:30", endTime: "08:30", room: "" };
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...blank });
  const [saving, setSaving] = useState(false);

  const refresh = () => queryClient.invalidateQueries({ queryKey: getListTimetableEntriesQueryKey() });

  const handleSave = async () => {
    if (!form.classId || !form.subjectId || !form.dayOfWeek || !form.startTime || !form.endTime) {
      toast({ title: "Class, subject, day and times are required", variant: "destructive" }); return;
    }
    setSaving(true);
    try {
      await createEntry.mutateAsync({
        data: {
          classId: parseInt(form.classId),
          subjectId: parseInt(form.subjectId),
          teacherId: form.teacherId ? parseInt(form.teacherId) : null,
          dayOfWeek: form.dayOfWeek as any,
          startTime: form.startTime,
          endTime: form.endTime,
          room: form.room || null,
        },
      });
      toast({ title: "Timetable entry added" });
      refresh(); setOpen(false); setForm({ ...blank });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Remove this timetable entry?")) return;
    try {
      await deleteEntry.mutateAsync({ id });
      toast({ title: "Entry removed" }); refresh();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const grouped: Record<string, TimetableEntry[]> = DAYS.reduce((acc, day) => {
    acc[day] = (entries ?? []).filter(e => e.dayOfWeek === day);
    return acc;
  }, {} as Record<string, TimetableEntry[]>);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Timetable</h1>
        <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Entry</Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : (
        DAYS.map(day => (
          <div key={day}>
            <h2 className="text-lg font-semibold mb-2 text-muted-foreground">{day}</h2>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Teacher</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grouped[day].length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-4 text-muted-foreground text-sm">No entries for {day}</TableCell></TableRow>
                    ) : [...grouped[day]].sort((a, b) => a.startTime.localeCompare(b.startTime)).map(e => (
                      <TableRow key={e.id}>
                        <TableCell className="font-mono text-sm">{e.startTime} – {e.endTime}</TableCell>
                        <TableCell>{e.className ?? `Class ${e.classId}`}</TableCell>
                        <TableCell>{e.subjectName ?? `Subject ${e.subjectId}`}</TableCell>
                        <TableCell>{e.teacherName ?? "—"}</TableCell>
                        <TableCell>{e.room ?? "—"}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(e.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        ))
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Timetable Entry</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Class *</Label>
                <Select value={form.classId || "none"} onValueChange={v => setForm(f => ({ ...f, classId: v === "none" ? "" : v }))}>
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select...</SelectItem>
                    {(classes ?? []).map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Subject *</Label>
                <Select value={form.subjectId || "none"} onValueChange={v => setForm(f => ({ ...f, subjectId: v === "none" ? "" : v }))}>
                  <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select...</SelectItem>
                    {(subjects ?? []).map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Day *</Label>
                <Select value={form.dayOfWeek} onValueChange={v => setForm(f => ({ ...f, dayOfWeek: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Teacher</Label>
                <Select value={form.teacherId || "none"} onValueChange={v => setForm(f => ({ ...f, teacherId: v === "none" ? "" : v }))}>
                  <SelectTrigger><SelectValue placeholder="Assign teacher" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {teachers.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.fullName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Start Time *</Label>
                <Input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>End Time *</Label>
                <Input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Room</Label>
              <Input value={form.room} onChange={e => setForm(f => ({ ...f, room: e.target.value }))} placeholder="e.g. Room 101" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
