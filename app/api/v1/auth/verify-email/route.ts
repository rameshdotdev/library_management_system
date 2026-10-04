import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { connectToDatabase } from "@/lib/server/db";
import { UserModel } from "@/models/User";

export const runtime = "nodejs";

const verifyEmailSchema = z.object({
  token: z.string().min(10),
});

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json().catch(() => null);
    const parsed = verifyEmailSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "The verification token is invalid.",
          },
        },
        { status: 400 },
      );
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(parsed.data.token)
      .digest("hex");
    const user = await UserModel.findOne({
      emailVerificationTokenHash: tokenHash,
      emailVerificationExpiresAt: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_TOKEN",
            message: "This verification link is invalid or has expired.",
          },
        },
        { status: 400 },
      );
    }

    user.isEmailVerified = true;
    user.emailVerificationTokenHash = undefined;
    user.emailVerificationExpiresAt = null;
    await user.save();

    return NextResponse.json(
      { success: true, message: "Email verified successfully." },
      { status: 200 },
    );
  } catch (error) {
    console.error("Verify email failed", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VERIFY_EMAIL_FAILED",
          message: "The email could not be verified.",
        },
      },
      { status: 500 },
    );
  }
}
