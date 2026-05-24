import { Router, type IRouter, type Request } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { LoginBody } from "@workspace/api-zod";
import crypto from "crypto";

const router: IRouter = Router();
const authTokenSecret = process.env.SESSION_SECRET ?? "school-management-dev-secret";
const authTokenMaxAgeMs = 7 * 24 * 60 * 60 * 1000;

type AuthTokenPayload = {
  userId: number;
  role: string;
  exp: number;
};

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function signTokenPayload(payload: string): string {
  return crypto
    .createHmac("sha256", authTokenSecret)
    .update(payload)
    .digest("base64url");
}

function createAuthToken(user: { id: number; role: string }): string {
  const payload = Buffer.from(
    JSON.stringify({
      userId: user.id,
      role: user.role,
      exp: Date.now() + authTokenMaxAgeMs,
    } satisfies AuthTokenPayload),
  ).toString("base64url");

  return `${payload}.${signTokenPayload(payload)}`;
}

function readAuthToken(req: Request): AuthTokenPayload | null {
  const header = req.get("authorization");
  if (!header) return null;

  const [scheme, token] = header.split(/\s+/, 2);
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;

  const [payload, signature] = token.split(".", 2);
  if (!payload || !signature) return null;

  const expectedSignature = signTokenPayload(payload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<AuthTokenPayload>;
    if (typeof parsed.userId !== "number" || typeof parsed.exp !== "number") return null;
    if (parsed.exp < Date.now()) return null;
    return {
      userId: parsed.userId,
      role: typeof parsed.role === "string" ? parsed.role : "",
      exp: parsed.exp,
    };
  } catch {
    return null;
  }
}

function publicUser(user: typeof usersTable.$inferSelect) {
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

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username, password } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username));

  if (!user || user.passwordHash !== hashPassword(password)) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (req.session as any).userId = user.id;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (req.session as any).role = user.role;

  res.json({
    user: publicUser(user),
    token: createAuthToken(user),
    message: "Login successful",
  });
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  req.session.destroy(() => {
    res.json({ message: "Logged out successfully" });
  });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessionUserId = (req.session as any).userId as number | undefined;
  const tokenUserId = readAuthToken(req)?.userId;
  const userId = sessionUserId ?? tokenUserId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  res.json(publicUser(user));
});

export default router;
