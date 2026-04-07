import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, feesTable, learnersTable } from "@workspace/db";
import {
  ListFeesQueryParams,
  CreateFeeRecordBody,
  UpdateFeeRecordParams,
  UpdateFeeRecordBody,
  DeleteFeeRecordParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function formatFee(fee: typeof feesTable.$inferSelect) {
  let learnerName: string | null = null;
  const [learner] = await db.select().from(learnersTable).where(eq(learnersTable.id, fee.learnerId));
  if (learner) learnerName = learner.fullName;

  const totalAmount = parseFloat(fee.totalAmount as string);
  const amountPaid = parseFloat(fee.amountPaid as string);
  const outstandingBalance = Math.max(0, totalAmount - amountPaid);

  return {
    id: fee.id,
    learnerId: fee.learnerId,
    learnerName,
    description: fee.description,
    totalAmount,
    amountPaid,
    outstandingBalance,
    dueDate: fee.dueDate,
    status: fee.status,
    term: fee.term,
    year: fee.year,
    createdAt: fee.createdAt.toISOString(),
  };
}

router.get("/fees/summary", async (_req, res): Promise<void> => {
  const fees = await db.select().from(feesTable);

  const totalFees = fees.reduce((sum, f) => sum + parseFloat(f.totalAmount as string), 0);
  const totalCollected = fees.reduce((sum, f) => sum + parseFloat(f.amountPaid as string), 0);
  const totalOutstanding = totalFees - totalCollected;
  const totalOverdue = fees.filter((f) => f.status === "overdue").reduce((sum, f) => sum + parseFloat(f.totalAmount as string) - parseFloat(f.amountPaid as string), 0);
  const collectionRate = totalFees > 0 ? Math.round((totalCollected / totalFees) * 100 * 10) / 10 : 0;
  const learnersWithOutstanding = new Set(fees.filter((f) => f.status !== "paid").map((f) => f.learnerId)).size;

  res.json({ totalFees, totalCollected, totalOutstanding, totalOverdue, collectionRate, learnersWithOutstanding });
});

router.get("/fees", async (req, res): Promise<void> => {
  const params = ListFeesQueryParams.safeParse(req.query);
  let fees = await db.select().from(feesTable);

  if (params.success) {
    if (params.data.learnerId != null) fees = fees.filter((f) => f.learnerId === params.data.learnerId);
    if (params.data.status != null) fees = fees.filter((f) => f.status === params.data.status);
  }

  const formatted = await Promise.all(fees.map(formatFee));
  res.json(formatted);
});

router.post("/fees", async (req, res): Promise<void> => {
  const parsed = CreateFeeRecordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [fee] = await db.insert(feesTable).values({
    learnerId: parsed.data.learnerId,
    description: parsed.data.description,
    totalAmount: parsed.data.totalAmount.toString(),
    dueDate: parsed.data.dueDate,
    term: parsed.data.term,
    year: parsed.data.year,
    amountPaid: "0",
    status: "outstanding",
  }).returning();

  res.status(201).json(await formatFee(fee));
});

router.patch("/fees/:id", async (req, res): Promise<void> => {
  const params = UpdateFeeRecordParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateFeeRecordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.description != null) updates.description = parsed.data.description;
  if (parsed.data.totalAmount != null) updates.totalAmount = parsed.data.totalAmount.toString();
  if (parsed.data.dueDate != null) updates.dueDate = parsed.data.dueDate;
  if (parsed.data.status != null) updates.status = parsed.data.status;

  const [fee] = await db.update(feesTable).set(updates).where(eq(feesTable.id, params.data.id)).returning();
  if (!fee) {
    res.status(404).json({ error: "Fee record not found" });
    return;
  }

  res.json(await formatFee(fee));
});

router.delete("/fees/:id", async (req, res): Promise<void> => {
  const params = DeleteFeeRecordParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(feesTable).where(eq(feesTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
