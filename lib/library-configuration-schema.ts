import { z } from "zod";
import { weekDays } from "@/lib/settings-management";

const timeValue = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/);
const dayHoursSchema = z.object({
  closed: z.boolean(),
  opensAt: timeValue,
  closesAt: timeValue,
});

const operatingHoursSchema = z.object(
  Object.fromEntries(weekDays.map((day) => [day, dayHoursSchema])) as Record<
    (typeof weekDays)[number],
    typeof dayHoursSchema
  >,
);

export const librarySettingsSchema = z.object({
  libraryName: z.string().trim().min(1).max(100),
  logoDataUrl: z.string().max(2_000_000),
  contactEmail: z.string().trim().email(),
  phone: z.string().trim().max(30),
  address: z.string().trim().max(200),
  city: z.string().trim().max(80),
  state: z.string().trim().max(80),
  postalCode: z.string().trim().max(20),
  timezone: z.string().trim().min(1).max(80),
  currency: z.literal("INR"),
  operatingHours: operatingHoursSchema,
  receiptHeader: z.string().max(160),
  receiptFooter: z.string().max(500),
  receiptContact: z.string().max(160),
  receiptPrefix: z.string().trim().min(1).max(8),
  startingReceiptNumber: z.number().int().min(1),
  receiptShowAddress: z.boolean(),
  receiptShowContact: z.boolean(),
  notifications: z.object({
    membershipExpiry: z.boolean(),
    feeDue: z.boolean(),
    overduePayment: z.boolean(),
    admissions: z.boolean(),
    dailyCollection: z.boolean(),
  }),
  profileName: z.string().trim().min(1).max(80),
  profileEmail: z.string().trim().email(),
  profilePhone: z.string().trim().max(30),
});

const timeSlotSchema = z
  .object({
    id: z.string().trim().min(1).max(80),
    name: z.string().trim().min(1).max(32),
    startTime: timeValue,
    endTime: timeValue,
    active: z.boolean().default(true),
  })
  .refine((slot) => slot.startTime < slot.endTime, {
    path: ["endTime"],
    message: "End time must be later than start time.",
  });

const membershipPlanSchema = z.object({
  id: z.string().trim().min(1).max(80),
  name: z.string().trim().min(1).max(60),
  monthlyPrice: z.number().finite().min(0).max(10_000_000),
  description: z.string().trim().max(200),
  active: z.boolean().default(true),
});

export const libraryConfigurationSchema = z
  .object({
    settings: librarySettingsSchema,
    timeSlots: z.array(timeSlotSchema).max(40),
    membershipPlans: z.array(membershipPlanSchema).min(1).max(40),
  })
  .superRefine((configuration, context) => {
    for (const [field, values] of [
      ["timeSlots", configuration.timeSlots],
      ["membershipPlans", configuration.membershipPlans],
    ] as const) {
      const seenIds = new Set<string>();
      const seenNames = new Set<string>();
      values.forEach((value, index) => {
        const normalizedName = value.name.trim().toLowerCase();
        if (seenIds.has(value.id) || seenNames.has(normalizedName)) {
          context.addIssue({
            code: "custom",
            path: [field, index],
            message: "IDs and names must be unique within this list.",
          });
        }
        seenIds.add(value.id);
        seenNames.add(normalizedName);
      });
    }
  });
