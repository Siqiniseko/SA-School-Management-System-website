import React, { useState } from "react";
import { useListAttendance, useListLearners } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";

const STATUS_ICONS: Record<string, React.ElementType> = { present: CheckCircle, absent: XCircle, late: Clock, excused: AlertCircle };
const STATUS_COLORS: Record<string, string> = { present: "text-green-600", absent: "text-destructive", late: "text-yellow-600", excused: "text-blue-600" };

function LearnerAttendanceView({ learnerId }: { learnerId: number }) {
  const { data: records, isLoading } = useListAttendance({ learnerId });
  const present = records?.filter(r => r.status === "present" || r.status === "late").length ?? 0;
  const total = records?.length ?? 0;
  const pct = total > 0 ? Math.round((present / total) * 100) : 0;

  if (isLoading) return <Skeleton className="h-48 w-full rounded-xl" />;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Attendance Rate</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${pct >= 80 ? "text-green-600" : pct >= 70 ? "text-yellow-600" : "text-destructive"}`}>{pct}%</div>
            <div className="mt-2 h-2 w-full bg-muted rounded-full overflow-hidden">
              <div className={`h-full ${pct >= 80 ? "bg-green-500" : pct >= 70 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${pct}%` }} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Days Present</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-green-600">{present}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Days Absent</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-destructive">{records?.filter(r => r.status === "absent").length ?? 0}</div></CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Attendance Record</CardTitle></CardHeader>
        <CardContent>
          {!records || records.length === 0 ? (
            <p className="text-center py-6 text-muted-foreground">No attendance records</p>
          ) : (
            <div className="divide-y">
              {[...records].sort((a,b) => b.date.localeCompare(a.date)).map(r => {
                const Icon = STATUS_ICONS[r.status] ?? CheckCircle;
                return (
                  <div key={r.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <Icon className={`h-5 w-5 ${STATUS_COLORS[r.status] ?? ""}`} />
                      <p className="font-medium">{new Date(r.date).toLocaleDateString("en-ZA", { dateStyle: "medium" })}</p>
                    </div>
                    <span className={`text-sm font-semibold capitalize ${STATUS_COLORS[r.status] ?? ""}`}>{r.status}</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ParentAttendance() {
  const { user } = useAuth();
  const { data: allLearners } = useListLearners();
  const myLearners = allLearners?.filter(l => l.parentId === user?.id) ?? [];
  const [selected, setSelected] = useState<string>("");
  const active = myLearners.find(l => l.id.toString() === selected) ?? myLearners[0];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Attendance</h1>
      {myLearners.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No learners linked to your account</CardContent></Card>
      ) : (
        <>
          {myLearners.length > 1 && (
            <Select value={selected || myLearners[0]?.id.toString()} onValueChange={setSelected}>
              <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
              <SelectContent>{myLearners.map(l => <SelectItem key={l.id} value={l.id.toString()}>{l.fullName}</SelectItem>)}</SelectContent>
            </Select>
          )}
          {active && (
            <div>
              <p className="text-lg font-semibold mb-4">{active.fullName} · {active.grade}</p>
              <LearnerAttendanceView learnerId={active.id} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
