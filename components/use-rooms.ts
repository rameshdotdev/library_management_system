"use client";

import { useEffect, useState } from "react";
import { isRoomArray, type Room } from "@/lib/seat-management";

export function useRooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadRooms() {
      try {
        const response = await fetch("/api/v1/rooms");
        const payload = (await response.json()) as { rooms?: unknown };
        if (!response.ok || !isRoomArray(payload.rooms)) {
          throw new Error("Rooms could not be loaded.");
        }
        if (active) setRooms(payload.rooms);
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Rooms could not be loaded.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadRooms();
    return () => {
      active = false;
    };
  }, []);

  return { rooms, setRooms, loading, error };
}