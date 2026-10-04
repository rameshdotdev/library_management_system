import mongoose from "mongoose";
import { NextResponse } from "next/server";

import { seatAssignmentCreateSchema } from "@/lib/seat-assignment-api-schema";
import {
  SeatAssignmentBusyError,
  withStudentAndSeatAssignmentLocks,
} from "@/lib/server/seat-assignment-lock";
import { getOrCreateLibraryConfiguration } from "@/lib/server/library-configuration";
import { authorizeStudentRequest } from "@/lib/server/student-api";
import { dateRangesOverlap, intervalsOverlap } from "@/lib/seat-management";
import { RoomModel } from "@/models/Room";
import { SeatAssignmentModel } from "@/models/SeatAssignment";
import { StudentModel } from "@/models/Student";

export const runtime = "nodejs";

function serializeAssignment<
  T extends {
    _id: unknown;
    studentId: unknown;
    libraryId?: unknown;
    __v?: unknown;
  },
>(assignment: T) {
  const fields = { ...assignment } as Record<string, unknown>;
  const id = String(fields._id);
  fields.studentId = String(fields.studentId);
  delete fields._id;
  delete fields.libraryId;
  delete fields.__v;
  return { ...fields, id };
}

function seatBelongsToRoom(
  seatNumber: string,
  prefix: string,
  capacity: number,
) {
  const match = seatNumber.match(/^([A-Z0-9]{1,4})-(\d{2,3})$/);
  if (!match || match[1] !== prefix) return false;
  const seatIndex = Number(match[2]);
  return seatIndex >= 1 && seatIndex <= capacity;
}

function statusForDates(startDate: string, endDate: string, today: string) {
  if (endDate < today) return "Completed" as const;
  return startDate > today ? ("Scheduled" as const) : ("Active" as const);
}

export async function GET(request: Request) {
  try {
    const access = await authorizeStudentRequest(request);
    if ("response" in access) return access.response;

    const records = await SeatAssignmentModel.find({
      libraryId: access.libraryId,
    })
      .sort({ createdAt: -1 })
      .lean();

    const today = new Date().toISOString().slice(0, 10);
    const assignments = records.map((record) =>
      serializeAssignment({
        ...record,
        status: statusForDates(record.startDate, record.endDate, today),
      }),
    );
    return NextResponse.json({ success: true, assignments });
  } catch (error) {
    console.error("List seat assignments failed", error);
    return NextResponse.json(
      { success: false, message: "Seat assignments could not be loaded." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const access = await authorizeStudentRequest(request);
    if ("response" in access) return access.response;

    const body = await request.json().catch(() => null);
    const parsed = seatAssignmentCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Enter valid student, room, seat, time slot, and dates.",
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }
    if (!mongoose.isValidObjectId(parsed.data.studentId)) {
      return NextResponse.json(
        { success: false, message: "Choose a valid student." },
        { status: 400 },
      );
    }

    const [student, room] = await Promise.all([
      StudentModel.findOne({
        _id: parsed.data.studentId,
        libraryId: access.libraryId,
      }).lean(),
      RoomModel.findOne({
        id: parsed.data.roomId,
        libraryId: access.libraryId,
      }).lean(),
    ]);

    if (!student || student.status === "Archived") {
      return NextResponse.json(
        {
          success: false,
          message: "Choose an active student from this library.",
        },
        { status: 404 },
      );
    }
    if (!room) {
      return NextResponse.json(
        { success: false, message: "Room not found." },
        { status: 404 },
      );
    }
    const configuration = await getOrCreateLibraryConfiguration(
      access.libraryId,
    );
    const timeSlot = configuration?.timeSlots.find(
      (slot) => slot.id === parsed.data.timeSlotId && slot.active !== false,
    );
    if (
      !timeSlot ||
      timeSlot.name !== parsed.data.timeSlotName ||
      timeSlot.startTime !== parsed.data.startTime ||
      timeSlot.endTime !== parsed.data.endTime
    ) {
      return NextResponse.json(
        { success: false, message: "Choose an active configured time slot." },
        { status: 400 },
      );
    }
    if (
      !seatBelongsToRoom(parsed.data.seatNumber, room.seatPrefix, room.capacity)
    ) {
      return NextResponse.json(
        { success: false, message: "The selected seat is not in this room." },
        { status: 400 },
      );
    }

    const assignment = await withStudentAndSeatAssignmentLocks(
      access.libraryId,
      String(student._id),
      room.id,
      parsed.data.seatNumber,
      async () => {
        const [studentReservations, seatReservations] = await Promise.all([
          SeatAssignmentModel.find({
            libraryId: access.libraryId,
            studentId: student._id,
            status: { $ne: "Completed" },
            startDate: { $lte: parsed.data.endDate },
            endDate: { $gte: parsed.data.startDate },
          })
            .select("startDate endDate startTime endTime roomName seatNumber")
            .lean(),
          SeatAssignmentModel.find({
            libraryId: access.libraryId,
            roomId: room.id,
            seatNumber: parsed.data.seatNumber,
            status: { $ne: "Completed" },
            startDate: { $lte: parsed.data.endDate },
            endDate: { $gte: parsed.data.startDate },
          })
            .select("startDate endDate startTime endTime studentName")
            .lean(),
        ]);

        const studentConflict = studentReservations.find(
          (existing) =>
            dateRangesOverlap(
              existing.startDate,
              existing.endDate,
              parsed.data.startDate,
              parsed.data.endDate,
            ) &&
            intervalsOverlap(
              existing.startTime,
              existing.endTime,
              parsed.data.startTime,
              parsed.data.endTime,
            ),
        );
        if (studentConflict) {
          return {
            conflict: "student",
            seatNumber: studentConflict.seatNumber,
            roomName: studentConflict.roomName,
          } as const;
        }

        const seatConflict = seatReservations.find(
          (existing) =>
            dateRangesOverlap(
              existing.startDate,
              existing.endDate,
              parsed.data.startDate,
              parsed.data.endDate,
            ) &&
            intervalsOverlap(
              existing.startTime,
              existing.endTime,
              parsed.data.startTime,
              parsed.data.endTime,
            ),
        );
        if (seatConflict) {
          return {
            conflict: "seat",
            studentName: seatConflict.studentName,
          } as const;
        }

        const today = new Date().toISOString().slice(0, 10);
        const created = await SeatAssignmentModel.create({
          libraryId: access.libraryId,
          studentName: student.name,
          roomName: room.name,
          ...parsed.data,
          studentId: student._id,
          roomId: room.id,
          status: statusForDates(
            parsed.data.startDate,
            parsed.data.endDate,
            today,
          ),
        });
        return { assignment: created.toObject() } as const;
      },
    );

    if ("conflict" in assignment && assignment.conflict === "student") {
      return NextResponse.json(
        {
          success: false,
          message: `${student.name} already has ${assignment.seatNumber} assigned in ${assignment.roomName} during an overlapping date and time.`,
        },
        { status: 409 },
      );
    }
    if ("conflict" in assignment && assignment.conflict === "seat") {
      return NextResponse.json(
        {
          success: false,
          message: `${parsed.data.seatNumber} is already reserved by ${assignment.studentName} for an overlapping date and time.`,
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        assignment: serializeAssignment(assignment.assignment),
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof SeatAssignmentBusyError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 409 },
      );
    }
    console.error("Create seat assignment failed", error);
    return NextResponse.json(
      { success: false, message: "Seat assignment could not be created." },
      { status: 500 },
    );
  }
}
