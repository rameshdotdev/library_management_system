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
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return dashboardPath;
  }
  try {
    const destination = new URL(value, "https://reading-room.invalid");
    if (destination.origin !== "https://reading-room.invalid" || authPaths.has(destination.pathname)) {
      return dashboardPath;
    }
    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return dashboardPath;
  }
}