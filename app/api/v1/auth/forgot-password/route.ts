import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { normalizeEmail } from "@/lib/server/auth";
import { connectToDatabase } from "@/lib/server/db";
import { UserModel } from "@/models/User";

export const runtime = "nodejs";

const forgotPasswordSchema = z.object({
  email: z.string().trim().email(),
});

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json().catch(() => null);
    const parsed = forgotPasswordSchema.safeParse(body);

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

    if (user) {
      const resetToken = crypto.randomBytes(24).toString("hex");
      user.resetPasswordTokenHash = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");
      user.resetPasswordExpiresAt = new Date(Date.now() + 1000 * 60 * 60);
      await user.save();
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "If an account matches this email, a reset link has been sent.",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Forgot password failed", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "FORGOT_PASSWORD_FAILED",
          message: "The reset request could not be completed.",
        },
      },
      { status: 500 },
    );
  }
}
