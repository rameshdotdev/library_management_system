export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
};

export type AuthErrorBody = {
  message?: string;
  fieldErrors?: Record<string, string>;
};

export type LoginRequest = {
  email: string;
  password: string;
  rememberMe: boolean;
};

export type RegisterRequest = {
  fullName: string;
  libraryName: string;
  email: string;
  phone: string;
  password: string;
};

export type RegistrationResponse = {
  nextStep: "verify-email" | "onboarding" | "dashboard";
  user?: AuthUser;
};

export type AuthMode = "demo" | "api";