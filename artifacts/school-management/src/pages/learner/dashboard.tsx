import React from "react";
import { useGetLearnerDashboard } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { GraduationCap, CheckCircle, BookOpen, Bell } from "lucide-react";

export default function LearnerDashboard() {
  const { user } = useAuth();
  const { data: dashboard, isLoading } = useGetLearnerDashboard(user?.id ?? 0, {
    query: { enabled: !!user?.id },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Learner Overview</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!dashboard) return null;

  const getGrade = (pct: number) => {
    if (pct >= 80) return { label: "Distinction", color: "text-green-600" };
    if (pct >= 70) return { label: "Merit", color: "text-blue-600" };
    if (pct >= 50) return { label: "Pass", color: "text-yellow-600" };
    return { label: "Below Pass", color: "text-destructive" };
  };
  const grade = getGrade(dashboard.overallAverage);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">
        Welcome, {dashboard.learner?.fullName || user?.fullName || "Learner"}
      </h1>
      {dashboard.learner && (
        <p className="text-muted-foreground">
          {dashboard.learner.grade} · Admission: {dashboard.learner.admissionNumber}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overall Average</CardTitle>
            <GraduationCap className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dashboard.overallAverage}%</div>
            <p className={`text-sm font-medium mt-1 ${grade.color}`}>{grade.label}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Attendance Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dashboard.attendancePct}%</div>
            <div className="mt-2 h-2 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-green-500" style={{ width: `${dashboard.attendancePct}%` }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {dashboard.recentMarks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Recent Marks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {dashboard.recentMarks.map((mark) => {
                const g = getGrade(mark.percentage);
                return (
                  <div key={mark.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium">{mark.assessmentName}</p>
                      <p className="text-sm text-muted-foreground capitalize">{mark.assessmentType} · Term {mark.term}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{mark.score}/{mark.maxScore}</p>
                      <p className={`text-sm ${g.color}`}>{mark.percentage}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {dashboard.timetableToday.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Today's Timetable</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {dashboard.timetableToday.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{entry.subjectName ?? `Subject ${entry.subjectId}`}</p>
                    <p className="text-sm text-muted-foreground">{entry.room}</p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {entry.startTime} – {entry.endTime}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {dashboard.notifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboard.notifications.map((n) => (
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
