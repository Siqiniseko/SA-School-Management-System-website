import { db } from "@workspace/db";
import { usersTable, classesTable, subjectsTable, learnersTable, feesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { logger } from "./lib/logger";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function seedIfEmpty(): Promise<void> {
  const existing = await db.select({ count: sql<number>`count(*)` }).from(usersTable);
  if (Number(existing[0]?.count) > 0) {
    logger.info("Database already seeded, skipping.");
    return;
  }

  logger.info("Seeding database with demo data...");

  const [admin] = await db.insert(usersTable).values({
    username: "admin",
    passwordHash: hashPassword("admin123"),
    role: "admin",
    fullName: "Admin User",
    email: "admin@replitacademy.co.za",
    phone: "011 000 0001",
  }).returning();

  const [teacher1] = await db.insert(usersTable).values({
    username: "teacher1",
    passwordHash: hashPassword("teacher123"),
    role: "teacher",
    fullName: "Ms Thandi Dlamini",
    email: "thandi.dlamini@replitacademy.co.za",
    phone: "011 000 0002",
  }).returning();

  const [teacher2] = await db.insert(usersTable).values({
    username: "teacher2",
    passwordHash: hashPassword("teacher123"),
    role: "teacher",
    fullName: "Mr Sipho Nkosi",
    email: "sipho.nkosi@replitacademy.co.za",
    phone: "011 000 0003",
  }).returning();

  const [teacher3] = await db.insert(usersTable).values({
    username: "teacher3",
    passwordHash: hashPassword("teacher123"),
    role: "teacher",
    fullName: "Mrs Fatima Patel",
    email: "fatima.patel@replitacademy.co.za",
    phone: "011 000 0004",
  }).returning();

  const [learnerUser1] = await db.insert(usersTable).values({
    username: "learner1",
    passwordHash: hashPassword("learner123"),
    role: "learner",
    fullName: "Amahle Zulu",
    email: "amahle.zulu@replitacademy.co.za",
  }).returning();

  const [learnerUser2] = await db.insert(usersTable).values({
    username: "learner2",
    passwordHash: hashPassword("learner123"),
    role: "learner",
    fullName: "Lethabo Mokoena",
    email: "lethabo.mokoena@replitacademy.co.za",
  }).returning();

  const [learnerUser3] = await db.insert(usersTable).values({
    username: "learner3",
    passwordHash: hashPassword("learner123"),
    role: "learner",
    fullName: "Riyaad Jacobs",
    email: "riyaad.jacobs@replitacademy.co.za",
  }).returning();

  const [parent1] = await db.insert(usersTable).values({
    username: "parent1",
    passwordHash: hashPassword("parent123"),
    role: "parent",
    fullName: "Mr Bongani Zulu",
    email: "bongani.zulu@gmail.com",
    phone: "082 111 2222",
  }).returning();

  const [parent2] = await db.insert(usersTable).values({
    username: "parent2",
    passwordHash: hashPassword("parent123"),
    role: "parent",
    fullName: "Mrs Priya Jacobs",
    email: "priya.jacobs@gmail.com",
    phone: "083 333 4444",
  }).returning();

  const [accountant] = await db.insert(usersTable).values({
    username: "accountant1",
    passwordHash: hashPassword("accountant123"),
    role: "accountant",
    fullName: "Ms Nomsa Khumalo",
    email: "nomsa.khumalo@replitacademy.co.za",
    phone: "011 000 0010",
  }).returning();

  const [class10A] = await db.insert(classesTable).values({
    name: "Grade 10A",
    grade: "Gr 10",
    teacherId: teacher1.id,
  }).returning();

  const [class11B] = await db.insert(classesTable).values({
    name: "Grade 11B",
    grade: "Gr 11",
    teacherId: teacher2.id,
  }).returning();

  const [class12C] = await db.insert(classesTable).values({
    name: "Grade 12C",
    grade: "Gr 12",
    teacherId: teacher3.id,
  }).returning();

  await db.insert(subjectsTable).values([
    { name: "Mathematics", code: "MATH10", grade: "Gr 10", teacherId: teacher1.id },
    { name: "English Home Language", code: "ENG10", grade: "Gr 10", teacherId: teacher2.id },
    { name: "Physical Sciences", code: "PS10", grade: "Gr 10", teacherId: teacher3.id },
    { name: "Life Sciences", code: "LS11", grade: "Gr 11", teacherId: teacher1.id },
    { name: "Mathematics", code: "MATH11", grade: "Gr 11", teacherId: teacher2.id },
    { name: "English Home Language", code: "ENG11", grade: "Gr 11", teacherId: teacher3.id },
    { name: "Mathematics", code: "MATH12", grade: "Gr 12", teacherId: teacher1.id },
    { name: "English Home Language", code: "ENG12", grade: "Gr 12", teacherId: teacher2.id },
    { name: "Accounting", code: "ACC12", grade: "Gr 12", teacherId: teacher3.id },
  ]);

  const [learner1] = await db.insert(learnersTable).values({
    userId: learnerUser1.id,
    admissionNumber: "RA-2024-001",
    fullName: "Amahle Zulu",
    grade: "Gr 10",
    classId: class10A.id,
    parentId: parent1.id,
    dateOfBirth: "2009-03-15",
    gender: "female",
  }).returning();

  const [learner2] = await db.insert(learnersTable).values({
    userId: learnerUser2.id,
    admissionNumber: "RA-2024-002",
    fullName: "Lethabo Mokoena",
    grade: "Gr 11",
    classId: class11B.id,
    parentId: parent1.id,
    dateOfBirth: "2008-07-22",
    gender: "male",
  }).returning();

  const [learner3] = await db.insert(learnersTable).values({
    userId: learnerUser3.id,
    admissionNumber: "RA-2024-003",
    fullName: "Riyaad Jacobs",
    grade: "Gr 12",
    classId: class12C.id,
    parentId: parent2.id,
    dateOfBirth: "2007-11-05",
    gender: "male",
  }).returning();

  const year = new Date().getFullYear();
  const dueQ1 = `${year}-03-31`;
  const dueQ2 = `${year}-06-30`;
  const dueQ3 = `${year}-09-30`;
  const dueQ4 = `${year}-11-30`;

  await db.insert(feesTable).values([
    { learnerId: learner1.id, description: "Term 1 Tuition", totalAmount: "550000", dueDate: dueQ1, term: 1, year },
    { learnerId: learner1.id, description: "Term 2 Tuition", totalAmount: "550000", dueDate: dueQ2, term: 2, year },
    { learnerId: learner1.id, description: "Term 3 Tuition", totalAmount: "550000", dueDate: dueQ3, term: 3, year },
    { learnerId: learner1.id, description: "Term 4 Tuition", totalAmount: "550000", dueDate: dueQ4, term: 4, year },
    { learnerId: learner2.id, description: "Term 1 Tuition", totalAmount: "600000", dueDate: dueQ1, term: 1, year },
    { learnerId: learner2.id, description: "Term 2 Tuition", totalAmount: "600000", dueDate: dueQ2, term: 2, year },
    { learnerId: learner2.id, description: "Term 3 Tuition", totalAmount: "600000", dueDate: dueQ3, term: 3, year },
    { learnerId: learner3.id, description: "Term 1 Tuition", totalAmount: "650000", dueDate: dueQ1, term: 1, year },
    { learnerId: learner3.id, description: "Term 2 Tuition", totalAmount: "650000", dueDate: dueQ2, term: 2, year },
    { learnerId: learner3.id, description: "Matric Dance Levy", totalAmount: "150000", dueDate: dueQ3, term: 3, year },
  ]);

  logger.info("Demo data seeded successfully. Demo credentials:");
  logger.info("  admin / admin123");
  logger.info("  teacher1 / teacher123");
  logger.info("  learner1 / learner123");
  logger.info("  parent1 / parent123");
  logger.info("  accountant1 / accountant123");
}
