import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createStudentEmail } from "@/lib/admissions";
import {
  CloudinaryConfigurationError,
  deleteStudentDocument,
  uploadStudentDocument,
  type UploadedStudentDocument,
} from "@/lib/server/cloudinary";
import {
  authorizeStudentRequest,
  isDuplicateKeyError,
  serializeStudent,
} from "@/lib/server/student-api";
import { getOrCreateLibraryConfiguration } from "@/lib/server/library-configuration";
import { studentDocumentImageSchema } from "@/lib/student-api-schema";
import { StudentModel } from "@/models/Student";

export const runtime = "nodejs";

const amountSchema = z
  .string()
  .regex(/^\d+(?:\.\d{1,2})?$/)
  .optional()
  .default("0");
const admissionSchema = z.object({
  name: z.string().trim().min(1).max(80),
  phone: z.string().trim().min(1).max(30),
  guardianName: z.string().trim().min(1).max(80),
  guardianPhone: z.string().trim().min(1).max(30),
  documentImageDataUrl: studentDocumentImageSchema,
  planId: z.string().trim().min(1).max(80),
  durationMonths: z.enum(["1", "3", "6", "12"]),
  startDate: z.string().trim().min(1),
  endDate: z.string().trim().min(1),
  admissionFee: amountSchema,
  deposit: amountSchema,
  discount: amountSchema,
  initialPayment: amountSchema,
  paymentMethod: z.enum(["Cash", "UPI", "Bank transfer", "Card", "Other"]),
});

export async function GET(request: Request) {
  try {
    const access = await authorizeStudentRequest(request);
    if ("response" in access) return access.response;

    const records = await StudentModel.find({ libraryId: access.libraryId })
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({
      success: true,
      admissions: records.map(serializeStudent),
    });
  } catch (error) {
    console.error("List admissions failed", error);
    return NextResponse.json(
      { success: false, message: "Admissions could not be loaded." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  let uploadedDocument: UploadedStudentDocument | undefined;
  try {
    const access = await authorizeStudentRequest(request);
    if ("response" in access) return access.response;

    const body = await request.json().catch(() => null);
    const parsed = admissionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Complete the required admission details.",
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const configuration = await getOrCreateLibraryConfiguration(
      access.libraryId,
    );
    const plan = configuration?.membershipPlans.find(
      (membershipPlan) => membershipPlan.id === parsed.data.planId,
    );
    if (!plan || plan.active === false) {
      return NextResponse.json(
        { success: false, message: "Choose a valid membership plan." },
        { status: 400 },
      );
    }

    const admissionFee = Number(parsed.data.admissionFee);
    const deposit = Number(parsed.data.deposit);
    const discount = Number(parsed.data.discount);
    const initialPayment = Number(parsed.data.initialPayment);
    const totalDue =
      plan.monthlyPrice * Number(parsed.data.durationMonths) +
      admissionFee +
      deposit -
      discount;
    if (
      discount >
        plan.monthlyPrice * Number(parsed.data.durationMonths) +
          admissionFee +
          deposit ||
      initialPayment > totalDue
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "The admission payment amounts are invalid.",
        },
        { status: 400 },
      );
    }

    const existingStudents = await StudentModel.find({
      libraryId: access.libraryId,
    })
      .select("email")
      .lean();
    const studentEmail = createStudentEmail(
      parsed.data.name,
      existingStudents.map((student) => student.email),
    );
    uploadedDocument = await uploadStudentDocument(
      parsed.data.documentImageDataUrl,
    );
    const today = new Date().toISOString().slice(0, 10);
    const studentId = new StudentModel()._id;
    const student = await StudentModel.create({
      _id: studentId,
      libraryId: access.libraryId,
      name: parsed.data.name,
      email: studentEmail,
      phone: parsed.data.phone,
      guardianName: parsed.data.guardianName,
      guardianPhone: parsed.data.guardianPhone,
      ...uploadedDocument,
      membershipName: plan.name,
      membershipEndsOn: parsed.data.endDate,
      monthlyFee: plan.monthlyPrice,
      joinedOn: parsed.data.startDate,
      status: "Active",
      payments:
        initialPayment > 0
          ? [
              {
                id: crypto.randomUUID(),
                date: today,
                amount: initialPayment,
                method: parsed.data.paymentMethod,
                reference: `ADM-${studentId.toString().slice(-8).toUpperCase()}`,
                description: "Initial admission payment",
              },
            ]
          : [],
    });
    const admission = serializeStudent(student.toObject());

    return NextResponse.json(
      { success: true, admission, student: admission },
      { status: 201 },
    );
  } catch (error) {
    if (uploadedDocument) {
      await deleteStudentDocument(uploadedDocument.documentImagePublicId);
    }
    if (error instanceof CloudinaryConfigurationError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 503 },
      );
    }
    if (isDuplicateKeyError(error)) {
      return NextResponse.json(
        {
          success: false,
          message: "Could not generate a unique student email.",
        },
        { status: 409 },
      );
    }
    console.error("Create admission failed", error);
    return NextResponse.json(
      { success: false, message: "Admission could not be created." },
      { status: 500 },
    );
  }
}
