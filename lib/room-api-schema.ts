import { z } from "zod";

export const roomCreateSchema = z.object({
  name: z.string().trim().min(2).max(80),
  floor: z.string().trim().min(1).max(40),
  description: z.string().trim().max(200).default(""),
  seatPrefix: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{1,4}$/),
  capacity: z.number().int().min(1).max(500),
});

export const roomUpdateSchema = roomCreateSchema.partial();

export function roomIdFromName(name: string) {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "room"
  );
}
