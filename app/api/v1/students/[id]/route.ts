import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { studentUpdateSchema } from "@/lib/student-api-schema";
import {
  authorizeStudentRequest,
  isDuplicateKeyError,
  serializeStudent,
} from "@/lib/server/student-api";
import { StudentModel } from "@/models/Student";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const access = await authorizeStudentRequest(request);
    if ("response" in access) return access.response;

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, message: "Student not found." },
        { status: 404 },
      );
    }
    const student = await StudentModel.findOne({
      _id: id,
      libraryId: access.libraryId,
    }).lean();

    if (!student) {
      return NextResponse.json(
        { success: false, message: "Student not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      student: serializeStudent(student),
    });
  } catch (error) {
    console.error("Get student failed", error);
    return NextResponse.json(
      { success: false, message: "Student could not be loaded." },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const access = await authorizeStudentRequest(request);
    if ("response" in access) return access.response;

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, message: "Student not found." },
        { status: 404 },
      );
    }
    const body = await request.json().catch(() => null);
    const parsed = studentUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Please update a valid student profile.",
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const current = await StudentModel.findOne({
      _id: id,
      libraryId: access.libraryId,
    });
    if (!current) {
      return NextResponse.json(
        { success: false, message: "Student not found." },
        { status: 404 },
      );
    }

    const nextValues = parsed.data;
    if (
      nextValues.email &&
      (await StudentModel.exists({
        libraryId: access.libraryId,
        _id: { $ne: id },
        email: nextValues.email,
      }))
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "A student with this email address already exists.",
        },
        { status: 409 },
      );
    }

    Object.assign(current, nextValues);
    await current.save();

    return NextResponse.json({
      success: true,
      student: serializeStudent(current.toObject()),
    });
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
    console.error("Update student failed", error);
    return NextResponse.json(
      { success: false, message: "Student could not be updated." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const access = await authorizeStudentRequest(request);
    if ("response" in access) return access.response;

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, message: "Student not found." },
        { status: 404 },
      );
    }
    const student = await StudentModel.findOne({
      _id: id,
      libraryId: access.libraryId,
    });
    if (!student) {
      return NextResponse.json(
        { success: false, message: "Student not found." },
        { status: 404 },
      );
    }

    student.status = "Archived";
    await student.save();

    return NextResponse.json({
      success: true,
      student: serializeStudent(student.toObject()),
    });
  } catch (error) {
    console.error("Archive student failed", error);
    return NextResponse.json(
      { success: false, message: "Student could not be archived." },
      { status: 500 },
    );
  }
}
