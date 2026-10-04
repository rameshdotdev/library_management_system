import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { SessionModel } from "@/models/Session";
import { UserModel } from "@/models/User";

export const SESSION_COOKIE_NAME =
  process.env.SESSION_COOKIE_NAME ?? "reading_room_session";

export const SESSION_TTL_MS = Number(process.env.SESSION_TTL ?? 1000 * 60 * 60 * 24 * 7);

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export function createSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashSessionToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function getSessionCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
    expires: new Date(Date.now() + SESSION_TTL_MS),
  };
}

export async function getCurrentUserFromRequest(request: Request) {
  const sessionToken = request.headers.get("cookie")
    ?.split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${SESSION_COOKIE_NAME}=`))
    ?.slice(`${SESSION_COOKIE_NAME}=`.length);

  if (!sessionToken) {
    return null;
  }

  const tokenHash = hashSessionToken(sessionToken);
  const session = await SessionModel.findOne({
    tokenHash,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  }).lean();

  if (!session || !session.userId) {
    return null;
  }

  const user = await UserModel.findById(session.userId).lean();

  if (!user || user.status !== "active") {
    return null;
  }

  return {
    id: String(user._id),
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    libraryId: user.libraryId ? String(user.libraryId) : undefined,
  };
}
