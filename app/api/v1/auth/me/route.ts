import { NextRequest, NextResponse } from "next/server";

import { getCurrentUserFromRequest } from "@/lib/server/auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);

  if (!user) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "UNAUTHENTICATED", message: "Not authenticated." },
      },
      { status: 401 },
    );
  }

  return NextResponse.json({ user }, { status: 200 });
}
