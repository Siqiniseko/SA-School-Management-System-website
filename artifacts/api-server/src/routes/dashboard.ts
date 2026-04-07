import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import {
  db,
  usersTable,
  learnersTable,
  classesTable,
  subjectsTable,
  attendanceTable,
  feesTable,
  notificationsTable,
  marksTable,
  paymentsTable,
  timetableTable,
} from "@workspace/db";
import {
  GetTeacherDashboardParams,
  GetLearnerDashboardParams,
  GetParentDashboardParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dashboard/admin", async (_req, res): Promise<void> => {
  const learners = await db.select().from(learnersTable);
  const teachers = await db.select().from(usersTable).where(eq(usersTable.role, "teacher"));
  const classes = await db.select().from(classesTable);
  const subjects = await db.select().from(subjectsTable);

  const today = new Date().toISOString().split("T")[0];
  const todayAttendance = await db.select().from(attendanceTable);
  const todayRecords = todayAttendance.filter((a) => a.date === today);
  const presentToday = todayRecords.filter((a) => a.status === "present" || a.status === "late").length;
  const attendanceToday = todayRecords.length > 0 ? Math.round((presentToday / todayRecords.length) * 100 * 10) / 10 : 0;

  const fees = await db.select().from(feesTable);
  const feesCollected = fees.reduce((sum, f) => sum + parseFloat(f.amountPaid as string), 0);
  const feesOutstanding = fees.reduce((sum, f) => {
    const total = parseFloat(f.totalAmount as string);
    const paid = parseFloat(f.amountPaid as string);
    return sum + Math.max(0, total - paid);
  }, 0);

  const notifications = await db.select().from(notificationsTable);
  const recentNotifications = notifications.slice(-5).reverse().map((n) => ({
    id: n.id,
    title: n.title,
    message: n.message,
    type: n.type,
    targetRole: n.targetRole,
    targetUserId: n.targetUserId,
    isRead: n.isRead,
    sentBy: n.sentBy,
    senderName: null,
    createdAt: n.createdAt.toISOString(),
  }));

  const gradeMap: Record<string, number> = {};
  for (const learner of learners) {
    gradeMap[learner.grade] = (gradeMap[learner.grade] ?? 0) + 1;
  }
  const gradeDistribution = Object.entries(gradeMap).map(([grade, count]) => ({ grade, count }));

  res.json({
    totalLearners: learners.length,
    totalTeachers: teachers.length,
    totalClasses: classes.length,
    totalSubjects: subjects.length,
    attendanceToday,
    feesCollected,
    feesOutstanding,
    recentNotifications,
    gradeDistribution,
  });
});

router.get("/dashboard/teacher/:userId", async (req, res): Promise<void> => {
  const params = GetTeacherDashboardParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const myClasses = await db.select().from(classesTable).where(eq(classesTable.teacherId, params.data.userId));
  const mySubjects = await db.select().from(subjectsTable).where(eq(subjectsTable.teacherId, params.data.userId));

  const classIds = myClasses.map((c) => c.id);
  const allLearners = await db.select().from(learnersTable);
  const myLearners = allLearners.filter((l) => l.classId != null && classIds.includes(l.classId));

  const today = new Date().toISOString().split("T")[0];
  const todayAttendance = await db.select().from(attendanceTable);
  const myTodayRecords = todayAttendance.filter((a) => a.date === today && myLearners.some((l) => l.id === a.learnerId));
  const presentToday = myTodayRecords.filter((a) => a.status === "present" || a.status === "late").length;
  const attendanceTodayPct = myTodayRecords.length > 0 ? Math.round((presentToday / myTodayRecords.length) * 100 * 10) / 10 : 0;

  const notifications = await db.select().from(notificationsTable);
  const recentNotifications = notifications.filter((n) => n.targetRole === "teacher" || n.targetRole == null).slice(-5).reverse().map((n) => ({
    id: n.id,
    title: n.title,
    message: n.message,
    type: n.type,
    targetRole: n.targetRole,
    targetUserId: n.targetUserId,
    isRead: n.isRead,
    sentBy: n.sentBy,
    senderName: null,
    createdAt: n.createdAt.toISOString(),
  }));

  const formattedClasses = await Promise.all(myClasses.map(async (cls) => {
    const learners = allLearners.filter((l) => l.classId === cls.id);
    return {
      id: cls.id,
      name: cls.name,
      grade: cls.grade,
      teacherId: cls.teacherId,
      teacherName: null,
      learnerCount: learners.length,
      createdAt: cls.createdAt.toISOString(),
    };
  }));

  const formattedSubjects = mySubjects.map((sub) => ({
    id: sub.id,
    name: sub.name,
    code: sub.code,
    grade: sub.grade,
    teacherId: sub.teacherId,
    teacherName: null,
    createdAt: sub.createdAt.toISOString(),
  }));

  res.json({
    myClasses: formattedClasses,
    mySubjects: formattedSubjects,
    totalLearners: myLearners.length,
    attendanceTodayPct,
    recentNotifications,
    pendingAssessments: 0,
  });
});

router.get("/dashboard/learner/:userId", async (req, res): Promise<void> => {
  const params = GetLearnerDashboardParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [learnerRecord] = await db.select().from(learnersTable).where(eq(learnersTable.userId, params.data.userId));

  const notifications = await db.select().from(notificationsTable);
  const myNotifications = notifications.filter((n) => n.targetRole === "learner" || n.targetUserId === params.data.userId || n.targetRole == null).slice(-5).map((n) => ({
    id: n.id,
    title: n.title,
    message: n.message,
    type: n.type,
    targetRole: n.targetRole,
    targetUserId: n.targetUserId,
    isRead: n.isRead,
    sentBy: n.sentBy,
    senderName: null,
    createdAt: n.createdAt.toISOString(),
  }));

  if (!learnerRecord) {
    res.json({
      learner: null,
      overallAverage: 0,
      attendancePct: 0,
      recentMarks: [],
      notifications: myNotifications,
      timetableToday: [],
    });
    return;
  }

  const allMarks = await db.select().from(marksTable).where(eq(marksTable.learnerId, learnerRecord.id));
  const percentages = allMarks.map((m) => parseFloat(m.percentage as string));
  const overallAverage = percentages.length > 0 ? Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length * 10) / 10 : 0;

  const attendance = await db.select().from(attendanceTable).where(eq(attendanceTable.learnerId, learnerRecord.id));
  const present = attendance.filter((a) => a.status === "present" || a.status === "late").length;
  const attendancePct = attendance.length > 0 ? Math.round((present / attendance.length) * 100 * 10) / 10 : 0;

  const recentMarks = allMarks.slice(-5).map((m) => ({
    id: m.id,
    learnerId: m.learnerId,
    learnerName: learnerRecord.fullName,
    subjectId: m.subjectId,
    subjectName: null,
    assessmentType: m.assessmentType,
    assessmentName: m.assessmentName,
    score: parseFloat(m.score as string),
    maxScore: parseFloat(m.maxScore as string),
    percentage: parseFloat(m.percentage as string),
    term: m.term,
    grade: m.grade,
    recordedBy: m.recordedBy,
    createdAt: m.createdAt.toISOString(),
  }));

  const today = new Date().toLocaleDateString("en-ZA", { weekday: "long" });
  const timetableEntries = learnerRecord.classId
    ? await db.select().from(timetableTable).where(eq(timetableTable.classId, learnerRecord.classId))
    : [];
  const timetableToday = timetableEntries.filter((e) => e.dayOfWeek === today).map((e) => ({
    id: e.id,
    classId: e.classId,
    className: null,
    subjectId: e.subjectId,
    subjectName: null,
    teacherId: e.teacherId,
    teacherName: null,
    dayOfWeek: e.dayOfWeek,
    startTime: e.startTime,
    endTime: e.endTime,
    room: e.room,
    createdAt: e.createdAt.toISOString(),
  }));

  res.json({
    learner: {
      id: learnerRecord.id,
      userId: learnerRecord.userId,
      admissionNumber: learnerRecord.admissionNumber,
      fullName: learnerRecord.fullName,
      grade: learnerRecord.grade,
      classId: learnerRecord.classId,
      className: null,
      parentId: learnerRecord.parentId,
      parentName: null,
      dateOfBirth: learnerRecord.dateOfBirth,
      gender: learnerRecord.gender,
      createdAt: learnerRecord.createdAt.toISOString(),
    },
    overallAverage,
    attendancePct,
    recentMarks,
    notifications: myNotifications,
    timetableToday,
  });
});

router.get("/dashboard/parent/:userId", async (req, res): Promise<void> => {
  const params = GetParentDashboardParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const children = await db.select().from(learnersTable).where(eq(learnersTable.parentId, params.data.userId));

  const formattedChildren = children.map((l) => ({
    id: l.id,
    userId: l.userId,
    admissionNumber: l.admissionNumber,
    fullName: l.fullName,
    grade: l.grade,
    classId: l.classId,
    className: null,
    parentId: l.parentId,
    parentName: null,
    dateOfBirth: l.dateOfBirth,
    gender: l.gender,
    createdAt: l.createdAt.toISOString(),
  }));

  const notifications = await db.select().from(notificationsTable);
  const myNotifications = notifications.filter((n) => n.targetRole === "parent" || n.targetUserId === params.data.userId || n.targetRole == null).slice(-5).map((n) => ({
    id: n.id,
    title: n.title,
    message: n.message,
    type: n.type,
    targetRole: n.targetRole,
    targetUserId: n.targetUserId,
    isRead: n.isRead,
    sentBy: n.sentBy,
    senderName: null,
    createdAt: n.createdAt.toISOString(),
  }));

  const childIds = children.map((c) => c.id);
  const fees = await db.select().from(feesTable);
  const childFees = fees.filter((f) => childIds.includes(f.learnerId));
  const outstandingFees = childFees.reduce((sum, f) => {
    const total = parseFloat(f.totalAmount as string);
    const paid = parseFloat(f.amountPaid as string);
    return sum + Math.max(0, total - paid);
  }, 0);

  const payments = await db.select().from(paymentsTable);
  const recentPayments = payments.filter((p) => childIds.includes(p.learnerId)).slice(-5).map((p) => ({
    id: p.id,
    feeId: p.feeId,
    learnerId: p.learnerId,
    learnerName: null,
    amount: parseFloat(p.amount as string),
    paymentMethod: p.paymentMethod,
    referenceNumber: p.referenceNumber,
    status: p.status,
    processedAt: p.processedAt?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
  }));

  const childrenProgress = await Promise.all(children.map(async (child) => {
    const allMarks = await db.select().from(marksTable).where(eq(marksTable.learnerId, child.id));
    const percentages = allMarks.map((m) => parseFloat(m.percentage as string));
    const overallAverage = percentages.length > 0 ? Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length * 10) / 10 : 0;

    return {
      learnerId: child.id,
      learnerName: child.fullName,
      grade: child.grade,
      overallAverage,
      subjectAverages: [],
      recentMarks: [],
    };
  }));

  res.json({
    children: formattedChildren,
    notifications: myNotifications,
    outstandingFees,
    recentPayments,
    childrenProgress,
  });
});

router.get("/dashboard/accountant", async (_req, res): Promise<void> => {
  const fees = await db.select().from(feesTable);
  const payments = await db.select().from(paymentsTable);

  const totalRevenue = fees.reduce((sum, f) => sum + parseFloat(f.totalAmount as string), 0);
  const totalCollected = fees.reduce((sum, f) => sum + parseFloat(f.amountPaid as string), 0);
  const outstanding = totalRevenue - totalCollected;
  const collectionRate = totalRevenue > 0 ? Math.round((totalCollected / totalRevenue) * 100 * 10) / 10 : 0;
  const overdueCount = fees.filter((f) => f.status === "overdue").length;

  const recentPayments = payments.slice(-5).map((p) => ({
    id: p.id,
    feeId: p.feeId,
    learnerId: p.learnerId,
    learnerName: null,
    amount: parseFloat(p.amount as string),
    paymentMethod: p.paymentMethod,
    referenceNumber: p.referenceNumber,
    status: p.status,
    processedAt: p.processedAt?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
  }));

  const termMap: Record<number, { totalAmount: number; collected: number }> = {};
  for (const fee of fees) {
    if (!termMap[fee.term]) termMap[fee.term] = { totalAmount: 0, collected: 0 };
    termMap[fee.term].totalAmount += parseFloat(fee.totalAmount as string);
    termMap[fee.term].collected += parseFloat(fee.amountPaid as string);
  }
  const feesByTerm = Object.entries(termMap).map(([term, data]) => ({
    term: parseInt(term),
    totalAmount: data.totalAmount,
    collected: data.collected,
    outstanding: data.totalAmount - data.collected,
  }));

  res.json({
    totalRevenue,
    outstanding,
    collectionRate,
    overdueCount,
    recentPayments,
    feesByTerm,
  });
});

export default router;
