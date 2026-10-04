import mongoose, { Schema } from "mongoose";

export interface ISeatAssignmentLock {
  _id: string;
  ownerToken: string;
  expiresAt: Date;
}

const seatAssignmentLockSchema = new Schema<ISeatAssignmentLock>(
  {
    _id: { type: String, required: true },
    ownerToken: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { versionKey: false },
);

export const SeatAssignmentLockModel =
  (mongoose.models.SeatAssignmentLock as mongoose.Model<ISeatAssignmentLock>) ||
  mongoose.model<ISeatAssignmentLock>(
    "SeatAssignmentLock",
    seatAssignmentLockSchema,
  );