import mongoose, { Schema } from "mongoose";
import type { PaymentRecord, StudentStatus } from "@/lib/student-management";

export interface IStudent {
  libraryId: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  guardianName: string;
  guardianPhone?: string;
  documentImageDataUrl?: string;
  joinedOn: string;
  status: StudentStatus;
  membershipName: string;
  membershipEndsOn: string;
  monthlyFee: number;
  payments: PaymentRecord[];
  createdAt?: Date;
  updatedAt?: Date;
}

const paymentSchema = new Schema<PaymentRecord>(
  {
    id: { type: String, required: true },
    date: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    method: {
      type: String,
      enum: ["Cash", "UPI", "Bank transfer", "Card", "Other"],
      required: true,
    },
    customMethod: { type: String, default: "" },
    reference: { type: String, required: true },
    invoiceNumber: { type: String, default: "" },
    description: { type: String, required: true },
    notes: { type: String, default: "" },
  },
  { _id: false },
);

const studentSchema = new Schema<IStudent>(
  {
    libraryId: {
      type: Schema.Types.ObjectId,
      ref: "Library",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    guardianName: { type: String, required: true, trim: true },
    guardianPhone: { type: String, trim: true, default: "" },
    documentImageDataUrl: { type: String, default: "" },
    joinedOn: { type: String, required: true },
    status: {
      type: String,
      enum: ["Active", "On hold", "Archived"],
      default: "Active",
    },
    membershipName: { type: String, required: true, trim: true },
    membershipEndsOn: { type: String, required: true },
    monthlyFee: { type: Number, required: true, min: 0 },
    payments: { type: [paymentSchema], default: [] },
  },
  { timestamps: true },
);

studentSchema.index({ libraryId: 1, email: 1 }, { unique: true });

export const StudentModel =
  (mongoose.models.Student as mongoose.Model<IStudent>) ||
  mongoose.model<IStudent>("Student", studentSchema);
