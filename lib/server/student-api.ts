import { NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/server/auth";
import { connectToDatabase } from "@/lib/server/db";

export async function authorizeStudentRequest(request: Request) {
  await connectToDatabase();
  const user = await getCurrentUserFromRequest(request);

  if (!user) {
    return {
      response: NextResponse.json(
        { success: false, message: "Authentication is required." },
        { status: 401 },
      ),
    };
  }

  if (!user.libraryId) {
    return {
      response: NextResponse.json(
        {
          success: false,
          message: "This account is not assigned to a library.",
        },
        { status: 403 },
      ),
    };
  }

  return { libraryId: user.libraryId };
}

export function serializeStudent<
  T extends { _id: unknown; libraryId?: unknown; __v?: unknown },
>(student: T) {
  const fields = { ...student } as Record<string, unknown>;
  const id = String(fields._id);
  delete fields._id;
  delete fields.libraryId;
  delete fields.__v;
  return { ...fields, id };
}

export function isDuplicateKeyError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
}
