import React from "react";
import { useGetTeacherDashboard } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Users, CheckCircle, Bell } from "lucide-react";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { data: dashboard, isLoading } = useGetTeacherDashboard(user?.id ?? 0, {
    query: { enabled: !!user?.id },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Teacher Overview</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!dashboard) return null;

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

      {dashboard.myClasses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>My Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {dashboard.myClasses.map((cls) => (
                <div key={cls.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{cls.name}</p>
                    <p className="text-sm text-muted-foreground">{cls.grade}</p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {cls.learnerCount} learners
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {dashboard.recentNotifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Notifications</CardTitle>
          </CardHeader>
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
