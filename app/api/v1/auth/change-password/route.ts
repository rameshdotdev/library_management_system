import { NextResponse } from "next/server";
import { z } from "zod";

import {
  getCurrentUserFromRequest,
  hashPassword,
  verifyPassword,
} from "@/lib/server/auth";
import { connectToDatabase } from "@/lib/server/db";
import { UserModel } from "@/models/User";

export const runtime = "nodejs";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).regex(/[a-z]/).regex(/[A-Z]/).regex(/[0-9]/),
});

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const user = await getCurrentUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication is required." },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Use at least 8 characters with uppercase, lowercase, and a number.",
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }
    if (parsed.data.currentPassword === parsed.data.newPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "Choose a password different from the current one.",
        },
        { status: 400 },
      );
    }

    const account = await UserModel.findById(user.id);
    if (
      !account ||
      !(await verifyPassword(parsed.data.currentPassword, account.passwordHash))
    ) {
      return NextResponse.json(
        { success: false, message: "The current password is incorrect." },
        { status: 400 },
      );
    }

    account.passwordHash = await hashPassword(parsed.data.newPassword);
    await account.save();

    return NextResponse.json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.error("Change password failed", error);
    return NextResponse.json(
      { success: false, message: "Password could not be changed." },
      { status: 500 },
    );
  }
}
