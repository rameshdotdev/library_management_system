const dashboardPath = "/dashboard";
const authPaths = new Set([
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/unauthorized",
]);

export function safeReturnUrl(value: string | null | undefined) {
  const candidate = value?.trim();

  if (!candidate) {
    return dashboardPath;
  }

  if (
    candidate.startsWith("//") ||
    candidate.includes("\\") ||
    /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(candidate)
  ) {
    return dashboardPath;
  }

  const normalized = candidate.startsWith("/") ? candidate : `/${candidate}`;

  try {
    const destination = new URL(normalized, "https://reading-room.invalid");
    if (
      destination.origin !== "https://reading-room.invalid" ||
      authPaths.has(destination.pathname)
    ) {
      return dashboardPath;
    }

    return (
      `${destination.pathname}${destination.search}${destination.hash}` ||
      dashboardPath
    );
  } catch {
    return dashboardPath;
  }
}
