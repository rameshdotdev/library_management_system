import mongoose, { Schema } from "mongoose";

export interface IUser {
  fullName: string;
  email: string;
  phone: string;
  passwordHash: string;
  libraryName: string;
  libraryId?: mongoose.Types.ObjectId;
  role: "library-director" | "library-manager" | "receptionist" | "accountant" | "staff";
  status: "active" | "inactive" | "suspended";
  isEmailVerified: boolean;
  emailVerificationTokenHash?: string;
  emailVerificationExpiresAt?: Date | null;
  resetPasswordTokenHash?: string;
  resetPasswordExpiresAt?: Date | null;
  lastLoginAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const userSchema = new Schema<IUser>(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    libraryName: { type: String, required: true, trim: true },
    libraryId: { type: Schema.Types.ObjectId, ref: "Library" },
    role: {
      type: String,
      enum: ["library-director", "library-manager", "receptionist", "accountant", "staff"],
      default: "library-director",
    },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationTokenHash: { type: String, default: null },
    emailVerificationExpiresAt: { type: Date, default: null },
    resetPasswordTokenHash: { type: String, default: null },
    resetPasswordExpiresAt: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true },
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ libraryId: 1, status: 1 });

export const UserModel =
  (mongoose.models.User as mongoose.Model<IUser>) ||
  mongoose.model<IUser>("User", userSchema);
