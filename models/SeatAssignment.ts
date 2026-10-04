import mongoose, { Schema } from "mongoose";
import type { AssignmentStatus } from "@/lib/seat-management";

export interface ISeatAssignment {
  libraryId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  studentName: string;
  roomId: string;
  roomName: string;
  seatNumber: string;
  timeSlotId: string;
  timeSlotName: string;
  startTime: string;
  endTime: string;
  startDate: string;
  endDate: string;
  status: AssignmentStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

const seatAssignmentSchema = new Schema<ISeatAssignment>(
  {
    libraryId: {
      type: Schema.Types.ObjectId,
      ref: "Library",
      required: true,
      index: true,
    },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    studentName: { type: String, required: true, trim: true },
    roomId: { type: String, required: true, trim: true },
    roomName: { type: String, required: true, trim: true },
    seatNumber: { type: String, required: true, trim: true },
    timeSlotId: { type: String, required: true, trim: true },
    timeSlotName: { type: String, required: true, trim: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    status: {
      type: String,
      enum: ["Active", "Scheduled", "Completed"],
      required: true,
    },
  },
  { timestamps: true },
);

seatAssignmentSchema.index({ libraryId: 1, roomId: 1, seatNumber: 1, startDate: 1, endDate: 1 });
seatAssignmentSchema.index({ libraryId: 1, studentId: 1, startDate: 1, endDate: 1 });

export const SeatAssignmentModel =
  (mongoose.models.SeatAssignment as mongoose.Model<ISeatAssignment>) ||
  mongoose.model<ISeatAssignment>("SeatAssignment", seatAssignmentSchema);