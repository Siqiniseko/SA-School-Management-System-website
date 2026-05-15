import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import {
  ListUsersQueryParams,
  CreateUserBody,
  GetUserParams,
  UpdateUserParams,
  UpdateUserBody,
  DeleteUserParams,
} from "@workspace/api-zod";
import crypto from "crypto";

const router: IRouter = Router();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function formatUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    profileImageUrl: user.profileImageUrl,
    createdAt: user.createdAt.toISOString(),
  };
}

router.get("/users", async (req, res): Promise<void> => {
  const params = ListUsersQueryParams.safeParse(req.query);
  let query = db.select().from(usersTable);

  if (params.success && params.data.role) {
    const users = await db.select().from(usersTable).where(eq(usersTable.role, params.data.role));
    res.json(users.map(formatUser));
    return;
  }

  const users = await query;
  res.json(users.map(formatUser));
});

router.post("/users", async (req, res): Promise<void> => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { password, ...rest } = parsed.data;
  const [user] = await db.insert(usersTable).values({
    ...rest,
    email: rest.email ?? null,
    phone: rest.phone ?? null,
    passwordHash: hashPassword(password),
  }).returning();

  res.status(201).json(formatUser(user));
});

router.get("/users/:id", async (req, res): Promise<void> => {
  const params = GetUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, params.data.id));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(formatUser(user));
});

router.patch("/users/:id", async (req, res): Promise<void> => {
  const params = UpdateUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.fullName != null) updates.fullName = parsed.data.fullName;
  if (parsed.data.email != null) updates.email = parsed.data.email;
  if (parsed.data.phone != null) updates.phone = parsed.data.phone;
  if (parsed.data.profileImageUrl != null) updates.profileImageUrl = parsed.data.profileImageUrl;
  if (parsed.data.password != null) updates.passwordHash = hashPassword(parsed.data.password);

  if (Object.keys(updates).length === 0) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, params.data.id));
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(formatUser(user));
    return;
  }

  const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, params.data.id)).returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(formatUser(user));
});

router.delete("/users/:id", async (req, res): Promise<void> => {
  const params = DeleteUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(usersTable).where(eq(usersTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
