import React, { useState } from "react";
import {
  getListMaterialsQueryKey,
  useCreateMaterial,
  useDeleteMaterial,
  useListClasses,
  useListMaterials,
  useListSubjects,
  type CreateMaterialBodyType,
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { apiUrl } from "@/lib/api-url";
import { uploadFile } from "@/lib/uploads";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ExternalLink, FileUp, Plus, Trash2 } from "lucide-react";

const blankRecord = {
  title: "",
  description: "",
  subjectId: "",
  classId: "",
  grade: "",
  fileUrl: "",
};

function fmtDate(value: string) {
  return new Date(value).toLocaleDateString("en-ZA", { dateStyle: "medium" });
}

export default function TeacherRecords() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMaterial = useCreateMaterial();
  const deleteMaterial = useDeleteMaterial();

  const { data: materials, isLoading } = useListMaterials();
  const { data: subjects } = useListSubjects();
  const { data: classes } = useListClasses();

  const mySubjects = subjects?.filter((subject) => subject.teacherId === user?.id) ?? [];
  const myRecords = (materials ?? []).filter(
    (material) => material.uploadedBy === user?.id && material.type === "record",
  );

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...blankRecord });
  const [recordFile, setRecordFile] = useState<File | null>(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: getListMaterialsQueryKey() });

  const handleRecordFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      setRecordFile(null);
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      toast({ title: "Record file must be 8MB or smaller", variant: "destructive" });
      event.target.value = "";
      return;
    }

    setRecordFile(file);
  };

  const handleSave = async () => {
    if (!form.title.trim() || (!recordFile && !form.fileUrl.trim())) {
      toast({ title: "Record title and a file are required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      let fileUrl = form.fileUrl.trim();
      if (recordFile) {
        const uploaded = await uploadFile(recordFile, "records");
        fileUrl = uploaded.url;
      }

      await createMaterial.mutateAsync({
        data: {
          title: form.title.trim(),
          description: form.description.trim() || null,
          type: "record" as CreateMaterialBodyType,
          subjectId: form.subjectId ? Number(form.subjectId) : null,
          classId: form.classId ? Number(form.classId) : null,
          grade: form.grade.trim() || null,
          fileUrl,
          uploadedBy: user?.id ?? null,
        },
      });

      toast({ title: "Record uploaded" });
      await refresh();
      setOpen(false);
      setForm({ ...blankRecord });
      setRecordFile(null);
    } catch (e: any) {
      toast({ title: "Could not upload record", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this record?")) return;

    try {
      await deleteMaterial.mutateAsync({ id });
      toast({ title: "Record deleted" });
      await refresh();
    } catch (e: any) {
      toast({ title: "Could not delete record", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Records</h1>
          <p className="text-muted-foreground">Upload class records, registers, reports, and evidence files.</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Upload Record
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-36 rounded-xl" />)}
        </div>
      ) : myRecords.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">No records uploaded yet</CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {myRecords.map((record) => (
            <Card key={record.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileUp className="h-4 w-4 text-primary" />
                    {record.title}
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(record.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {record.description && <p className="text-sm text-muted-foreground">{record.description}</p>}
                <div className="flex flex-wrap gap-2 text-xs">
                  {record.subjectName && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-700">{record.subjectName}</span>}
                  {record.grade && <span className="rounded-full bg-green-100 px-2 py-0.5 text-green-700">{record.grade}</span>}
                  <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">{fmtDate(record.createdAt)}</span>
                </div>
                {record.fileUrl && (
                  <a href={apiUrl(record.fileUrl)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                    <ExternalLink className="h-4 w-4" />
                    Open record
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Record</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Record Title *</Label>
              <Input value={form.title} onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))} placeholder="e.g. Grade 10A Term 2 Register" />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea rows={2} value={form.description} onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Subject</Label>
                <Select value={form.subjectId || "none"} onValueChange={(value) => setForm((current) => ({ ...current, subjectId: value === "none" ? "" : value }))}>
                  <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {mySubjects.map((subject) => <SelectItem key={subject.id} value={subject.id.toString()}>{subject.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Class</Label>
                <Select value={form.classId || "none"} onValueChange={(value) => setForm((current) => ({ ...current, classId: value === "none" ? "" : value }))}>
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {classes?.map((cls) => <SelectItem key={cls.id} value={cls.id.toString()}>{cls.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Grade</Label>
              <Input value={form.grade} onChange={(e) => setForm((current) => ({ ...current, grade: e.target.value }))} placeholder="e.g. Gr 10" />
            </div>
            <div className="space-y-1">
              <Label>Record File *</Label>
              <Input
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.webp"
                onChange={handleRecordFileChange}
              />
              {recordFile && <p className="text-xs text-muted-foreground">Selected: {recordFile.name}</p>}
            </div>
            <div className="space-y-1">
              <Label>External File URL</Label>
              <Input type="url" value={form.fileUrl} onChange={(e) => setForm((current) => ({ ...current, fileUrl: e.target.value }))} placeholder="https://..." />
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
