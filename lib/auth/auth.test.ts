import { afterEach, describe, expect, it, vi } from "vitest";

import { safeReturnUrl } from "@/lib/auth/return-url";

describe("authentication API integration", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("defaults to API mode unless demo is explicitly enabled", async () => {
    const original = process.env.NEXT_PUBLIC_AUTH_MODE;
    delete process.env.NEXT_PUBLIC_AUTH_MODE;

    const { authMode } = await import("@/lib/auth/service");
    expect(authMode).toBe("api");

    if (original === undefined) delete process.env.NEXT_PUBLIC_AUTH_MODE;
    else process.env.NEXT_PUBLIC_AUTH_MODE = original;
  });

  it("uses the same app API route when no external API base URL is configured", async () => {
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    process.env.NEXT_PUBLIC_AUTH_MODE = "api";

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          user: {
            id: "user_1",
            fullName: "Test User",
            email: "user@example.com",
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    vi.stubGlobal("fetch", fetchMock);

    const { login } = await import("@/lib/auth/service");
    await expect(
      login({
        email: "user@example.com",
        password: "Password123!",
        rememberMe: true,
      }),
    ).resolves.toMatchObject({
      email: "user@example.com",
      fullName: "Test User",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/auth/login",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("accepts safe internal redirect paths and rejects external destinations", () => {
    expect(safeReturnUrl("/dashboard")).toBe("/dashboard");
    expect(safeReturnUrl("/students?tab=active")).toBe("/students?tab=active");
    expect(safeReturnUrl("https://evil.example/steal")).toBe("/dashboard");
    expect(safeReturnUrl("//evil.example/steal")).toBe("/dashboard");
    expect(safeReturnUrl("/login")).toBe("/dashboard");
  });
});
