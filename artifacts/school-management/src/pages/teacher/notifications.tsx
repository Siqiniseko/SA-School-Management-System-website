import React from "react";
import { useListNotifications } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell } from "lucide-react";

const TYPE_COLORS: Record<string, string> = {
  general: "bg-blue-100 text-blue-700",
  academic: "bg-green-100 text-green-700",
  financial: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

export default function TeacherNotifications() {
  const { user } = useAuth();
  const { data: notifications, isLoading } = useListNotifications({ userId: user?.id });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Notifications</h1>

      {isLoading ? [1,2,3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />) :
        !notifications || notifications.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No notifications at this time</CardContent></Card>
        ) :
        [...notifications].reverse().map(n => (
          <Card key={n.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell className="h-4 w-4 text-primary" />
                  {n.title}
                </CardTitle>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize shrink-0 ${TYPE_COLORS[n.type] ?? "bg-gray-100 text-gray-700"}`}>{n.type}</span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{n.message}</p>
              <p className="text-xs text-muted-foreground mt-2">{new Date(n.createdAt).toLocaleDateString("en-ZA", { dateStyle: "medium" })}</p>
            </CardContent>
          </Card>
        ))
      }
    </div>
  );
}
