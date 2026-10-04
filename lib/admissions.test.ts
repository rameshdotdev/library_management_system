import { describe, expect, it } from "vitest";

import { generateAdmissionEmail, buildStudentFromAdmission } from "./admissions";

describe("admissions helpers", () => {
  it("derives a valid student email without asking for one in the admission form", () => {
    expect(generateAdmissionEmail("Aarav Sharma")).toBe("aarav.sharma@readingroom.local");
    expect(generateAdmissionEmail("Riya Nair")).toBe("riya.nair@readingroom.local");
  });

  it("builds a student record from the trimmed admission draft", () => {
    const student = buildStudentFromAdmission({
      id: "stu-100",
      name: "Aarav Sharma",
      phone: "+91 99999 12345",
      guardianName: "Rakesh Sharma",
      membershipName: "Standard",
      membershipEndsOn: "2026-12-31",
      monthlyFee: 1800,
      joinedOn: "2026-10-04",
      status: "Active",
      payments: [],
    });

    expect(student.email).toBe("aarav.sharma@readingroom.local");
    expect(student.guardianName).toBe("Rakesh Sharma");
    expect(student.membershipName).toBe("Standard");
  });
});
