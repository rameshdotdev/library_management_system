import { NextResponse } from "next/server";
import { z } from "zod";

import { demoStudents, type Student } from "@/lib/student-management";

export const runtime = "nodejs";

let studentStore: Student[] = [...demoStudents];

const studentUpdateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional(),
  phone: z.string().trim().min(1).optional(),
  guardianName: z.string().trim().min(1).optional(),
  status: z.enum(["Active", "On hold", "Archived"]).optional(),
  membershipName: z.string().trim().min(1).optional(),
  membershipEndsOn: z.string().trim().min(1).optional(),
  monthlyFee: z.number().nonnegative().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const student = studentStore.find((item) => item.id === id);

  if (!student) {
    return NextResponse.json(
      { success: false, message: "Student not found." },
      { status: 404 },
    );
  }

  return NextResponse.json({ success: true, student });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
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

    const index = studentStore.findIndex((student) => student.id === id);

    if (index === -1) {
      return NextResponse.json(
        { success: false, message: "Student not found." },
        { status: 404 },
      );
    }

    const nextValues = parsed.data;
    const current = studentStore[index];

    if (
      nextValues.email &&
      studentStore.some(
        (student) =>
          student.id !== id &&
          student.email.toLowerCase() === nextValues.email!.toLowerCase(),
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "A student with this email address already exists.",
        },
        { status: 409 },
      );
    }

    studentStore[index] = {
      ...current,
      ...nextValues,
    };

    return NextResponse.json({
      success: true,
      student: studentStore[index],
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Student could not be updated." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const index = studentStore.findIndex((student) => student.id === id);

  if (index === -1) {
    return NextResponse.json(
      { success: false, message: "Student not found." },
      { status: 404 },
    );
  }

  studentStore[index] = {
    ...studentStore[index],
    status: "Archived",
  };

  return NextResponse.json({ success: true, student: studentStore[index] });
}
