import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { hashPassword } from "@/lib/server/auth";
import { connectToDatabase } from "@/lib/server/db";
import { UserModel } from "@/models/User";

export const runtime = "nodejs";

const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8).regex(/[a-z]/).regex(/[A-Z]/).regex(/[0-9]/),
});

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json().catch(() => null);
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "The reset link or password is invalid.",
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
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpiresAt: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_TOKEN",
            message: "This reset link is invalid or has expired.",
          },
        },
        { status: 400 },
      );
    }

    user.passwordHash = await hashPassword(parsed.data.password);
    user.resetPasswordTokenHash = undefined;
    user.resetPasswordExpiresAt = null;
    await user.save();

    return NextResponse.json(
      { success: true, message: "Password updated successfully." },
      { status: 200 },
    );
  } catch (error) {
    console.error("Reset password failed", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "RESET_PASSWORD_FAILED",
          message: "The password could not be reset.",
        },
      },
      { status: 500 },
    );
  }
}
