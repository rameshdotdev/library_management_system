import { defaultTimeSlots, type TimeSlot } from "@/lib/seat-management";

export type DayHours = {
  closed: boolean;
  opensAt: string;
  closesAt: string;
};

export type LibrarySettings = {
  libraryName: string;
  logoDataUrl: string;
  contactEmail: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  timezone: string;
  currency: "INR";
  operatingHours: Record<string, DayHours>;
  receiptHeader: string;
  receiptFooter: string;
  receiptContact: string;
  receiptPrefix: string;
  startingReceiptNumber: number;
  receiptShowAddress: boolean;
  receiptShowContact: boolean;
  notifications: {
    membershipExpiry: boolean;
    feeDue: boolean;
    overduePayment: boolean;
    admissions: boolean;
    dailyCollection: boolean;
  };
  profileName: string;
  profileEmail: string;
  profilePhone: string;
};

export type TimeSlotPreference = TimeSlot & { active?: boolean };

export const weekDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export const demoSettings: LibrarySettings = {
  libraryName: "Reading Room",
  logoDataUrl: "",
  contactEmail: "hello@readingroom.in",
  phone: "+91 80 4567 8910",
  address: "24, Lake View Road",
  city: "Bengaluru",
  state: "Karnataka",
  postalCode: "560001",
  timezone: "Asia/Kolkata",
  currency: "INR",
  operatingHours: Object.fromEntries(
    weekDays.map((day) => [
      day,
      { closed: day === "Sunday", opensAt: "07:00", closesAt: "22:00" },
    ]),
  ),
  receiptHeader: "Thank you for studying with us",
  receiptFooter: "We appreciate your continued membership.",
  receiptContact: "hello@readingroom.in · +91 80 4567 8910",
  receiptPrefix: "RR",
  startingReceiptNumber: 1001,
  receiptShowAddress: true,
  receiptShowContact: true,
  notifications: {
    membershipExpiry: true,
    feeDue: true,
    overduePayment: true,
    admissions: true,
    dailyCollection: false,
  },
  profileName: "Admin Manager",
  profileEmail: "admin@readingroom.in",
  profilePhone: "+91 98765 40001",
};

export const settingsTimeSlots: TimeSlotPreference[] = defaultTimeSlots.map(
  (slot, index) => ({
    ...slot,
    name: ["Morning", "Evening", "Night", "Full Day"][index] ?? slot.name,
    active: true,
  }),
);

export function isLibrarySettings(value: unknown): value is LibrarySettings {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<LibrarySettings>;
  const operatingHours = item.operatingHours;
  const notifications = item.notifications;
  return (
    typeof item.libraryName === "string" &&
    typeof item.logoDataUrl === "string" &&
    typeof item.contactEmail === "string" &&
    typeof item.phone === "string" &&
    typeof item.address === "string" &&
    typeof item.city === "string" &&
    typeof item.state === "string" &&
    typeof item.postalCode === "string" &&
    typeof item.timezone === "string" &&
    item.currency === "INR" &&
    typeof operatingHours === "object" &&
    operatingHours !== null &&
    weekDays.every((day) => {
      const hours = operatingHours[day];
      return (
        typeof hours?.closed === "boolean" &&
        typeof hours.opensAt === "string" &&
        typeof hours.closesAt === "string"
      );
    }) &&
    typeof item.receiptHeader === "string" &&
    typeof item.receiptFooter === "string" &&
    typeof item.receiptContact === "string" &&
    typeof item.receiptPrefix === "string" &&
    typeof item.startingReceiptNumber === "number" &&
    typeof item.receiptShowAddress === "boolean" &&
    typeof item.receiptShowContact === "boolean" &&
    typeof notifications === "object" &&
    notifications !== null &&
    typeof notifications.membershipExpiry === "boolean" &&
    typeof notifications.feeDue === "boolean" &&
    typeof notifications.overduePayment === "boolean" &&
    typeof notifications.admissions === "boolean" &&
    typeof notifications.dailyCollection === "boolean" &&
    typeof item.profileName === "string" &&
    typeof item.profileEmail === "string" &&
    typeof item.profilePhone === "string"
  );
}

export function isTimeSlotPreferenceArray(
  value: unknown,
): value is TimeSlotPreference[] {
  return (
    Array.isArray(value) &&
    value.every(
      (slot) =>
        typeof slot?.id === "string" &&
        typeof slot?.name === "string" &&
        typeof slot?.startTime === "string" &&
        typeof slot?.endTime === "string" &&
        (slot.active === undefined || typeof slot.active === "boolean"),
    )
  );
}

export function makeDefaultDayHours(): DayHours {
  return { closed: false, opensAt: "07:00", closesAt: "22:00" };
}
