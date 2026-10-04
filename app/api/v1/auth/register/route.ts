import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createSessionToken, getSessionCookieOptions, hashPassword, hashSessionToken, normalizeEmail, SESSION_COOKIE_NAME, SESSION_TTL_MS } from "@/lib/server/auth";
import { connectToDatabase } from "@/lib/server/db";
import { LibraryModel } from "@/models/Library";
import { SessionModel } from "@/models/Session";
import { UserModel } from "@/models/User";

export const runtime = "nodejs";

const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  libraryName: z.string().trim().min(2).max(100),
  email: z.string().trim().email(),
  phone: z.string().trim().min(5).max(20),
  password: z.string().min(8).regex(/[a-z]/).regex(/[A-Z]/).regex(/[0-9]/),
});

function sanitizeUser(user: { _id: unknown; fullName: string; email: string }) {
  return {
    id: String(user._id),
    fullName: user.fullName,
    email: user.email,
  };
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "library";
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json().catch(() => null);
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Registration details are invalid.",
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { fullName, libraryName, email, phone, password } = parsed.data;
    const normalizedEmail = normalizeEmail(email);

    const existingUser = await UserModel.findOne({ email: normalizedEmail }).lean();
    if (existingUser) {
      return NextResponse.json(
        {
          message: "An account with this email already exists.",
        },
        { status: 409 },
      );
    }

    const baseSlug = slugify(libraryName);
    let candidateSlug = baseSlug;
    let counter = 1;

    while (await LibraryModel.exists({ slug: candidateSlug })) {
      candidateSlug = `${baseSlug}-${counter}`;
      counter += 1;
    }

    const library = await LibraryModel.create({
      name: libraryName,
      slug: candidateSlug,
      status: "pending",
    });

    const passwordHash = await hashPassword(password);
    const user = await UserModel.create({
      fullName,
      email: normalizedEmail,
      phone,
      passwordHash,
      libraryName,
      libraryId: library._id,
      role: "library-director",
      status: "active",
      isEmailVerified: false,
    });

    const verificationToken = crypto.randomBytes(24).toString("hex");
    const verificationTokenHash = crypto.createHash("sha256").update(verificationToken).digest("hex");

    user.emailVerificationTokenHash = verificationTokenHash;
    user.emailVerificationExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);
    await user.save();

    const sessionToken = createSessionToken();
    await SessionModel.create({
      userId: user._id,
      tokenHash: hashSessionToken(sessionToken),
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      revokedAt: null,
    });

    const response = NextResponse.json(
      {
        nextStep: "verify-email",
        user: sanitizeUser(user),
      },
      { status: 201 },
    );

    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      ...({
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: Math.floor(SESSION_TTL_MS / 1000),
      } as const),
    });

    return response;
  } catch (error) {
    console.error("Auth register failed", error);
    return NextResponse.json(
      {
        message: "The account could not be created. Please try again.",
      },
      { status: 500 },
    );
  }
}
