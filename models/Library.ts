import mongoose, { Schema } from "mongoose";

export interface ILibrary {
  name: string;
  slug: string;
  directorId?: mongoose.Types.ObjectId;
  status: "active" | "pending" | "inactive";
  createdAt?: Date;
  updatedAt?: Date;
}

const librarySchema = new Schema<ILibrary>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    directorId: { type: Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: ["active", "pending", "inactive"],
      default: "pending",
    },
  },
  { timestamps: true },
);

librarySchema.index({ slug: 1 }, { unique: true });

export const LibraryModel =
  (mongoose.models.Library as mongoose.Model<ILibrary>) ||
  mongoose.model<ILibrary>("Library", librarySchema);
