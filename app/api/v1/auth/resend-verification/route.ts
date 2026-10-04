import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { normalizeEmail } from "@/lib/server/auth";
import { connectToDatabase } from "@/lib/server/db";
import { UserModel } from "@/models/User";

export const runtime = "nodejs";

const resendVerificationSchema = z.object({
  email: z.string().trim().email(),
});

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json().catch(() => null);
    const parsed = resendVerificationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Please provide a valid email address.",
          },
        },
        { status: 400 },
      );
    }

    const email = normalizeEmail(parsed.data.email);
    const user = await UserModel.findOne({ email });

    if (user && !user.isEmailVerified) {
      const verificationToken = crypto.randomBytes(24).toString("hex");
      user.emailVerificationTokenHash = crypto
        .createHash("sha256")
        .update(verificationToken)
        .digest("hex");
      user.emailVerificationExpiresAt = new Date(
        Date.now() + 1000 * 60 * 60 * 24,
      );
      await user.save();
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "If the account exists and still needs verification, a new email will be sent.",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Resend verification failed", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "RESEND_VERIFICATION_FAILED",
          message: "The verification message could not be sent.",
        },
      },
      { status: 500 },
    );
  }
}
