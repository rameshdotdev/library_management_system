import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createSessionToken, getSessionCookieOptions, hashSessionToken, SESSION_COOKIE_NAME, SESSION_TTL_MS, verifyPassword } from "@/lib/server/auth";
import { connectToDatabase } from "@/lib/server/db";
import { SessionModel } from "@/models/Session";
import { UserModel } from "@/models/User";

export const runtime = "nodejs";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional().default(false),
});

function sanitizeUser(user: { _id: unknown; fullName: string; email: string }) {
  return {
    id: String(user._id),
    fullName: user.fullName,
    email: user.email,
  };
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json().catch(() => null);
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Please enter a valid email and password.",
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { email, password, rememberMe } = parsed.data;
    const normalizedEmail = email.trim().toLowerCase();
    const user = await UserModel.findOne({ email: normalizedEmail }).lean();

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json(
        {
          message: "Invalid email or password.",
        },
        { status: 401 },
      );
    }

    if (user.status !== "active") {
      return NextResponse.json(
        {
          message: "This account is not currently active.",
        },
        { status: 403 },
      );
    }

    const sessionToken = createSessionToken();
    const expiresAt = new Date(Date.now() + (rememberMe ? SESSION_TTL_MS * 2 : SESSION_TTL_MS));

    await SessionModel.create({
      userId: user._id,
      tokenHash: hashSessionToken(sessionToken),
      expiresAt,
      revokedAt: null,
    });

    const response = NextResponse.json({ user: sanitizeUser(user) }, { status: 200 });
    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      ...getSessionCookieOptions(),
      maxAge: Math.floor((rememberMe ? SESSION_TTL_MS * 2 : SESSION_TTL_MS) / 1000),
      expires: new Date(Date.now() + (rememberMe ? SESSION_TTL_MS * 2 : SESSION_TTL_MS)),
    });

    return response;
  } catch (error) {
    console.error("Auth login failed", error);
    return NextResponse.json(
      {
        message: "Sign in could not be completed.",
      },
      { status: 500 },
    );
  }
}
