import crypto from "node:crypto";
import { isDuplicateKeyError } from "@/lib/server/student-api";
import { SeatAssignmentLockModel } from "@/models/SeatAssignmentLock";

export class SeatAssignmentBusyError extends Error {
  constructor() {
    super("This seat is being reserved. Please try again.");
  }
}

export async function withSeatAssignmentLock<T>(
  libraryId: string,
  roomId: string,
  seatNumber: string,
  operation: () => Promise<T>,
): Promise<T> {
  return withAssignmentLocks(
    [`${libraryId}:${roomId}:${seatNumber}`],
    operation,
  );
}

export async function withStudentAndSeatAssignmentLocks<T>(
  libraryId: string,
  studentId: string,
  roomId: string,
  seatNumber: string,
  operation: () => Promise<T>,
): Promise<T> {
  return withAssignmentLocks(
    [
      `${libraryId}:student:${studentId}`,
      `${libraryId}:${roomId}:${seatNumber}`,
    ],
    operation,
  );
}

async function acquireLock(lockId: string) {
  const ownerToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 30_000);

  try {
    await SeatAssignmentLockModel.create({
      _id: lockId,
      ownerToken,
      expiresAt,
    });
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;

    const recovered = await SeatAssignmentLockModel.findOneAndUpdate(
      { _id: lockId, expiresAt: { $lte: new Date() } },
      { $set: { ownerToken, expiresAt } },
      { new: true },
    );
    if (!recovered) throw new SeatAssignmentBusyError();
  }

  return async () => {
    await SeatAssignmentLockModel.deleteOne({ _id: lockId, ownerToken });
  };
}

async function withAssignmentLocks<T>(
  lockIds: string[],
  operation: () => Promise<T>,
): Promise<T> {
  const releases: Array<() => Promise<void>> = [];
  try {
    for (const lockId of lockIds.sort()) {
      releases.push(await acquireLock(lockId));
    }
    return await operation();
  } finally {
    await Promise.all(releases.reverse().map((release) => release()));
  }
}
