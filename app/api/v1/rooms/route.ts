import { NextResponse } from "next/server";

import {
  authorizeStudentRequest,
  isDuplicateKeyError,
} from "@/lib/server/student-api";
import { roomCreateSchema, roomIdFromName } from "@/lib/room-api-schema";
import { rooms as defaultRooms } from "@/lib/seat-management";
import { RoomModel } from "@/models/Room";

export const runtime = "nodejs";

function serializeRoom<
  T extends { _id: unknown; libraryId?: unknown; __v?: unknown },
>(room: T) {
  const fields = { ...room } as Record<string, unknown>;
  delete fields._id;
  delete fields.libraryId;
  delete fields.__v;
  return fields;
}

export async function GET(request: Request) {
  try {
    const access = await authorizeStudentRequest(request);
    if ("response" in access) return access.response;

    if (!(await RoomModel.exists({ libraryId: access.libraryId }))) {
      try {
        await RoomModel.insertMany(
          defaultRooms.map((room) => ({
            ...room,
            libraryId: access.libraryId,
          })),
          { ordered: false },
        );
      } catch (error) {
        if (!isDuplicateKeyError(error)) throw error;
      }
    }

    const records = await RoomModel.find({ libraryId: access.libraryId })
      .sort({ floor: 1, name: 1 })
      .lean();
    return NextResponse.json({
      success: true,
      rooms: records.map((room) => serializeRoom(room)),
    });
  } catch (error) {
    console.error("List rooms failed", error);
    return NextResponse.json(
      { success: false, message: "Rooms could not be loaded." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const access = await authorizeStudentRequest(request);
    if ("response" in access) return access.response;

    const body = await request.json().catch(() => null);
    const parsed = roomCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Enter valid room details and a seat count from 1 to 500.",
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const duplicateName = await RoomModel.exists({
      libraryId: access.libraryId,
      name: {
        $regex: `^${parsed.data.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        $options: "i",
      },
    });
    if (duplicateName) {
      return NextResponse.json(
        { success: false, message: "A room with this name already exists." },
        { status: 409 },
      );
    }

    const room = await RoomModel.create({
      ...parsed.data,
      id: roomIdFromName(parsed.data.name),
      libraryId: access.libraryId,
    });

    return NextResponse.json(
      { success: true, room: serializeRoom(room.toObject()) },
      { status: 201 },
    );
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return NextResponse.json(
        {
          success: false,
          message: "The room name or seat prefix is already in use.",
        },
        { status: 409 },
      );
    }
    console.error("Create room failed", error);
    return NextResponse.json(
      { success: false, message: "Room could not be created." },
      { status: 500 },
    );
  }
}
