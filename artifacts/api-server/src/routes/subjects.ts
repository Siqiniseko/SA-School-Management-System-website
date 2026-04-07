import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, subjectsTable, usersTable } from "@workspace/db";
import {
  CreateSubjectBody,
  UpdateSubjectParams,
  UpdateSubjectBody,
  DeleteSubjectParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function formatSubject(sub: typeof subjectsTable.$inferSelect) {
  let teacherName: string | null = null;
  if (sub.teacherId) {
    const [teacher] = await db.select().from(usersTable).where(eq(usersTable.id, sub.teacherId));
    if (teacher) teacherName = teacher.fullName;
  }

  return {
    id: sub.id,
    name: sub.name,
    code: sub.code,
    grade: sub.grade,
    teacherId: sub.teacherId,
    teacherName,
    createdAt: sub.createdAt.toISOString(),
  };
}

router.get("/subjects", async (_req, res): Promise<void> => {
  const subjects = await db.select().from(subjectsTable);
  const formatted = await Promise.all(subjects.map(formatSubject));
  res.json(formatted);
});

router.post("/subjects", async (req, res): Promise<void> => {
  const parsed = CreateSubjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [sub] = await db.insert(subjectsTable).values({
    name: parsed.data.name,
    code: parsed.data.code,
    grade: parsed.data.grade,
    teacherId: parsed.data.teacherId ?? null,
  }).returning();

  res.status(201).json(await formatSubject(sub));
});

router.patch("/subjects/:id", async (req, res): Promise<void> => {
  const params = UpdateSubjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateSubjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.name != null) updates.name = parsed.data.name;
  if (parsed.data.code != null) updates.code = parsed.data.code;
  if (parsed.data.grade != null) updates.grade = parsed.data.grade;
  if (parsed.data.teacherId !== undefined) updates.teacherId = parsed.data.teacherId;

  const [sub] = await db.update(subjectsTable).set(updates).where(eq(subjectsTable.id, params.data.id)).returning();
  if (!sub) {
    res.status(404).json({ error: "Subject not found" });
    return;
  }

  res.json(await formatSubject(sub));
});

router.delete("/subjects/:id", async (req, res): Promise<void> => {
  const params = DeleteSubjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(subjectsTable).where(eq(subjectsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
