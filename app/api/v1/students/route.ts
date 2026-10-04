import { NextResponse } from "next/server";

import { studentCreateSchema } from "@/lib/student-api-schema";
import {
  authorizeStudentRequest,
  isDuplicateKeyError,
  serializeStudent,
} from "@/lib/server/student-api";
import { StudentModel } from "@/models/Student";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const access = await authorizeStudentRequest(request);
    if ("response" in access) return access.response;

    const records = await StudentModel.find({ libraryId: access.libraryId })
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({
      success: true,
      students: records.map(serializeStudent),
    });
  } catch (error) {
    console.error("List students failed", error);
    return NextResponse.json(
      { success: false, message: "Students could not be loaded." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const access = await authorizeStudentRequest(request);
    if ("response" in access) return access.response;

    const body = await request.json().catch(() => null);
    const parsed = studentCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Please complete all required student details.",
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const duplicateEmail = await StudentModel.exists({
      libraryId: access.libraryId,
      email: parsed.data.email,
    });

    if (duplicateEmail) {
      return NextResponse.json(
        {
          success: false,
          message: "A student with this email address already exists.",
        },
        { status: 409 },
      );
    }

    const student = await StudentModel.create({
      libraryId: access.libraryId,
      joinedOn: new Date().toISOString().slice(0, 10),
      payments: [],
      ...parsed.data,
    });

    return NextResponse.json(
      { success: true, student: serializeStudent(student.toObject()) },
      { status: 201 },
    );
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return NextResponse.json(
        {
          success: false,
          message: "A student with this email already exists.",
        },
        { status: 409 },
      );
    }
    console.error("Create student failed", error);
    return NextResponse.json(
      { success: false, message: "Student could not be created." },
      { status: 500 },
    );
  }
}
