import { describe, expect, it } from "vitest";
import { studentUpdateSchema } from "@/lib/student-api-schema";

describe("student update API schema", () => {
  it("accepts guardian contact and an image data URL", () => {
    const result = studentUpdateSchema.safeParse({
      guardianPhone: "+91 98765 43210",
      documentImageDataUrl: "data:image/png;base64,aGVsbG8=",
    });

    expect(result.success).toBe(true);
  });

  it("accepts an empty image value to remove the current image", () => {
    const result = studentUpdateSchema.safeParse({
      documentImageDataUrl: "",
    });

    expect(result.success).toBe(true);
  });

  it("rejects non-image data URLs", () => {
    const result = studentUpdateSchema.safeParse({
      documentImageDataUrl: "data:text/html;base64,PGgxPk5vPC9oMT4=",
    });

    expect(result.success).toBe(false);
  });
});
