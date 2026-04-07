import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, attendanceTable, learnersTable } from "@workspace/db";
import {
  ListAttendanceQueryParams,
  GetAttendanceSummaryQueryParams,
  RecordAttendanceBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function formatAttendance(record: typeof attendanceTable.$inferSelect) {
  let learnerName: string | null = null;
  const [learner] = await db.select().from(learnersTable).where(eq(learnersTable.id, record.learnerId));
  if (learner) learnerName = learner.fullName;

  return {
    id: record.id,
    learnerId: record.learnerId,
    learnerName,
    classId: record.classId,
    date: record.date,
    status: record.status,
    remarks: record.remarks,
    recordedBy: record.recordedBy,
    createdAt: record.createdAt.toISOString(),
  };
}

router.get("/attendance/summary", async (req, res): Promise<void> => {
  const params = GetAttendanceSummaryQueryParams.safeParse(req.query);

  let records = await db.select().from(attendanceTable);

  if (params.success) {
    if (params.data.learnerId != null) {
      records = records.filter((r) => r.learnerId === params.data.learnerId);
    }
    if (params.data.classId != null) {
      records = records.filter((r) => r.classId === params.data.classId);
    }
  }

  const totalDays = records.length;
  const presentDays = records.filter((r) => r.status === "present").length;
  const absentDays = records.filter((r) => r.status === "absent").length;
  const lateDays = records.filter((r) => r.status === "late").length;
  const excusedDays = records.filter((r) => r.status === "excused").length;
  const attendancePercentage = totalDays > 0 ? Math.round(((presentDays + lateDays) / totalDays) * 100 * 10) / 10 : 0;

  res.json({ totalDays, presentDays, absentDays, lateDays, excusedDays, attendancePercentage });
});

router.get("/attendance", async (req, res): Promise<void> => {
  const params = ListAttendanceQueryParams.safeParse(req.query);
  let records = await db.select().from(attendanceTable);

  if (params.success) {
    if (params.data.learnerId != null) records = records.filter((r) => r.learnerId === params.data.learnerId);
    if (params.data.classId != null) records = records.filter((r) => r.classId === params.data.classId);
    if (params.data.date != null) records = records.filter((r) => r.date === params.data.date);
  }

  const formatted = await Promise.all(records.map(formatAttendance));
  res.json(formatted);
});

router.post("/attendance", async (req, res): Promise<void> => {
  const parsed = RecordAttendanceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [record] = await db.insert(attendanceTable).values({
    learnerId: parsed.data.learnerId,
    classId: parsed.data.classId ?? null,
    date: parsed.data.date,
    status: parsed.data.status,
    remarks: parsed.data.remarks ?? null,
    recordedBy: parsed.data.recordedBy ?? null,
  }).returning();

  res.status(201).json(await formatAttendance(record));
});

export default router;
