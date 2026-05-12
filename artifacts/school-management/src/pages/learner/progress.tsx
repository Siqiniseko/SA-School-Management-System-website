import React from "react";
import { useGetLearnerProgress, getGetLearnerProgressQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { GraduationCap, TrendingUp } from "lucide-react";

function pctColor(pct: number) {
  if (pct >= 80) return "text-green-600";
  if (pct >= 70) return "text-blue-600";
  if (pct >= 50) return "text-yellow-600";
  return "text-destructive";
}
function pctLabel(pct: number) {
  if (pct >= 80) return "Distinction";
  if (pct >= 70) return "Merit";
  if (pct >= 50) return "Pass";
  return "Below Pass";
}
function pctBg(pct: number) {
  if (pct >= 80) return "bg-green-500";
  if (pct >= 70) return "bg-blue-500";
  if (pct >= 50) return "bg-yellow-500";
  return "bg-red-500";
}

export default function LearnerProgress() {
  const { user } = useAuth();
  const uid = user?.id ?? 0;
  const { data: progress, isLoading } = useGetLearnerProgress(uid, {
    query: { queryKey: getGetLearnerProgressQueryKey(uid), enabled: !!user?.id },
  });

  if (isLoading) return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>;
  if (!progress) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">My Progress</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-blue-500" /> Overall Average
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-4xl font-bold ${pctColor(progress.overallAverage)}`}>{progress.overallAverage}%</div>
            <p className={`text-sm font-medium mt-1 ${pctColor(progress.overallAverage)}`}>{pctLabel(progress.overallAverage)}</p>
            <div className="mt-3 h-2 w-full bg-muted rounded-full overflow-hidden">
              <div className={`h-full ${pctBg(progress.overallAverage)} transition-all`} style={{ width: `${progress.overallAverage}%` }} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" /> Subjects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{progress.subjectAverages.length}</div>
            <p className="text-sm text-muted-foreground mt-1">subjects tracked</p>
          </CardContent>
        </Card>
      </div>

      {progress.subjectAverages.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Subject Performance</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {progress.subjectAverages.map((s: any) => (
              <div key={s.subjectId}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{s.subjectName || `Subject ${s.subjectId}`}</span>
                  <span className={`text-sm font-bold ${pctColor(s.average)}`}>{s.average}%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className={`h-full ${pctBg(s.average)} transition-all`} style={{ width: `${s.average}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {progress.recentMarks.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Recent Assessments</CardTitle></CardHeader>
          <CardContent>
            <div className="divide-y">
              {progress.recentMarks.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{m.assessmentName}</p>
                    <p className="text-sm text-muted-foreground capitalize">{m.assessmentType} · {m.subjectName || `Subject ${m.subjectId}`} · Term {m.term}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{m.score}/{m.maxScore}</p>
                    <p className={`text-sm font-semibold ${pctColor(m.percentage)}`}>{m.percentage}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
