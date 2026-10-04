import { NextResponse } from "next/server";

import { libraryConfigurationSchema } from "@/lib/library-configuration-schema";
import { getOrCreateLibraryConfiguration } from "@/lib/server/library-configuration";
import { authorizeStudentRequest } from "@/lib/server/student-api";
import { LibraryConfigurationModel } from "@/models/LibraryConfiguration";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const access = await authorizeStudentRequest(request);
    if ("response" in access) return access.response;

    const configuration = await getOrCreateLibraryConfiguration(
      access.libraryId,
    );
    if (!configuration)
      throw new Error("Library configuration was not created.");

    return NextResponse.json({
      success: true,
      settings: configuration.settings,
      timeSlots: configuration.timeSlots,
      membershipPlans: configuration.membershipPlans,
    });
  } catch (error) {
    console.error("Get library settings failed", error);
    return NextResponse.json(
      { success: false, message: "Library settings could not be loaded." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const access = await authorizeStudentRequest(request);
    if ("response" in access) return access.response;

    const body = await request.json().catch(() => null);
    const parsed = libraryConfigurationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Please correct the invalid settings, time slots, or plans.",
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const configuration = await LibraryConfigurationModel.findOneAndUpdate(
      { libraryId: access.libraryId },
      { $set: { ...parsed.data, libraryId: access.libraryId } },
      { new: true, upsert: true, runValidators: true },
    ).lean();

    return NextResponse.json({
      success: true,
      settings: configuration.settings,
      timeSlots: configuration.timeSlots,
      membershipPlans: configuration.membershipPlans,
    });
  } catch (error) {
    console.error("Save library settings failed", error);
    return NextResponse.json(
      { success: false, message: "Library settings could not be saved." },
      { status: 500 },
    );
  }
}
