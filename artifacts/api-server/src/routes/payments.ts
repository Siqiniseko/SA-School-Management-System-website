import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, paymentsTable, feesTable, learnersTable } from "@workspace/db";
import {
  ListPaymentsQueryParams,
  ProcessPaymentBody,
  GetPaymentReceiptParams,
} from "@workspace/api-zod";
import crypto from "crypto";

const router: IRouter = Router();

async function formatPayment(p: typeof paymentsTable.$inferSelect) {
  let learnerName: string | null = null;
  const [learner] = await db.select().from(learnersTable).where(eq(learnersTable.id, p.learnerId));
  if (learner) learnerName = learner.fullName;

  return {
    id: p.id,
    feeId: p.feeId,
    learnerId: p.learnerId,
    learnerName,
    amount: parseFloat(p.amount as string),
    paymentMethod: p.paymentMethod,
    referenceNumber: p.referenceNumber,
    status: p.status,
    processedAt: p.processedAt?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/payments/:id/receipt", async (req, res): Promise<void> => {
  const params = GetPaymentReceiptParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [payment] = await db.select().from(paymentsTable).where(eq(paymentsTable.id, params.data.id));
  if (!payment) {
    res.status(404).json({ error: "Payment not found" });
    return;
  }

  const [learner] = await db.select().from(learnersTable).where(eq(learnersTable.id, payment.learnerId));
  const [fee] = await db.select().from(feesTable).where(eq(feesTable.id, payment.feeId));

  res.json({
    paymentId: payment.id,
    referenceNumber: payment.referenceNumber,
    learnerName: learner?.fullName ?? "Unknown",
    admissionNumber: learner?.admissionNumber ?? "Unknown",
    description: fee?.description ?? "School Fees",
    amount: parseFloat(payment.amount as string),
    paymentMethod: payment.paymentMethod,
    processedAt: payment.processedAt?.toISOString() ?? payment.createdAt.toISOString(),
    schoolName: "Replit Academy",
  });
});

router.get("/payments", async (req, res): Promise<void> => {
  const params = ListPaymentsQueryParams.safeParse(req.query);
  let payments = await db.select().from(paymentsTable);

  if (params.success) {
    if (params.data.learnerId != null) payments = payments.filter((p) => p.learnerId === params.data.learnerId);
    if (params.data.feeId != null) payments = payments.filter((p) => p.feeId === params.data.feeId);
  }

  const formatted = await Promise.all(payments.map(formatPayment));
  res.json(formatted);
});

router.post("/payments", async (req, res): Promise<void> => {
  const parsed = ProcessPaymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const referenceNumber = `PAY-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

  const [payment] = await db.insert(paymentsTable).values({
    feeId: parsed.data.feeId,
    learnerId: parsed.data.learnerId,
    amount: parsed.data.amount.toString(),
    paymentMethod: parsed.data.paymentMethod,
    referenceNumber,
    status: "completed",
    processedAt: new Date(),
  }).returning();

  const [fee] = await db.select().from(feesTable).where(eq(feesTable.id, parsed.data.feeId));
  if (fee) {
    const newAmountPaid = parseFloat(fee.amountPaid as string) + parsed.data.amount;
    const totalAmount = parseFloat(fee.totalAmount as string);
    const newStatus = newAmountPaid >= totalAmount ? "paid" : newAmountPaid > 0 ? "partial" : "outstanding";

    await db.update(feesTable).set({
      amountPaid: newAmountPaid.toString(),
      status: newStatus,
    }).where(eq(feesTable.id, parsed.data.feeId));
  }

  res.status(201).json(await formatPayment(payment));
});

export default router;
