import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import {
  getSessionCookieOptions,
  hashSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS,
} from "@/lib/server/auth";
import { connectToDatabase } from "@/lib/server/db";
import { SessionModel } from "@/models/Session";
import { UserModel } from "@/models/User";

export const runtime = "nodejs";

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
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHENTICATED", message: "Not authenticated." },
        },
        { status: 401 },
      );
    }

    const session = await SessionModel.findOne({
      tokenHash: hashSessionToken(token),
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHENTICATED", message: "Session expired." },
        },
        { status: 401 },
      );
    }

    const user = await UserModel.findById(session.userId).lean();
    if (!user || user.status !== "active") {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHENTICATED", message: "Session expired." },
        },
        { status: 401 },
      );
    }

    const nextExpiry = new Date(Date.now() + SESSION_TTL_MS);
    session.expiresAt = nextExpiry;
    await session.save();

    const response = NextResponse.json(
      { user: sanitizeUser(user) },
      { status: 200 },
    );
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      ...getSessionCookieOptions(),
      expires: nextExpiry,
      maxAge: Math.floor(SESSION_TTL_MS / 1000),
    });

    return response;
  } catch (error) {
    console.error("Auth refresh failed", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "REFRESH_FAILED", message: "Session refresh failed." },
      },
      { status: 500 },
    );
  }
}
