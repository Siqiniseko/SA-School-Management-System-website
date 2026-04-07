import { pgTable, text, serial, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { learnersTable } from "./learners";
import { subjectsTable } from "./subjects";
import { usersTable } from "./users";

export const marksTable = pgTable("marks", {
  id: serial("id").primaryKey(),
  learnerId: integer("learner_id").notNull().references(() => learnersTable.id),
  subjectId: integer("subject_id").notNull().references(() => subjectsTable.id),
  assessmentType: text("assessment_type").notNull(),
  assessmentName: text("assessment_name").notNull(),
  score: numeric("score", { precision: 10, scale: 2 }).notNull(),
  maxScore: numeric("max_score", { precision: 10, scale: 2 }).notNull(),
  percentage: numeric("percentage", { precision: 10, scale: 2 }).notNull(),
  term: integer("term").notNull(),
  grade: text("grade"),
  recordedBy: integer("recorded_by").references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMarkSchema = createInsertSchema(marksTable).omit({ id: true, createdAt: true });
export type InsertMark = z.infer<typeof insertMarkSchema>;
export type Mark = typeof marksTable.$inferSelect;
