import React, { useState } from "react";
import {
  useListMaterials, useCreateMaterial, useDeleteMaterial,
  useListSubjects, useListClasses, getListMaterialsQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, FileText, BookOpen, ClipboardList, Link } from "lucide-react";

const MATERIAL_TYPES = ["notes", "assignment", "textbook", "worksheet", "video", "other"];
const TYPE_ICONS: Record<string, React.ElementType> = { notes: FileText, assignment: ClipboardList, textbook: BookOpen };

const TYPE_COLORS: Record<string, string> = {
  notes: "bg-blue-100 text-blue-700",
  assignment: "bg-orange-100 text-orange-700",
  textbook: "bg-purple-100 text-purple-700",
  worksheet: "bg-green-100 text-green-700",
  video: "bg-red-100 text-red-700",
  other: "bg-gray-100 text-gray-700",
};

export default function TeacherMaterials() {
  const { user } = useAuth();
  const { data: materials, isLoading } = useListMaterials();
  const { data: subjects } = useListSubjects();
  const { data: classes } = useListClasses();
  const createMaterial = useCreateMaterial();
  const deleteMaterial = useDeleteMaterial();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mySubjects = subjects?.filter(s => s.teacherId === user?.id) ?? [];
  const myMaterials = materials?.filter(m => m.uploadedBy === user?.id) ?? [];

  const blank = { title: "", description: "", type: "notes", subjectId: "", classId: "", grade: "", fileUrl: "" };
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...blank });
  const [saving, setSaving] = useState(false);

  const refresh = () => queryClient.invalidateQueries({ queryKey: getListMaterialsQueryKey() });

  const handleSave = async () => {
    if (!form.title || !form.type) { toast({ title: "Title and type are required", variant: "destructive" }); return; }
    setSaving(true);
    try {
      await createMaterial.mutateAsync({
        data: {
          title: form.title,
          description: form.description || null,
          type: form.type as any,
          subjectId: form.subjectId ? parseInt(form.subjectId) : null,
          classId: form.classId ? parseInt(form.classId) : null,
          grade: form.grade || null,
          fileUrl: form.fileUrl || null,
          uploadedBy: user?.id ?? null,
        },
      });
      toast({ title: "Material uploaded" });
      refresh(); setOpen(false); setForm({ ...blank });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this material?")) return;
    try {
      await deleteMaterial.mutateAsync({ id });
      toast({ title: "Material deleted" }); refresh();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Learning Materials</h1>
        <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" /> Upload Material</Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>
      ) : myMaterials.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No materials uploaded yet</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {myMaterials.map(m => {
            const Icon = TYPE_ICONS[m.type] ?? FileText;
            return (
              <Card key={m.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Icon className="h-4 w-4 text-primary" />
                      {m.title}
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(m.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {m.description && <p className="text-sm text-muted-foreground mb-2">{m.description}</p>}
                  <div className="flex flex-wrap gap-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${TYPE_COLORS[m.type] ?? "bg-gray-100 text-gray-700"}`}>{m.type}</span>
                    {m.grade && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{m.grade}</span>}
                    {m.subjectName && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{m.subjectName}</span>}
                  </div>
                  {m.fileUrl && (
                    <a href={m.fileUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                      <Link className="h-3 w-3" /> View resource
                    </a>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Upload Learning Material</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Title *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Chapter 4 Notes" />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Type *</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{MATERIAL_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Subject</Label>
                <Select value={form.subjectId || "none"} onValueChange={v => setForm(f => ({ ...f, subjectId: v === "none" ? "" : v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {mySubjects.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Class</Label>
                <Select value={form.classId || "none"} onValueChange={v => setForm(f => ({ ...f, classId: v === "none" ? "" : v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {classes?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Resource URL (optional)</Label>
              <Input value={form.fileUrl} onChange={e => setForm(f => ({ ...f, fileUrl: e.target.value }))} placeholder="https://..." type="url" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Upload"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
