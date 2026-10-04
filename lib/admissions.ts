export type AdmissionStudentBase = {
  id: string;
  name: string;
  phone: string;
  guardianName: string;
  membershipName: string;
  membershipEndsOn: string;
  monthlyFee: number;
  joinedOn: string;
  status?: "Active" | "On hold" | "Archived";
  payments?: Array<{
    id: string;
    date: string;
    amount: number;
    method: string;
    reference: string;
    description: string;
  }>;
};

export function generateAdmissionEmail(name: string): string {
  const cleaned = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "") || "student";

  return `${cleaned}@readingroom.local`;
}

export function createStudentEmail(
  name: string,
  existingEmails: string[] = [],
): string {
  const base = generateAdmissionEmail(name);
  if (!existingEmails.includes(base)) {
    return base;
  }

  let candidate = base.replace(/@/, "+2@");
  let counter = 2;
  while (existingEmails.includes(candidate)) {
    candidate = base.replace(/@/, `+${counter}@`);
    counter += 1;
  }

  return candidate;
}

export function buildStudentFromAdmission(input: AdmissionStudentBase) {
  return {
    ...input,
    email: generateAdmissionEmail(input.name),
  };
}
