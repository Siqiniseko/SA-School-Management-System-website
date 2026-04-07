import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, classesTable, usersTable, learnersTable } from "@workspace/db";
import {
  CreateClassBody,
  UpdateClassParams,
  UpdateClassBody,
  DeleteClassParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function formatClass(cls: typeof classesTable.$inferSelect) {
  let teacherName: string | null = null;
  if (cls.teacherId) {
    const [teacher] = await db.select().from(usersTable).where(eq(usersTable.id, cls.teacherId));
    if (teacher) teacherName = teacher.fullName;
  }

  const learners = await db.select().from(learnersTable).where(eq(learnersTable.classId, cls.id));

  return {
    id: cls.id,
    name: cls.name,
    grade: cls.grade,
    teacherId: cls.teacherId,
    teacherName,
    learnerCount: learners.length,
    createdAt: cls.createdAt.toISOString(),
  };
}

router.get("/classes", async (_req, res): Promise<void> => {
  const classes = await db.select().from(classesTable);
  const formatted = await Promise.all(classes.map(formatClass));
  res.json(formatted);
});

router.post("/classes", async (req, res): Promise<void> => {
  const parsed = CreateClassBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [cls] = await db.insert(classesTable).values({
    name: parsed.data.name,
    grade: parsed.data.grade,
    teacherId: parsed.data.teacherId ?? null,
  }).returning();

  res.status(201).json(await formatClass(cls));
});

router.patch("/classes/:id", async (req, res): Promise<void> => {
  const params = UpdateClassParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateClassBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.name != null) updates.name = parsed.data.name;
  if (parsed.data.grade != null) updates.grade = parsed.data.grade;
  if (parsed.data.teacherId !== undefined) updates.teacherId = parsed.data.teacherId;

  const [cls] = await db.update(classesTable).set(updates).where(eq(classesTable.id, params.data.id)).returning();
  if (!cls) {
    res.status(404).json({ error: "Class not found" });
    return;
  }

  res.json(await formatClass(cls));
});

router.delete("/classes/:id", async (req, res): Promise<void> => {
  const params = DeleteClassParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(classesTable).where(eq(classesTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
