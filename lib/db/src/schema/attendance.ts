import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { learnersTable } from "./learners";
import { classesTable } from "./classes";
import { usersTable } from "./users";

export const attendanceTable = pgTable("attendance", {
  id: serial("id").primaryKey(),
  learnerId: integer("learner_id").notNull().references(() => learnersTable.id),
  classId: integer("class_id").references(() => classesTable.id),
  date: text("date").notNull(),
  status: text("status").notNull(),
  remarks: text("remarks"),
  recordedBy: integer("recorded_by").references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAttendanceSchema = createInsertSchema(attendanceTable).omit({ id: true, createdAt: true });
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type AttendanceRecord = typeof attendanceTable.$inferSelect;
