import type {
  AuthErrorBody,
  AuthMode,
  AuthUser,
  LoginRequest,
  RegisterRequest,
  RegistrationResponse,
} from "@/lib/auth/types";

const demoSessionKey = "reading-room-demo-session";

function getApiBaseUrl(): string {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();

  if (!configuredBaseUrl) {
    return "/api/v1";
  }

  if (configuredBaseUrl.includes("localhost:5000")) {
    return "/api/v1";
  }

  return configuredBaseUrl.replace(/\/+$/, "");
}

export const authMode: AuthMode =
  process.env.NEXT_PUBLIC_AUTH_MODE === "demo" ? "demo" : "api";

export class AuthServiceError extends Error {
  status: number;
  fieldErrors?: Record<string, string>;

  constructor(
    message: string,
    status = 0,
    fieldErrors?: Record<string, string>,
  ) {
    super(message);
    this.name = "AuthServiceError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const apiBaseUrl = getApiBaseUrl();

  if (!apiBaseUrl) {
    throw new AuthServiceError(
      "Authentication API is not configured. Set NEXT_PUBLIC_API_BASE_URL before using API mode.",
    );
  }

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new AuthServiceError(
      "The authentication service could not be reached.",
    );
  }

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const errorBody = body as AuthErrorBody | null;
    throw new AuthServiceError(
      errorBody?.message ?? "The request could not be completed.",
      response.status,
      errorBody?.fieldErrors,
    );
  }
  return body as T;
}

function demoUserFromEmail(email: string): AuthUser {
  return {
    id: "development-demo-user",
    email,
    fullName: email
      .split("@")[0]
      .replace(/[._-]+/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase()),
  };
}

function readDemoSession(): AuthUser | null {
  if (typeof window === "undefined" || authMode !== "demo") return null;
  try {
    const value: unknown = JSON.parse(
      window.sessionStorage.getItem(demoSessionKey) ?? "null",
    );
    if (
      value &&
      typeof value === "object" &&
      typeof (value as AuthUser).id === "string" &&
      typeof (value as AuthUser).fullName === "string" &&
      typeof (value as AuthUser).email === "string"
    ) {
      return value as AuthUser;
    }
  } catch {
    return null;
  }
  return null;
}

export async function login(input: LoginRequest): Promise<AuthUser> {
  if (authMode === "demo") {
    const user = demoUserFromEmail(input.email);
    window.sessionStorage.setItem(demoSessionKey, JSON.stringify(user));
    return user;
  }
  const response = await request<{ user: AuthUser }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return response.user;
}

export async function register(
  input: RegisterRequest,
): Promise<RegistrationResponse> {
  if (authMode === "demo") {
    return { nextStep: "verify-email" };
  }
  return request<RegistrationResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function logout(): Promise<void> {
  if (authMode === "demo") {
    window.sessionStorage.removeItem(demoSessionKey);
    return;
  }
  await request<void>("/auth/logout", { method: "POST" });
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  if (authMode === "demo") return readDemoSession();
  try {
    const response = await request<{ user: AuthUser }>("/auth/session", {
      method: "GET",
    });
    return response.user;
  } catch (error) {
    if (error instanceof AuthServiceError && error.status === 401) return null;
    throw error;
  }
}

export async function refreshSession(): Promise<AuthUser | null> {
  if (authMode === "demo") return readDemoSession();
  try {
    const response = await request<{ user: AuthUser }>("/auth/refresh", {
      method: "POST",
    });
    return response.user;
  } catch (error) {
    if (error instanceof AuthServiceError && error.status === 401) return null;
    throw error;
  }
}

export async function forgotPassword(email: string): Promise<void> {
  if (authMode === "demo") return;
  await request<void>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(
  token: string,
  password: string,
): Promise<void> {
  if (authMode === "demo") {
    throw new AuthServiceError(
      "Password reset is unavailable in demo mode. Connect the authentication API to use a reset link.",
    );
  }
  await request<void>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
}

export async function verifyEmail(token: string): Promise<void> {
  if (authMode === "demo") {
    throw new AuthServiceError(
      "Email verification is unavailable in demo mode. No email was sent.",
    );
  }
  await request<void>("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export async function resendVerificationEmail(email: string): Promise<void> {
  if (authMode === "demo") {
    throw new AuthServiceError(
      "Verification emails are not sent in demo mode.",
    );
  }
  await request<void>("/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}
