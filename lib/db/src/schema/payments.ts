import { pgTable, text, serial, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { feesTable } from "./fees";
import { learnersTable } from "./learners";

export const paymentsTable = pgTable("payments", {
  id: serial("id").primaryKey(),
  feeId: integer("fee_id").notNull().references(() => feesTable.id),
  learnerId: integer("learner_id").notNull().references(() => learnersTable.id),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(),
  referenceNumber: text("reference_number").notNull().unique(),
  status: text("status").notNull().default("completed"),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPaymentSchema = createInsertSchema(paymentsTable).omit({ id: true, createdAt: true, referenceNumber: true, status: true, processedAt: true });
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof paymentsTable.$inferSelect;
