import React from "react";
import { useGetAdminDashboard } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { GraduationCap, Users, BookOpen, Presentation, Banknote, Bell } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

export default function AdminDashboard() {
  const { data: dashboard, isLoading } = useGetAdminDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Admin Overview</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!dashboard) return null;

  const stats = [
    { title: "Total Learners", value: dashboard.totalLearners, icon: GraduationCap, color: "text-blue-500" },
    { title: "Total Teachers", value: dashboard.totalTeachers, icon: Users, color: "text-green-500" },
    { title: "Classes", value: dashboard.totalClasses, icon: Presentation, color: "text-purple-500" },
    { title: "Subjects", value: dashboard.totalSubjects, icon: BookOpen, color: "text-orange-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Admin Overview</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 \${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Grade Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboard.gradeDistribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="grade" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip cursor={{ fill: 'hsl(var(--muted))' }} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Attendance Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{dashboard.attendanceToday}%</div>
              <div className="mt-2 h-2 w-full bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500" 
                  style={{ width: `\${dashboard.attendanceToday}%` }}
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Banknote className="h-4 w-4" />
                Fees Collection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-muted-foreground">Collected</div>
                  <div className="text-lg font-bold text-green-600">R {dashboard.feesCollected.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Outstanding</div>
                  <div className="text-lg font-bold text-destructive">R {dashboard.feesOutstanding.toLocaleString()}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Recent Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dashboard.recentNotifications.length > 0 ? (
            <div className="space-y-4">
              {dashboard.recentNotifications.map(notification => (
                <div key={notification.id} className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <p className="font-medium leading-none">{notification.title}</p>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(notification.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground text-sm">
              No recent notifications
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
