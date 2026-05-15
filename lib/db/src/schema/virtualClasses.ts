import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { classesTable } from "./classes";
import { subjectsTable } from "./subjects";
import { usersTable } from "./users";

export const virtualClassesTable = pgTable("virtual_classes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  teacherId: integer("teacher_id").notNull().references(() => usersTable.id),
  classId: integer("class_id").references(() => classesTable.id),
  subjectId: integer("subject_id").references(() => subjectsTable.id),
  meetingUrl: text("meeting_url").notNull(),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  durationMinutes: integer("duration_minutes").notNull().default(45),
  status: text("status").notNull().default("scheduled"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertVirtualClassSchema = createInsertSchema(virtualClassesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertVirtualClass = z.infer<typeof insertVirtualClassSchema>;
export type VirtualClass = typeof virtualClassesTable.$inferSelect;
