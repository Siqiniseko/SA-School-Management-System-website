import { pgTable, text, serial, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { learnersTable } from "./learners";

export const feesTable = pgTable("fees", {
  id: serial("id").primaryKey(),
  learnerId: integer("learner_id").notNull().references(() => learnersTable.id),
  description: text("description").notNull(),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
  amountPaid: numeric("amount_paid", { precision: 12, scale: 2 }).notNull().default("0"),
  dueDate: text("due_date").notNull(),
  status: text("status").notNull().default("outstanding"),
  term: integer("term").notNull(),
  year: integer("year").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFeeSchema = createInsertSchema(feesTable).omit({ id: true, createdAt: true, amountPaid: true, status: true });
export type InsertFee = z.infer<typeof insertFeeSchema>;
export type Fee = typeof feesTable.$inferSelect;
