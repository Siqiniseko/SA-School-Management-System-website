import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, timetableTable, classesTable, subjectsTable, usersTable } from "@workspace/db";
import {
  ListTimetableEntriesQueryParams,
  CreateTimetableEntryBody,
  UpdateTimetableEntryParams,
  UpdateTimetableEntryBody,
  DeleteTimetableEntryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function formatEntry(entry: typeof timetableTable.$inferSelect) {
  let className: string | null = null;
  let subjectName: string | null = null;
  let teacherName: string | null = null;

  const [cls] = await db.select().from(classesTable).where(eq(classesTable.id, entry.classId));
  if (cls) className = cls.name;

  const [subject] = await db.select().from(subjectsTable).where(eq(subjectsTable.id, entry.subjectId));
  if (subject) subjectName = subject.name;

  if (entry.teacherId) {
    const [teacher] = await db.select().from(usersTable).where(eq(usersTable.id, entry.teacherId));
    if (teacher) teacherName = teacher.fullName;
  }

  return {
    id: entry.id,
    classId: entry.classId,
    className,
    subjectId: entry.subjectId,
    subjectName,
    teacherId: entry.teacherId,
    teacherName,
    dayOfWeek: entry.dayOfWeek,
    startTime: entry.startTime,
    endTime: entry.endTime,
    room: entry.room,
    createdAt: entry.createdAt.toISOString(),
  };
}

router.get("/timetable", async (req, res): Promise<void> => {
  const params = ListTimetableEntriesQueryParams.safeParse(req.query);
  let entries = await db.select().from(timetableTable);

  if (params.success) {
    if (params.data.classId != null) entries = entries.filter((e) => e.classId === params.data.classId);
    if (params.data.teacherId != null) entries = entries.filter((e) => e.teacherId === params.data.teacherId);
  }

  const formatted = await Promise.all(entries.map(formatEntry));
  res.json(formatted);
});

router.post("/timetable", async (req, res): Promise<void> => {
  const parsed = CreateTimetableEntryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [entry] = await db.insert(timetableTable).values({
    classId: parsed.data.classId,
    subjectId: parsed.data.subjectId,
    teacherId: parsed.data.teacherId ?? null,
    dayOfWeek: parsed.data.dayOfWeek,
    startTime: parsed.data.startTime,
    endTime: parsed.data.endTime,
    room: parsed.data.room ?? null,
  }).returning();

  res.status(201).json(await formatEntry(entry));
});

router.patch("/timetable/:id", async (req, res): Promise<void> => {
  const params = UpdateTimetableEntryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateTimetableEntryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.subjectId != null) updates.subjectId = parsed.data.subjectId;
  if (parsed.data.teacherId !== undefined) updates.teacherId = parsed.data.teacherId;
  if (parsed.data.dayOfWeek != null) updates.dayOfWeek = parsed.data.dayOfWeek;
  if (parsed.data.startTime != null) updates.startTime = parsed.data.startTime;
  if (parsed.data.endTime != null) updates.endTime = parsed.data.endTime;
  if (parsed.data.room !== undefined) updates.room = parsed.data.room;

  const [entry] = await db.update(timetableTable).set(updates).where(eq(timetableTable.id, params.data.id)).returning();
  if (!entry) {
    res.status(404).json({ error: "Timetable entry not found" });
    return;
  }

  res.json(await formatEntry(entry));
});

router.delete("/timetable/:id", async (req, res): Promise<void> => {
  const params = DeleteTimetableEntryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(timetableTable).where(eq(timetableTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
