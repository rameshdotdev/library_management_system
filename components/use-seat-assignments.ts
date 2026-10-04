"use client";

import { useEffect, useState } from "react";
import { isAssignmentArray, type SeatAssignment } from "@/lib/seat-management";

export function useSeatAssignments() {
  const [assignments, setAssignments] = useState<SeatAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadAssignments() {
      try {
        const response = await fetch("/api/v1/seat-assignments");
        const payload = (await response.json()) as {
          assignments?: unknown;
          message?: string;
        };
        if (!response.ok || !isAssignmentArray(payload.assignments)) {
          throw new Error(
            payload.message ?? "Assignments could not be loaded.",
          );
        }
        if (active) setAssignments(payload.assignments);
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Assignments could not be loaded.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadAssignments();
    return () => {
      active = false;
    };
  }, []);

  return { assignments, setAssignments, loading, error };
}
