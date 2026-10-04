import { describe, expect, it } from "vitest";
import { roomCreateSchema, roomIdFromName } from "@/lib/room-api-schema";

describe("room API schema", () => {
  it("normalizes prefixes and accepts a valid generated seat count", () => {
    const result = roomCreateSchema.safeParse({
      name: "Quiet Study",
      floor: "Second floor",
      seatPrefix: "qs",
      capacity: 36,
    });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.seatPrefix).toBe("QS");
  });

  it("rejects invalid seat counts and prefixes", () => {
    expect(
      roomCreateSchema.safeParse({
        name: "Quiet Study",
        floor: "Second floor",
        seatPrefix: "Q-1",
        capacity: 0,
      }).success,
    ).toBe(false);
  });

  it("creates a stable slug from a room name", () => {
    expect(roomIdFromName(" Quiet Study / West ")).toBe("quiet-study-west");
  });
});
