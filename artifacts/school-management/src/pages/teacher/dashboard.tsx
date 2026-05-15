import React, { useEffect, useState } from "react";
import { useGetTeacherDashboard, getGetTeacherDashboardQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Users, CheckCircle, Bell, CalendarClock, ExternalLink, FileUp, Video } from "lucide-react";

type VirtualClass = {
  id: number;
  title: string;
  description: string | null;
  className: string | null;
  subjectName: string | null;
  meetingUrl: string;
  scheduledAt: string;
  durationMinutes: number;
  status: "scheduled" | "live" | "completed" | "cancelled";
};

type TeacherRecord = {
  id: number;
  title: string;
  description: string | null;
  type: string;
  subjectName: string | null;
  grade: string | null;
  fileUrl: string | null;
  uploadedBy: number | null;
  createdAt: string;
};

async function api<T>(url: string): Promise<T> {
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response.json();
}

function fmtDateTime(value: string) {
  return new Date(value).toLocaleString("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function fmtDate(value: string) {
  return new Date(value).toLocaleDateString("en-ZA", { dateStyle: "medium" });
}

export default function TeacherDashboard() {
  const { user } = useAuth();
  const uid = user?.id ?? 0;
  const { data: dashboard, isLoading } = useGetTeacherDashboard(uid, {
    query: { queryKey: getGetTeacherDashboardQueryKey(uid), enabled: !!user?.id },
  });
  const [virtualClasses, setVirtualClasses] = useState<VirtualClass[]>([]);
  const [records, setRecords] = useState<TeacherRecord[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadTeacherActivity() {
      if (!user?.id) return;
      setActivityLoading(true);
      try {
        const [classesData, materialsData] = await Promise.all([
          api<VirtualClass[]>(`/api/virtual-classes?teacherId=${user.id}`),
          api<TeacherRecord[]>("/api/materials?type=record"),
        ]);

        if (cancelled) return;

        setVirtualClasses(classesData);
        setRecords(materialsData.filter((record) => record.uploadedBy === user.id && record.type === "record"));
      } catch {
        if (!cancelled) {
          setVirtualClasses([]);
          setRecords([]);
        }
      } finally {
        if (!cancelled) setActivityLoading(false);
      }
    }

    void loadTeacherActivity();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Teacher Overview</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!dashboard) return null;

  const upcomingClasses = virtualClasses
    .filter((item) => item.status !== "completed" && item.status !== "cancelled")
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 5);

  const recentRecords = records
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Teacher Overview</h1>
      <p className="text-muted-foreground">Welcome back, {user?.fullName}</p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">My Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.myClasses.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Learners</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.totalLearners}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Attendance Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.attendanceTodayPct}%</div>
            <div className="mt-2 h-2 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-green-500" style={{ width: `${dashboard.attendanceTodayPct}%` }} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Assessments</CardTitle>
            <Bell className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.pendingAssessments}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-primary" />
              Upcoming Classes
            </CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link href="/teacher/virtual-classes">Manage</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((item) => <Skeleton key={item} className="h-16 rounded-md" />)}
              </div>
            ) : upcomingClasses.length === 0 ? (
              <div className="rounded-lg border bg-muted/30 p-5 text-sm text-muted-foreground">
                No upcoming virtual classes yet.
              </div>
            ) : (
              <div className="divide-y">
                {upcomingClasses.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="font-medium">{item.title}</p>
                      <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarClock className="h-4 w-4" />
                        {fmtDateTime(item.scheduledAt)} - {item.durationMinutes} min
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {[item.className, item.subjectName].filter(Boolean).join(" - ") || "General class"}
                      </p>
                    </div>
                    <Button asChild variant="ghost" size="sm">
                      <a href={item.meetingUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2">
              <FileUp className="h-5 w-5 text-primary" />
              Records Uploaded
            </CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link href="/teacher/records">Manage</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((item) => <Skeleton key={item} className="h-16 rounded-md" />)}
              </div>
            ) : recentRecords.length === 0 ? (
              <div className="rounded-lg border bg-muted/30 p-5 text-sm text-muted-foreground">
                No records uploaded yet.
              </div>
            ) : (
              <div className="divide-y">
                {recentRecords.map((record) => (
                  <div key={record.id} className="flex items-start justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="font-medium">{record.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {[record.subjectName, record.grade].filter(Boolean).join(" - ") || "General record"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{fmtDate(record.createdAt)}</p>
                    </div>
                    {record.fileUrl && (
                      <Button asChild variant="ghost" size="sm">
                        <a href={record.fileUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {dashboard.myClasses.length > 0 && (
        <Card>
          <CardHeader><CardTitle>My Classes</CardTitle></CardHeader>
          <CardContent>
            <div className="divide-y">
              {dashboard.myClasses.map((cls) => (
                <div key={cls.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{cls.name}</p>
                    <p className="text-sm text-muted-foreground">{cls.grade}</p>
                  </div>
                  <div className="text-sm text-muted-foreground">{cls.learnerCount} learners</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {dashboard.recentNotifications.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Recent Notifications</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboard.recentNotifications.map((n) => (
                <div key={n.id} className="border-b pb-3 last:border-0 last:pb-0">
                  <p className="font-medium">{n.title}</p>
                  <p className="text-sm text-muted-foreground">{n.message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
