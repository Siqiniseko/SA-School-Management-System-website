import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { classesTable } from "./classes";
import { subjectsTable } from "./subjects";
import { usersTable } from "./users";

export const timetableTable = pgTable("timetable", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").notNull().references(() => classesTable.id),
  subjectId: integer("subject_id").notNull().references(() => subjectsTable.id),
  teacherId: integer("teacher_id").references(() => usersTable.id),
  dayOfWeek: text("day_of_week").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  room: text("room"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTimetableSchema = createInsertSchema(timetableTable).omit({ id: true, createdAt: true });
export type InsertTimetable = z.infer<typeof insertTimetableSchema>;
export type TimetableEntry = typeof timetableTable.$inferSelect;
