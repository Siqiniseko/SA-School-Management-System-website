import React, { useState } from "react";
import { useGetLearnerProgress, useListLearners } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { GraduationCap } from "lucide-react";

function pctColor(p: number) { return p >= 80 ? "text-green-600" : p >= 70 ? "text-blue-600" : p >= 50 ? "text-yellow-600" : "text-destructive"; }
function pctBg(p: number) { return p >= 80 ? "bg-green-500" : p >= 70 ? "bg-blue-500" : p >= 50 ? "bg-yellow-500" : "bg-red-500"; }
function pctLabel(p: number) { return p >= 80 ? "Distinction" : p >= 70 ? "Merit" : p >= 50 ? "Pass" : "Below Pass"; }

function LearnerProgressView({ learnerId }: { learnerId: number }) {
  const { data: progress, isLoading } = useGetLearnerProgress(learnerId);
  if (isLoading) return <Skeleton className="h-48 w-full rounded-xl" />;
  if (!progress) return null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2"><GraduationCap className="h-4 w-4 text-primary" /> Overall Average</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-4xl font-bold ${pctColor(progress.overallAverage)}`}>{progress.overallAverage}%</div>
          <p className={`text-sm font-medium mt-1 ${pctColor(progress.overallAverage)}`}>{pctLabel(progress.overallAverage)}</p>
          <div className="mt-3 h-2 w-full bg-muted rounded-full overflow-hidden">
            <div className={`h-full ${pctBg(progress.overallAverage)}`} style={{ width: `${progress.overallAverage}%` }} />
          </div>
        </CardContent>
      </Card>

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
                  <div className={`h-full ${pctBg(s.average)}`} style={{ width: `${s.average}%` }} />
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

export default function ParentProgress() {
  const { user } = useAuth();
  const { data: allLearners } = useListLearners();
  const myLearners = allLearners?.filter(l => l.parentId === user?.id) ?? [];
  const [selectedLearner, setSelectedLearner] = useState<string>("");

  const activeLearner = myLearners.find(l => l.id.toString() === selectedLearner) ?? myLearners[0];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Learner Progress</h1>

      {myLearners.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No learners linked to your account</CardContent></Card>
      ) : (
        <>
          {myLearners.length > 1 && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Select value={selectedLearner || myLearners[0]?.id.toString()} onValueChange={setSelectedLearner}>
                <SelectTrigger className="w-full sm:w-64"><SelectValue placeholder="Select learner" /></SelectTrigger>
                <SelectContent>{myLearners.map(l => <SelectItem key={l.id} value={l.id.toString()}>{l.fullName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          {activeLearner && (
            <div>
              <p className="text-lg font-semibold mb-4">{activeLearner.fullName} · {activeLearner.grade}</p>
              <LearnerProgressView learnerId={activeLearner.id} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
