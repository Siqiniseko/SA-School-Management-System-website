import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, notificationsTable, usersTable } from "@workspace/db";
import {
  ListNotificationsQueryParams,
  CreateNotificationBody,
  MarkNotificationReadParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function formatNotification(n: typeof notificationsTable.$inferSelect) {
  let senderName: string | null = null;
  if (n.sentBy) {
    const [sender] = await db.select().from(usersTable).where(eq(usersTable.id, n.sentBy));
    if (sender) senderName = sender.fullName;
  }

  return {
    id: n.id,
    title: n.title,
    message: n.message,
    type: n.type,
    targetRole: n.targetRole,
    targetUserId: n.targetUserId,
    isRead: n.isRead,
    sentBy: n.sentBy,
    senderName,
    createdAt: n.createdAt.toISOString(),
  };
}

router.get("/notifications", async (req, res): Promise<void> => {
  const params = ListNotificationsQueryParams.safeParse(req.query);
  let notifications = await db.select().from(notificationsTable).orderBy();

  if (params.success) {
    if (params.data.userId != null) {
      notifications = notifications.filter(
        (n) => n.targetUserId === params.data.userId || n.targetUserId == null
      );
    }
    if (params.data.unreadOnly) {
      notifications = notifications.filter((n) => !n.isRead);
    }
  }

  const formatted = await Promise.all(notifications.map(formatNotification));
  res.json(formatted);
});

router.post("/notifications", async (req, res): Promise<void> => {
  const parsed = CreateNotificationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [notification] = await db.insert(notificationsTable).values({
    title: parsed.data.title,
    message: parsed.data.message,
    type: parsed.data.type,
    targetRole: parsed.data.targetRole ?? null,
    targetUserId: parsed.data.targetUserId ?? null,
    sentBy: parsed.data.sentBy ?? null,
    isRead: false,
  }).returning();

  res.status(201).json(await formatNotification(notification));
});

router.patch("/notifications/:id/read", async (req, res): Promise<void> => {
  const params = MarkNotificationReadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [notification] = await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(eq(notificationsTable.id, params.data.id))
    .returning();

  if (!notification) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }

  res.json(await formatNotification(notification));
});

export default router;
