import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import learnersRouter from "./learners";
import classesRouter from "./classes";
import subjectsRouter from "./subjects";
import attendanceRouter from "./attendance";
import marksRouter from "./marks";
import notificationsRouter from "./notifications";
import feesRouter from "./fees";
import paymentsRouter from "./payments";
import timetableRouter from "./timetable";
import materialsRouter from "./materials";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(learnersRouter);
router.use(classesRouter);
router.use(subjectsRouter);
router.use(attendanceRouter);
router.use(marksRouter);
router.use(notificationsRouter);
router.use(feesRouter);
router.use(paymentsRouter);
router.use(timetableRouter);
router.use(materialsRouter);
router.use(dashboardRouter);

export default router;
