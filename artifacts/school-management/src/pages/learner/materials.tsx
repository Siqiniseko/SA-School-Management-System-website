import React from "react";
import { useListMaterials, getListMaterialsQueryKey, useListLearners } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, BookOpen, ClipboardList, Link } from "lucide-react";

const TYPE_ICONS: Record<string, React.ElementType> = { notes: FileText, assignment: ClipboardList, textbook: BookOpen };
const TYPE_COLORS: Record<string, string> = {
  notes: "bg-blue-100 text-blue-700",
  assignment: "bg-orange-100 text-orange-700",
  textbook: "bg-purple-100 text-purple-700",
  worksheet: "bg-green-100 text-green-700",
  video: "bg-red-100 text-red-700",
  other: "bg-gray-100 text-gray-700",
};

export default function LearnerMaterials() {
  const { user } = useAuth();
  const { data: allLearners } = useListLearners();
  const myLearner = allLearners?.find(l => l.userId === user?.id);
  const params = myLearner ? { classId: myLearner.classId ?? undefined } : undefined;

  const { data: materials, isLoading } = useListMaterials(params, {
    query: { queryKey: getListMaterialsQueryKey(params), enabled: !!myLearner },
  });

  if (isLoading) return <div className="grid gap-4 md:grid-cols-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Learning Materials</h1>
      {myLearner && <p className="text-muted-foreground">{myLearner.grade} · {myLearner.className ?? ""}</p>}

      {!materials || materials.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No materials available yet</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {materials.map(m => {
            const Icon = TYPE_ICONS[m.type] ?? FileText;
            return (
              <Card key={m.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" /> {m.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {m.description && <p className="text-sm text-muted-foreground mb-2">{m.description}</p>}
                  <div className="flex flex-wrap gap-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${TYPE_COLORS[m.type] ?? "bg-gray-100 text-gray-700"}`}>{m.type}</span>
                    {m.subjectName && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{m.subjectName}</span>}
                  </div>
                  {m.fileUrl && (
                    <a href={m.fileUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                      <Link className="h-3 w-3" /> Open resource
                    </a>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">{new Date(m.createdAt).toLocaleDateString("en-ZA")}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
