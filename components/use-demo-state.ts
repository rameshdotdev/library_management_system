"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

export function useDemoState<T>(
  key: string,
  initialValue: T,
  isValid: (value: unknown) => value is T,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState(initialValue);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const savedValue = window.localStorage.getItem(key);
        if (savedValue) {
          const parsed: unknown = JSON.parse(savedValue);
          if (isValid(parsed)) setValue(parsed);
        }
      } catch {
        // Invalid or unavailable browser storage falls back to the demo data.
      } finally {
        setReady(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isValid, key]);

  useEffect(() => {
    if (ready) window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, ready, value]);

  return [value, setValue];
}
