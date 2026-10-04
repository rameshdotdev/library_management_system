import mongoose, { Schema } from "mongoose";

export interface IRoom {
  libraryId: mongoose.Types.ObjectId;
  id: string;
  name: string;
  floor: string;
  description: string;
  seatPrefix: string;
  capacity: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const roomSchema = new Schema<IRoom>(
  {
    libraryId: {
      type: Schema.Types.ObjectId,
      ref: "Library",
      required: true,
      index: true,
    },
    id: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    floor: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    seatPrefix: { type: String, required: true, trim: true, uppercase: true },
    capacity: { type: Number, required: true, min: 1, max: 500 },
  },
  { timestamps: true },
);

roomSchema.index({ libraryId: 1, id: 1 }, { unique: true });
roomSchema.index({ libraryId: 1, seatPrefix: 1 }, { unique: true });

export const RoomModel =
  (mongoose.models.Room as mongoose.Model<IRoom>) ||
  mongoose.model<IRoom>("Room", roomSchema);
