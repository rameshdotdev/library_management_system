import { z } from "zod";

export const studentDocumentImageSchema = z
  .union([
    z.literal(""),
    z
      .string()
      .regex(/^data:image\/(?:jpeg|png|webp);base64,/i)
      .max(1_400_000),
  ])
  .optional();

export const studentCreateSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z
    .string()
    .trim()
    .email()
    .transform((email) => email.toLowerCase()),
  phone: z.string().trim().min(1).max(30),
  guardianName: z.string().trim().min(1).max(80),
  guardianPhone: z.string().trim().max(30).optional(),
  documentImageDataUrl: studentDocumentImageSchema,
  status: z.enum(["Active", "On hold", "Archived"]).default("Active"),
  membershipName: z.string().trim().min(1).max(80).default("Standard"),
  membershipEndsOn: z.string().trim().min(1),
  monthlyFee: z.number().nonnegative(),
});

export const studentUpdateSchema = studentCreateSchema.partial();
