"use client";

import { useEffect, useState } from "react";
import {
  demoSettings,
  isLibrarySettings,
  isTimeSlotPreferenceArray,
  settingsTimeSlots,
  type LibrarySettings,
  type TimeSlotPreference,
} from "@/lib/settings-management";
import {
  isMembershipPlanArray,
  membershipPlans,
  type MembershipPlan,
} from "@/lib/student-management";

export type LibraryConfiguration = {
  settings: LibrarySettings;
  timeSlots: TimeSlotPreference[];
  membershipPlans: MembershipPlan[];
};

function isLibraryConfiguration(value: unknown): value is LibraryConfiguration {
  if (!value || typeof value !== "object") return false;
  const configuration = value as Partial<LibraryConfiguration>;
  return (
    isLibrarySettings(configuration.settings) &&
    isTimeSlotPreferenceArray(configuration.timeSlots) &&
    isMembershipPlanArray(configuration.membershipPlans)
  );
}

export function useLibraryConfiguration() {
  const [configuration, setConfiguration] = useState<LibraryConfiguration>({
    settings: demoSettings,
    timeSlots: settingsTimeSlots,
    membershipPlans: membershipPlans.map((plan) => ({ ...plan, active: true })),
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadConfiguration() {
      try {
        const response = await fetch("/api/v1/settings");
        const payload = await response.json();
        if (!response.ok || !isLibraryConfiguration(payload)) {
          throw new Error(payload.message ?? "Settings could not be loaded.");
        }
        if (active) {
          setConfiguration(payload);
          setError("");
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Settings could not be loaded.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadConfiguration();
    return () => {
      active = false;
    };
  }, []);

  async function saveConfiguration(
    nextConfiguration: LibraryConfiguration,
  ): Promise<LibraryConfiguration> {
    const response = await fetch("/api/v1/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nextConfiguration),
    });
    const payload = await response.json();
    if (!response.ok || !isLibraryConfiguration(payload)) {
      throw new Error(payload.message ?? "Settings could not be saved.");
    }
    setConfiguration(payload);
    setError("");
    return payload;
  }

  return { configuration, loading, error, saveConfiguration };
}
