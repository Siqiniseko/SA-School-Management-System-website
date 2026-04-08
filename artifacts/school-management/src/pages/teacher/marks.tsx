import React, { useState } from "react";
import {
  useListMarks, useCreateMark, useDeleteMark,
  useListSubjects, useListLearners, useListClasses,
  getListMarksQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
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
import { Plus, Trash2 } from "lucide-react";

const ASSESSMENT_TYPES = ["test", "exam", "assignment", "classwork", "project", "practical"];

function pctColor(pct: number) {
  if (pct >= 80) return "text-green-600";
  if (pct >= 50) return "text-yellow-600";
  return "text-destructive";
}

export default function TeacherMarks() {
  const { user } = useAuth();
  const { data: subjects } = useListSubjects();
  const { data: classes } = useListClasses();
  const { data: allLearners } = useListLearners();
  const { data: marks, isLoading } = useListMarks();
  const createMark = useCreateMark();
  const deleteMark = useDeleteMark();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mySubjects = subjects?.filter(s => s.teacherId === user?.id) ?? [];

  const blank = { learnerId: "", subjectId: "", assessmentType: "test", assessmentName: "", score: "", maxScore: "100", term: "1" };
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...blank });
  const [saving, setSaving] = useState(false);
  const [filterSubject, setFilterSubject] = useState("all");

  const refresh = () => queryClient.invalidateQueries({ queryKey: getListMarksQueryKey() });

  const mySubjectIds = mySubjects.map(s => s.id);
  const myMarks = marks?.filter(m => mySubjectIds.includes(m.subjectId)) ?? [];
  const filteredMarks = filterSubject === "all" ? myMarks : myMarks.filter(m => m.subjectId === parseInt(filterSubject));

  const handleSave = async () => {
    const score = parseFloat(form.score);
    const maxScore = parseFloat(form.maxScore);
    if (!form.learnerId || !form.subjectId || !form.assessmentName || isNaN(score) || isNaN(maxScore)) {
      toast({ title: "Please fill in all required fields", variant: "destructive" }); return;
    }
    if (score > maxScore) { toast({ title: "Score cannot exceed max score", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const sub = mySubjects.find(s => s.id === parseInt(form.subjectId));
      await createMark.mutateAsync({
        data: {
          learnerId: parseInt(form.learnerId),
          subjectId: parseInt(form.subjectId),
          assessmentType: form.assessmentType as any,
          assessmentName: form.assessmentName,
          score,
          maxScore,
          term: parseInt(form.term),
          grade: sub?.grade ?? null,
          recordedBy: user?.id ?? null,
        },
      });
      toast({ title: "Mark recorded" });
      refresh(); setOpen(false); setForm({ ...blank });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this mark?")) return;
    try {
      await deleteMark.mutateAsync({ id });
      toast({ title: "Mark deleted" }); refresh();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Marks</h1>
        <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" /> Record Mark</Button>
      </div>

      <div className="flex items-center gap-3">
        <Label className="shrink-0">Filter by subject:</Label>
        <Select value={filterSubject} onValueChange={setFilterSubject}>
          <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All my subjects</SelectItem>
            {mySubjects.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Learner</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Assessment</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Term</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>%</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? [1,2,3].map(i => (
                <TableRow key={i}><TableCell colSpan={8}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
              )) : filteredMarks.map(m => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.learnerName}</TableCell>
                  <TableCell>{m.subjectName || `Subject ${m.subjectId}`}</TableCell>
                  <TableCell>{m.assessmentName}</TableCell>
                  <TableCell className="capitalize text-sm text-muted-foreground">{m.assessmentType}</TableCell>
                  <TableCell>Term {m.term}</TableCell>
                  <TableCell>{m.score}/{m.maxScore}</TableCell>
                  <TableCell className={`font-bold ${pctColor(m.percentage)}`}>{m.percentage}%</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(m.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && filteredMarks.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No marks recorded yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Mark</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Subject *</Label>
              <Select value={form.subjectId || "none"} onValueChange={v => setForm(f => ({ ...f, subjectId: v === "none" ? "" : v }))}>
                <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select...</SelectItem>
                  {mySubjects.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name} ({s.grade})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Learner *</Label>
              <Select value={form.learnerId || "none"} onValueChange={v => setForm(f => ({ ...f, learnerId: v === "none" ? "" : v }))}>
                <SelectTrigger><SelectValue placeholder="Select learner" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select...</SelectItem>
                  {allLearners?.map(l => <SelectItem key={l.id} value={l.id.toString()}>{l.fullName} ({l.grade})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Assessment Name *</Label>
              <Input value={form.assessmentName} onChange={e => setForm(f => ({ ...f, assessmentName: e.target.value }))} placeholder="e.g. Term 1 Test 1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Type</Label>
                <Select value={form.assessmentType} onValueChange={v => setForm(f => ({ ...f, assessmentType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ASSESSMENT_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Term *</Label>
                <Select value={form.term} onValueChange={v => setForm(f => ({ ...f, term: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4].map(t => <SelectItem key={t} value={t.toString()}>Term {t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Score *</Label>
                <Input type="number" min="0" value={form.score} onChange={e => setForm(f => ({ ...f, score: e.target.value }))} placeholder="e.g. 75" />
              </div>
              <div className="space-y-1">
                <Label>Out of *</Label>
                <Input type="number" min="1" value={form.maxScore} onChange={e => setForm(f => ({ ...f, maxScore: e.target.value }))} placeholder="e.g. 100" />
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
