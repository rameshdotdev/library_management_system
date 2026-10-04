import { NextResponse } from "next/server";
import { z } from "zod";

import { demoStudents, type Student } from "@/lib/student-management";

export const runtime = "nodejs";

let studentStore: Student[] = [...demoStudents];

const studentSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  phone: z.string().trim().min(1),
  guardianName: z.string().trim().min(1),
  status: z.enum(["Active", "On hold", "Archived"]).default("Active"),
  membershipName: z.string().trim().min(1).default("Standard"),
  membershipEndsOn: z.string().trim().min(1),
  monthlyFee: z.number().nonnegative(),
});

function makeStudentId() {
  const maxId = studentStore.reduce((max, student) => {
    const match = student.id.match(/stu-(\d+)/);
    const candidate = match ? Number(match[1]) : 0;
    return Math.max(max, candidate);
  }, 0);
  return `stu-${String(maxId + 1).padStart(3, "0")}`;
}

export async function GET() {
  return NextResponse.json({ success: true, students: studentStore });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = studentSchema.safeParse(body);

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

    const duplicateEmail = studentStore.some(
      (student) =>
        student.email.toLowerCase() === parsed.data.email.toLowerCase(),
    );

    if (duplicateEmail) {
      return NextResponse.json(
        {
          success: false,
          message: "A student with this email address already exists.",
        },
        { status: 409 },
      );
    }

    const student: Student = {
      id: makeStudentId(),
      joinedOn: new Date().toISOString().slice(0, 10),
      payments: [],
      ...parsed.data,
    };

    studentStore = [student, ...studentStore];

    return NextResponse.json({ success: true, student }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, message: "Student could not be created." },
      { status: 500 },
    );
  }
}
