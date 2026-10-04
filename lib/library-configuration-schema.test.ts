import { describe, expect, it } from "vitest";
import { libraryConfigurationSchema } from "@/lib/library-configuration-schema";
import { demoSettings, settingsTimeSlots } from "@/lib/settings-management";
import { membershipPlans } from "@/lib/student-management";

const validConfiguration = {
  settings: demoSettings,
  timeSlots: settingsTimeSlots,
  membershipPlans: membershipPlans.map((plan) => ({ ...plan, active: true })),
};

describe("library configuration API schema", () => {
  it("accepts persisted library settings, slots, and membership plans", () => {
    expect(
      libraryConfigurationSchema.safeParse(validConfiguration).success,
    ).toBe(true);
  });

  it("rejects duplicate slot names and invalid time ranges", () => {
    const result = libraryConfigurationSchema.safeParse({
      ...validConfiguration,
      timeSlots: [
        ...settingsTimeSlots,
        {
          id: "duplicate",
          name: "Morning",
          startTime: "21:00",
          endTime: "08:00",
          active: true,
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects duplicate membership plan names", () => {
    const result = libraryConfigurationSchema.safeParse({
      ...validConfiguration,
      membershipPlans: [
        ...validConfiguration.membershipPlans,
        { ...validConfiguration.membershipPlans[0], id: "duplicate" },
      ],
    });

    expect(result.success).toBe(false);
  });
});
