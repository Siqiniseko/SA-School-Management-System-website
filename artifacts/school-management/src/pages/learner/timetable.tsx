import React from "react";
import { useListTimetableEntries, useListLearners } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "lucide-react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export default function LearnerTimetable() {
  const { user } = useAuth();
  const { data: allLearners } = useListLearners();
  const { data: allEntries, isLoading } = useListTimetableEntries();

  const myLearner = allLearners?.find(l => l.userId === user?.id);
  const entries = allEntries?.filter(e => e.classId === myLearner?.classId) ?? [];

  const today = new Date().toLocaleDateString("en-ZA", { weekday: "long" });

  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">My Timetable</h1>
      {myLearner && <p className="text-muted-foreground">{myLearner.grade} · {myLearner.className || "No class assigned"}</p>}

      {!myLearner && (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No class assigned to your profile yet.</CardContent></Card>
      )}

      {myLearner && DAYS.map(day => {
        const dayEntries = entries.filter(e => e.dayOfWeek === day).sort((a,b) => a.startTime.localeCompare(b.startTime));
        return (
          <div key={day}>
            <h2 className={`text-lg font-semibold mb-2 ${day === today ? "text-primary" : "text-muted-foreground"}`}>
              {day === today ? `📅 ${day} (Today)` : day}
            </h2>
            <Card>
              <CardContent className="p-0">
                {dayEntries.length === 0 ? (
                  <p className="text-center py-4 text-sm text-muted-foreground">No classes scheduled</p>
                ) : (
                  <div className="divide-y">
                    {dayEntries.map(e => (
                      <div key={e.id} className="flex items-center gap-4 px-4 py-3">
                        <div className="font-mono text-sm text-muted-foreground w-28 shrink-0">
                          {e.startTime} – {e.endTime}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{e.subjectName || `Subject ${e.subjectId}`}</p>
                          <p className="text-sm text-muted-foreground">{e.teacherName || "—"}</p>
                        </div>
                        {e.room && <div className="text-sm text-muted-foreground">{e.room}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
