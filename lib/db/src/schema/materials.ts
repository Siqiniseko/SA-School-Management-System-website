import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { subjectsTable } from "./subjects";
import { classesTable } from "./classes";
import { usersTable } from "./users";

export const materialsTable = pgTable("materials", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(),
  subjectId: integer("subject_id").references(() => subjectsTable.id),
  classId: integer("class_id").references(() => classesTable.id),
  grade: text("grade"),
  fileUrl: text("file_url"),
  uploadedBy: integer("uploaded_by").references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMaterialSchema = createInsertSchema(materialsTable).omit({ id: true, createdAt: true });
export type InsertMaterial = z.infer<typeof insertMaterialSchema>;
export type Material = typeof materialsTable.$inferSelect;
