import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, materialsTable, subjectsTable, usersTable } from "@workspace/db";
import {
  ListMaterialsQueryParams,
  CreateMaterialBody,
  DeleteMaterialParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function formatMaterial(m: typeof materialsTable.$inferSelect) {
  let subjectName: string | null = null;
  let uploaderName: string | null = null;

  if (m.subjectId) {
    const [subject] = await db.select().from(subjectsTable).where(eq(subjectsTable.id, m.subjectId));
    if (subject) subjectName = subject.name;
  }
  if (m.uploadedBy) {
    const [uploader] = await db.select().from(usersTable).where(eq(usersTable.id, m.uploadedBy));
    if (uploader) uploaderName = uploader.fullName;
  }

  return {
    id: m.id,
    title: m.title,
    description: m.description,
    type: m.type,
    subjectId: m.subjectId,
    subjectName,
    classId: m.classId,
    grade: m.grade,
    fileUrl: m.fileUrl,
    uploadedBy: m.uploadedBy,
    uploaderName,
    createdAt: m.createdAt.toISOString(),
  };
}

router.get("/materials", async (req, res): Promise<void> => {
  const params = ListMaterialsQueryParams.safeParse(req.query);
  let materials = await db.select().from(materialsTable);

  if (params.success) {
    if (params.data.subjectId != null) materials = materials.filter((m) => m.subjectId === params.data.subjectId);
    if (params.data.classId != null) materials = materials.filter((m) => m.classId === params.data.classId);
    if (params.data.type != null) materials = materials.filter((m) => m.type === params.data.type);
  }

  const formatted = await Promise.all(materials.map(formatMaterial));
  res.json(formatted);
});

router.post("/materials", async (req, res): Promise<void> => {
  const parsed = CreateMaterialBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [material] = await db.insert(materialsTable).values({
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    type: parsed.data.type,
    subjectId: parsed.data.subjectId ?? null,
    classId: parsed.data.classId ?? null,
    grade: parsed.data.grade ?? null,
    fileUrl: parsed.data.fileUrl ?? null,
    uploadedBy: parsed.data.uploadedBy ?? null,
  }).returning();

  res.status(201).json(await formatMaterial(material));
});

router.delete("/materials/:id", async (req, res): Promise<void> => {
  const params = DeleteMaterialParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(materialsTable).where(eq(materialsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
