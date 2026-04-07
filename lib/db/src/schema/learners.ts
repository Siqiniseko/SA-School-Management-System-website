import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const learnersTable = pgTable("learners", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id),
  admissionNumber: text("admission_number").notNull().unique(),
  fullName: text("full_name").notNull(),
  grade: text("grade").notNull(),
  classId: integer("class_id"),
  parentId: integer("parent_id").references(() => usersTable.id),
  dateOfBirth: text("date_of_birth"),
  gender: text("gender"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertLearnerSchema = createInsertSchema(learnersTable).omit({ id: true, createdAt: true });
export type InsertLearner = z.infer<typeof insertLearnerSchema>;
export type Learner = typeof learnersTable.$inferSelect;
