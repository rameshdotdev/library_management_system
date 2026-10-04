import { NextRequest, NextResponse } from "next/server";

import { hashSessionToken, SESSION_COOKIE_NAME } from "@/lib/server/auth";
import { connectToDatabase } from "@/lib/server/db";
import { SessionModel } from "@/models/Session";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (token) {
      await SessionModel.updateMany(
        {
          tokenHash: hashSessionToken(token),
          revokedAt: null,
        },
        {
          revokedAt: new Date(),
        },
      );
    }

    const response = NextResponse.json({ success: true, message: "Logged out." });
    response.cookies.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });

    return response;
  } catch (error) {
    console.error("Auth logout failed", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "LOGOUT_FAILED",
          message: "Logout could not be completed.",
        },
      },
      { status: 500 },
    );
  }
}
