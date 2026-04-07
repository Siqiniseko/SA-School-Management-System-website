import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, learnersTable, usersTable, classesTable } from "@workspace/db";
import {
  ListLearnersQueryParams,
  CreateLearnerBody,
  GetLearnerParams,
  UpdateLearnerParams,
  UpdateLearnerBody,
  DeleteLearnerParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function formatLearner(learner: typeof learnersTable.$inferSelect) {
  let className: string | null = null;
  let parentName: string | null = null;

  if (learner.classId) {
    const [cls] = await db.select().from(classesTable).where(eq(classesTable.id, learner.classId));
    if (cls) className = cls.name;
  }
  if (learner.parentId) {
    const [parent] = await db.select().from(usersTable).where(eq(usersTable.id, learner.parentId));
    if (parent) parentName = parent.fullName;
  }

  return {
    id: learner.id,
    userId: learner.userId,
    admissionNumber: learner.admissionNumber,
    fullName: learner.fullName,
    grade: learner.grade,
    classId: learner.classId,
    className,
    parentId: learner.parentId,
    parentName,
    dateOfBirth: learner.dateOfBirth,
    gender: learner.gender,
    createdAt: learner.createdAt.toISOString(),
  };
}

router.get("/learners", async (req, res): Promise<void> => {
  const params = ListLearnersQueryParams.safeParse(req.query);
  let learners: (typeof learnersTable.$inferSelect)[];

  if (params.success) {
    let query = db.select().from(learnersTable);
    // Filter manually based on params
    const allLearners = await db.select().from(learnersTable);
    learners = allLearners.filter((l) => {
      if (params.data.classId != null && l.classId !== params.data.classId) return false;
      if (params.data.grade != null && l.grade !== params.data.grade) return false;
      return true;
    });
  } else {
    learners = await db.select().from(learnersTable);
  }

  const formatted = await Promise.all(learners.map(formatLearner));
  res.json(formatted);
});

router.post("/learners", async (req, res): Promise<void> => {
  const parsed = CreateLearnerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [learner] = await db.insert(learnersTable).values({
    admissionNumber: parsed.data.admissionNumber,
    fullName: parsed.data.fullName,
    grade: parsed.data.grade,
    classId: parsed.data.classId ?? null,
    parentId: parsed.data.parentId ?? null,
    dateOfBirth: parsed.data.dateOfBirth ?? null,
    gender: parsed.data.gender ?? null,
    userId: parsed.data.userId ?? null,
  }).returning();

  res.status(201).json(await formatLearner(learner));
});

router.get("/learners/:id", async (req, res): Promise<void> => {
  const params = GetLearnerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [learner] = await db.select().from(learnersTable).where(eq(learnersTable.id, params.data.id));
  if (!learner) {
    res.status(404).json({ error: "Learner not found" });
    return;
  }

  res.json(await formatLearner(learner));
});

router.patch("/learners/:id", async (req, res): Promise<void> => {
  const params = UpdateLearnerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateLearnerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.fullName != null) updates.fullName = parsed.data.fullName;
  if (parsed.data.grade != null) updates.grade = parsed.data.grade;
  if (parsed.data.classId !== undefined) updates.classId = parsed.data.classId;
  if (parsed.data.parentId !== undefined) updates.parentId = parsed.data.parentId;
  if (parsed.data.dateOfBirth !== undefined) updates.dateOfBirth = parsed.data.dateOfBirth;
  if (parsed.data.gender !== undefined) updates.gender = parsed.data.gender;

  const [learner] = await db.update(learnersTable).set(updates).where(eq(learnersTable.id, params.data.id)).returning();
  if (!learner) {
    res.status(404).json({ error: "Learner not found" });
    return;
  }

  res.json(await formatLearner(learner));
});

router.delete("/learners/:id", async (req, res): Promise<void> => {
  const params = DeleteLearnerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(learnersTable).where(eq(learnersTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
