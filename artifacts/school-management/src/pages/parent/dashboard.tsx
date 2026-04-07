import React from "react";
import { useGetParentDashboard } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Users, Banknote, Bell, GraduationCap } from "lucide-react";

export default function ParentDashboard() {
  const { user } = useAuth();
  const { data: dashboard, isLoading } = useGetParentDashboard(user?.id ?? 0, {
    query: { enabled: !!user?.id },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Parent Overview</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!dashboard) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Parent Overview</h1>
      <p className="text-muted-foreground">Welcome back, {user?.fullName}</p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">My Children</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dashboard.children.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding Fees</CardTitle>
            <Banknote className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">
              R {dashboard.outstandingFees.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      {dashboard.children.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Children's Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {dashboard.childrenProgress.map((child) => (
                <div key={child.learnerId} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{child.learnerName}</p>
                    <p className="text-sm text-muted-foreground">{child.grade}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{child.overallAverage}%</p>
                    <p className="text-xs text-muted-foreground">Overall Avg</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {dashboard.recentPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {dashboard.recentPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">R {payment.amount.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</p>
                    <p className="text-sm text-muted-foreground capitalize">{payment.paymentMethod}</p>
                  </div>
                  <Badge variant={payment.status === "completed" ? "default" : "secondary"}>
                    {payment.status}
                  </Badge>
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
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(n.createdAt).toLocaleDateString("en-ZA")}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
