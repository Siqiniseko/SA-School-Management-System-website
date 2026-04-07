import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, marksTable, learnersTable, subjectsTable } from "@workspace/db";
import {
  ListMarksQueryParams,
  CreateMarkBody,
  UpdateMarkParams,
  UpdateMarkBody,
  DeleteMarkParams,
  GetLearnerProgressParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function formatMark(mark: typeof marksTable.$inferSelect) {
  let learnerName: string | null = null;
  let subjectName: string | null = null;

  const [learner] = await db.select().from(learnersTable).where(eq(learnersTable.id, mark.learnerId));
  if (learner) learnerName = learner.fullName;

  const [subject] = await db.select().from(subjectsTable).where(eq(subjectsTable.id, mark.subjectId));
  if (subject) subjectName = subject.name;

  return {
    id: mark.id,
    learnerId: mark.learnerId,
    learnerName,
    subjectId: mark.subjectId,
    subjectName,
    assessmentType: mark.assessmentType,
    assessmentName: mark.assessmentName,
    score: parseFloat(mark.score as string),
    maxScore: parseFloat(mark.maxScore as string),
    percentage: parseFloat(mark.percentage as string),
    term: mark.term,
    grade: mark.grade,
    recordedBy: mark.recordedBy,
    createdAt: mark.createdAt.toISOString(),
  };
}

router.get("/marks/progress/:learnerId", async (req, res): Promise<void> => {
  const params = GetLearnerProgressParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [learner] = await db.select().from(learnersTable).where(eq(learnersTable.id, params.data.learnerId));
  if (!learner) {
    res.status(404).json({ error: "Learner not found" });
    return;
  }

  const allMarks = await db.select().from(marksTable).where(eq(marksTable.learnerId, params.data.learnerId));

  const subjectMap: Record<number, { subjectId: number; subjectName: string; scores: number[]; term: number }> = {};
  for (const mark of allMarks) {
    if (!subjectMap[mark.subjectId]) {
      const [subject] = await db.select().from(subjectsTable).where(eq(subjectsTable.id, mark.subjectId));
      subjectMap[mark.subjectId] = {
        subjectId: mark.subjectId,
        subjectName: subject?.name ?? "Unknown",
        scores: [],
        term: mark.term,
      };
    }
    subjectMap[mark.subjectId].scores.push(parseFloat(mark.percentage as string));
  }

  const subjectAverages = Object.values(subjectMap).map((s) => ({
    subjectId: s.subjectId,
    subjectName: s.subjectName,
    average: s.scores.length > 0 ? Math.round(s.scores.reduce((a, b) => a + b, 0) / s.scores.length * 10) / 10 : 0,
    term: s.term,
  }));

  const allPercentages = allMarks.map((m) => parseFloat(m.percentage as string));
  const overallAverage = allPercentages.length > 0
    ? Math.round(allPercentages.reduce((a, b) => a + b, 0) / allPercentages.length * 10) / 10
    : 0;

  const recentMarks = await Promise.all(allMarks.slice(-5).map(formatMark));

  res.json({
    learnerId: learner.id,
    learnerName: learner.fullName,
    grade: learner.grade,
    overallAverage,
    subjectAverages,
    recentMarks,
  });
});

router.get("/marks", async (req, res): Promise<void> => {
  const params = ListMarksQueryParams.safeParse(req.query);
  let marks = await db.select().from(marksTable);

  if (params.success) {
    if (params.data.learnerId != null) marks = marks.filter((m) => m.learnerId === params.data.learnerId);
    if (params.data.subjectId != null) marks = marks.filter((m) => m.subjectId === params.data.subjectId);
    if (params.data.term != null) marks = marks.filter((m) => m.term === params.data.term);
  }

  const formatted = await Promise.all(marks.map(formatMark));
  res.json(formatted);
});

router.post("/marks", async (req, res): Promise<void> => {
  const parsed = CreateMarkBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const percentage = Math.round((parsed.data.score / parsed.data.maxScore) * 100 * 10) / 10;

  const [mark] = await db.insert(marksTable).values({
    learnerId: parsed.data.learnerId,
    subjectId: parsed.data.subjectId,
    assessmentType: parsed.data.assessmentType,
    assessmentName: parsed.data.assessmentName,
    score: parsed.data.score.toString(),
    maxScore: parsed.data.maxScore.toString(),
    percentage: percentage.toString(),
    term: parsed.data.term,
    grade: parsed.data.grade ?? null,
    recordedBy: parsed.data.recordedBy ?? null,
  }).returning();

  res.status(201).json(await formatMark(mark));
});

router.patch("/marks/:id", async (req, res): Promise<void> => {
  const params = UpdateMarkParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateMarkBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.score != null) updates.score = parsed.data.score.toString();
  if (parsed.data.maxScore != null) updates.maxScore = parsed.data.maxScore.toString();
  if (parsed.data.assessmentName != null) updates.assessmentName = parsed.data.assessmentName;
  if (parsed.data.grade != null) updates.grade = parsed.data.grade;

  if (updates.score != null && updates.maxScore != null) {
    updates.percentage = (Math.round((Number(updates.score) / Number(updates.maxScore)) * 100 * 10) / 10).toString();
  }

  const [mark] = await db.update(marksTable).set(updates).where(eq(marksTable.id, params.data.id)).returning();
  if (!mark) {
    res.status(404).json({ error: "Mark not found" });
    return;
  }

  res.json(await formatMark(mark));
});

router.delete("/marks/:id", async (req, res): Promise<void> => {
  const params = DeleteMarkParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(marksTable).where(eq(marksTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
