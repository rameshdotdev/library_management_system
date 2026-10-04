import mongoose, { Schema } from "mongoose";
import type {
  LibrarySettings,
  TimeSlotPreference,
} from "@/lib/settings-management";
import type { MembershipPlan } from "@/lib/student-management";

export interface ILibraryConfiguration {
  libraryId: mongoose.Types.ObjectId;
  settings: LibrarySettings;
  timeSlots: TimeSlotPreference[];
  membershipPlans: MembershipPlan[];
  createdAt?: Date;
  updatedAt?: Date;
}

const timeSlotSchema = new Schema<TimeSlotPreference>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    active: { type: Boolean, default: true },
  },
  { _id: false },
);

const membershipPlanSchema = new Schema<MembershipPlan>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    monthlyPrice: { type: Number, required: true, min: 0 },
    description: { type: String, trim: true, default: "" },
    active: { type: Boolean, default: true },
  },
  { _id: false },
);

const libraryConfigurationSchema = new Schema<ILibraryConfiguration>(
  {
    libraryId: {
      type: Schema.Types.ObjectId,
      ref: "Library",
      required: true,
      unique: true,
    },
    settings: { type: Schema.Types.Mixed, required: true },
    timeSlots: { type: [timeSlotSchema], required: true, default: [] },
    membershipPlans: {
      type: [membershipPlanSchema],
      required: true,
      default: [],
    },
  },
  { timestamps: true },
);

libraryConfigurationSchema.index({ libraryId: 1 }, { unique: true });

export const LibraryConfigurationModel =
  (mongoose.models
    .LibraryConfiguration as mongoose.Model<ILibraryConfiguration>) ||
  mongoose.model<ILibraryConfiguration>(
    "LibraryConfiguration",
    libraryConfigurationSchema,
  );
