import React, { useState } from "react";
import {
  useListAttendance, useRecordAttendance, useListClasses, useListLearners,
  getListAttendanceQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle, XCircle, Clock, Save } from "lucide-react";

const STATUS_OPTS = [
  { value: "present", label: "Present", color: "bg-green-100 text-green-700", icon: CheckCircle },
  { value: "absent", label: "Absent", color: "bg-red-100 text-red-700", icon: XCircle },
  { value: "late", label: "Late", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  { value: "excused", label: "Excused", color: "bg-blue-100 text-blue-700", icon: CheckCircle },
];

export default function TeacherAttendance() {
  const { user } = useAuth();
  const { data: classes } = useListClasses();
  const { data: allLearners } = useListLearners();
  const recordAttendance = useRecordAttendance();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const myClasses = classes?.filter(c => c.teacherId === user?.id) ?? [];

  const today = new Date().toISOString().split("T")[0];
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [date, setDate] = useState(today);
  const [statuses, setStatuses] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);

  const classLearners = allLearners?.filter(l => l.classId === parseInt(selectedClass)) ?? [];

  const setStatus = (learnerId: number, status: string) =>
    setStatuses(prev => ({ ...prev, [learnerId]: status }));

  const handleSave = async () => {
    if (!selectedClass) { toast({ title: "Please select a class", variant: "destructive" }); return; }
    if (classLearners.length === 0) { toast({ title: "No learners in this class", variant: "destructive" }); return; }
    setSaving(true);
    let errors = 0;
    for (const learner of classLearners) {
      const status = statuses[learner.id] ?? "present";
      try {
        await recordAttendance.mutateAsync({
          data: { learnerId: learner.id, classId: parseInt(selectedClass), date, status: status as any },
        });
      } catch { errors++; }
    }
    setSaving(false);
    if (errors > 0) {
      toast({ title: `Saved with ${errors} errors (some may already be recorded)`, variant: "destructive" });
    } else {
      toast({ title: `Attendance saved for ${classLearners.length} learners` });
    }
    queryClient.invalidateQueries({ queryKey: getListAttendanceQueryKey() });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Record Attendance</h1>

      <Card>
        <CardHeader><CardTitle>Select Class & Date</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Class</Label>
            <Select value={selectedClass || "none"} onValueChange={v => { setSelectedClass(v === "none" ? "" : v); setStatuses({}); }}>
              <SelectTrigger><SelectValue placeholder="Select a class" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select class...</SelectItem>
                {myClasses.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name} – {c.grade}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} max={today} />
          </div>
        </CardContent>
      </Card>

      {selectedClass && classLearners.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Learners ({classLearners.length})</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { const s: any = {}; classLearners.forEach(l => s[l.id] = "present"); setStatuses(s); }}>All Present</Button>
                <Button variant="outline" size="sm" onClick={() => { const s: any = {}; classLearners.forEach(l => s[l.id] = "absent"); setStatuses(s); }}>All Absent</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {classLearners.map(learner => {
              const status = statuses[learner.id] ?? "present";
              const opt = STATUS_OPTS.find(o => o.value === status)!;
              return (
                <div key={learner.id} className="flex items-center justify-between border rounded-lg p-3">
                  <div>
                    <p className="font-medium">{learner.fullName}</p>
                    <p className="text-sm text-muted-foreground">{learner.admissionNumber}</p>
                  </div>
                  <div className="flex gap-2">
                    {STATUS_OPTS.map(o => (
                      <button
                        key={o.value}
                        onClick={() => setStatus(learner.id, o.value)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${status === o.value ? o.color + " ring-2 ring-offset-1 ring-current" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
            <Button className="w-full mt-4" onClick={handleSave} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />{saving ? "Saving..." : "Save Attendance"}
            </Button>
          </CardContent>
        </Card>
      )}

      {selectedClass && classLearners.length === 0 && (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No learners enrolled in this class</CardContent></Card>
      )}
    </div>
  );
}
