import React, { useEffect, useState } from "react";
import { useListClasses, useListSubjects } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { CalendarClock, ExternalLink, Plus, Video } from "lucide-react";

type VirtualClass = {
  id: number;
  title: string;
  description: string | null;
  teacherId: number;
  teacherName: string | null;
  classId: number | null;
  className: string | null;
  subjectId: number | null;
  subjectName: string | null;
  meetingUrl: string;
  scheduledAt: string;
  durationMinutes: number;
  status: "scheduled" | "live" | "completed" | "cancelled";
  createdAt: string;
};

const blankClass = {
  title: "",
  description: "",
  classId: "",
  subjectId: "",
  meetingUrl: "",
  scheduledAt: "",
  durationMinutes: "45",
};

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700",
  live: "bg-green-100 text-green-700",
  completed: "bg-gray-100 text-gray-700",
  cancelled: "bg-red-100 text-red-700",
};

function fmtDate(value: string) {
  return new Date(value).toLocaleString("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? `Request failed with status ${response.status}`);
  }

  if (response.status === 204) return null as T;
  return response.json();
}

export default function TeacherVirtualClasses() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: subjects } = useListSubjects();
  const { data: classes } = useListClasses();

  const [virtualClasses, setVirtualClasses] = useState<VirtualClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...blankClass });

  const mySubjects = subjects?.filter((subject) => subject.teacherId === user?.id) ?? [];

  const loadVirtualClasses = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const data = await api<VirtualClass[]>(`/api/virtual-classes?teacherId=${user.id}`);
      setVirtualClasses(data);
    } catch (e: any) {
      toast({ title: "Could not load virtual classes", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadVirtualClasses();
  }, [user?.id]);

  const handleCreate = async () => {
    if (!user?.id) return;
    if (!form.title.trim() || !form.meetingUrl.trim() || !form.scheduledAt) {
      toast({ title: "Title, meeting link and date are required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      await api<VirtualClass>("/api/virtual-classes", {
        method: "POST",
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim() || null,
          teacherId: user.id,
          classId: form.classId ? Number(form.classId) : null,
          subjectId: form.subjectId ? Number(form.subjectId) : null,
          meetingUrl: form.meetingUrl.trim(),
          scheduledAt: new Date(form.scheduledAt).toISOString(),
          durationMinutes: Number(form.durationMinutes) || 45,
        }),
      });

      toast({ title: "Virtual class scheduled" });
      setOpen(false);
      setForm({ ...blankClass });
      await loadVirtualClasses();
    } catch (e: any) {
      toast({ title: "Could not schedule class", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (virtualClass: VirtualClass, status: VirtualClass["status"]) => {
    try {
      const updated = await api<VirtualClass>(`/api/virtual-classes/${virtualClass.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setVirtualClasses((current) => current.map((item) => item.id === updated.id ? updated : item));

      if (status === "live") {
        window.open(virtualClass.meetingUrl, "_blank", "noopener,noreferrer");
      }
    } catch (e: any) {
      toast({ title: "Could not update class", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Virtual Classes</h1>
          <p className="text-muted-foreground">Schedule online classes and launch meeting links for learners.</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Virtual Class
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-44 rounded-xl" />)}
        </div>
      ) : virtualClasses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">No virtual classes scheduled yet</CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {virtualClasses
            .slice()
            .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
            .map((virtualClass) => (
              <Card key={virtualClass.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Video className="h-4 w-4 text-primary" />
                      {virtualClass.title}
                    </CardTitle>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${STATUS_COLORS[virtualClass.status]}`}>
                      {virtualClass.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {virtualClass.description && <p className="text-sm text-muted-foreground">{virtualClass.description}</p>}
                  <div className="space-y-1 text-sm">
                    <p className="flex items-center gap-2">
                      <CalendarClock className="h-4 w-4 text-muted-foreground" />
                      {fmtDate(virtualClass.scheduledAt)} · {virtualClass.durationMinutes} min
                    </p>
                    <p className="text-muted-foreground">
                      {[virtualClass.className, virtualClass.subjectName].filter(Boolean).join(" · ") || "General class"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => updateStatus(virtualClass, "live")} disabled={virtualClass.status === "completed"}>
                      <Video className="mr-2 h-4 w-4" />
                      Start Class
                    </Button>
                    <Button variant="outline" asChild>
                      <a href={virtualClass.meetingUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open Link
                      </a>
                    </Button>
                    {virtualClass.status !== "completed" && (
                      <Button variant="ghost" onClick={() => updateStatus(virtualClass, "completed")}>
                        Complete
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Virtual Class</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))} placeholder="e.g. Mathematics revision" />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea rows={2} value={form.description} onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Class</Label>
                <Select value={form.classId || "none"} onValueChange={(value) => setForm((current) => ({ ...current, classId: value === "none" ? "" : value }))}>
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">General</SelectItem>
                    {classes?.map((cls) => <SelectItem key={cls.id} value={cls.id.toString()}>{cls.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Subject</Label>
                <Select value={form.subjectId || "none"} onValueChange={(value) => setForm((current) => ({ ...current, subjectId: value === "none" ? "" : value }))}>
                  <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">General</SelectItem>
                    {mySubjects.map((subject) => <SelectItem key={subject.id} value={subject.id.toString()}>{subject.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
              <div className="space-y-1">
                <Label>Date and Time *</Label>
                <Input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm((current) => ({ ...current, scheduledAt: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Minutes</Label>
                <Input type="number" min="1" value={form.durationMinutes} onChange={(e) => setForm((current) => ({ ...current, durationMinutes: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Meeting Link *</Label>
              <Input type="url" value={form.meetingUrl} onChange={(e) => setForm((current) => ({ ...current, meetingUrl: e.target.value }))} placeholder="https://meet.google.com/..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving ? "Saving..." : "Schedule"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
