import React from "react";
import { useListLearners, useDeleteLearner } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getListLearnersQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";

export default function AdminLearners() {
  const { data: learners, isLoading } = useListLearners();
  const deleteLearner = useDeleteLearner();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure?")) return;
    try {
      await deleteLearner.mutateAsync({ id });
      toast({ title: "Learner deleted" });
      queryClient.invalidateQueries({ queryKey: getListLearnersQueryKey() });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Learners</h1>
        <Button><Plus className="mr-2 h-4 w-4" /> Add Learner</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admission No</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Class</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
              ) : learners?.map((learner) => (
                <TableRow key={learner.id}>
                  <TableCell>{learner.admissionNumber}</TableCell>
                  <TableCell className="font-medium">{learner.fullName}</TableCell>
                  <TableCell>{learner.grade}</TableCell>
                  <TableCell>{learner.className || "-"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(learner.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {learners?.length === 0 && (
                 <TableRow><TableCell colSpan={5} className="text-center py-4">No learners found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
