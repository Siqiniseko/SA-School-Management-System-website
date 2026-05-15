import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import {
  db,
  virtualClassesTable,
  classesTable,
  subjectsTable,
  usersTable,
} from "@workspace/db";

const router: IRouter = Router();

const validStatuses = new Set(["scheduled", "live", "completed", "cancelled"]);

function readOptionalNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

async function formatVirtualClass(vc: typeof virtualClassesTable.$inferSelect) {
  const [teacher] = await db.select().from(usersTable).where(eq(usersTable.id, vc.teacherId));
  const [cls] = vc.classId
    ? await db.select().from(classesTable).where(eq(classesTable.id, vc.classId))
    : [];
  const [subject] = vc.subjectId
    ? await db.select().from(subjectsTable).where(eq(subjectsTable.id, vc.subjectId))
    : [];

  return {
    id: vc.id,
    title: vc.title,
    description: vc.description,
    teacherId: vc.teacherId,
    teacherName: teacher?.fullName ?? null,
    classId: vc.classId,
    className: cls?.name ?? null,
    subjectId: vc.subjectId,
    subjectName: subject?.name ?? null,
    meetingUrl: vc.meetingUrl,
    scheduledAt: vc.scheduledAt.toISOString(),
    durationMinutes: vc.durationMinutes,
    status: vc.status,
    createdAt: vc.createdAt.toISOString(),
  };
}

router.get("/virtual-classes", async (req, res): Promise<void> => {
  let virtualClasses = await db.select().from(virtualClassesTable);
  const teacherId = req.query.teacherId ? Number(req.query.teacherId) : null;

  if (teacherId != null && !Number.isNaN(teacherId)) {
    virtualClasses = virtualClasses.filter((vc) => vc.teacherId === teacherId);
  }

  const formatted = await Promise.all(virtualClasses.map(formatVirtualClass));
  res.json(formatted);
});

router.post("/virtual-classes", async (req, res): Promise<void> => {
  const body = req.body as Record<string, unknown>;
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : null;
  const teacherId = readOptionalNumber(body.teacherId);
  const classId = readOptionalNumber(body.classId);
  const subjectId = readOptionalNumber(body.subjectId);
  const meetingUrl = typeof body.meetingUrl === "string" ? body.meetingUrl.trim() : "";
  const durationMinutes = readOptionalNumber(body.durationMinutes) ?? 45;

  if (!title || !teacherId || !meetingUrl || !isValidUrl(meetingUrl)) {
    res.status(400).json({ error: "Title, teacher and a valid meeting URL are required" });
    return;
  }

  const scheduledAt = new Date(String(body.scheduledAt ?? ""));
  if (Number.isNaN(scheduledAt.getTime())) {
    res.status(400).json({ error: "scheduledAt must be a valid date" });
    return;
  }

  if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
    res.status(400).json({ error: "durationMinutes must be a positive number" });
    return;
  }

  const [virtualClass] = await db.insert(virtualClassesTable).values({
    title,
    description,
    teacherId,
    classId,
    subjectId,
    meetingUrl,
    scheduledAt,
    durationMinutes,
    status: "scheduled",
  }).returning();

  res.status(201).json(await formatVirtualClass(virtualClass));
});

router.patch("/virtual-classes/:id/status", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid virtual class id" });
    return;
  }

  const status = (req.body as Record<string, unknown>).status;
  if (typeof status !== "string" || !validStatuses.has(status)) {
    res.status(400).json({ error: "Invalid virtual class status" });
    return;
  }

  const [virtualClass] = await db
    .update(virtualClassesTable)
    .set({ status })
    .where(eq(virtualClassesTable.id, id))
    .returning();

  if (!virtualClass) {
    res.status(404).json({ error: "Virtual class not found" });
    return;
  }

  res.json(await formatVirtualClass(virtualClass));
});

router.delete("/virtual-classes/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid virtual class id" });
    return;
  }

  await db.delete(virtualClassesTable).where(eq(virtualClassesTable.id, id));
  res.sendStatus(204);
});

export default router;
