import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters.")
  .regex(/[a-z]/, "Add a lowercase letter.")
  .regex(/[A-Z]/, "Add an uppercase letter.")
  .regex(/[0-9]/, "Add a number.");

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
  rememberMe: z.boolean(),
});

export const registrationSchema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your full name.").max(80),
    libraryName: z.string().trim().min(2, "Enter your library name.").max(100),
    email: z.string().trim().email("Enter a valid email address."),
    phone: z
      .string()
      .trim()
      .regex(
        /^(?:\+91[ -]?)?[6-9]\d{9}$/,
        "Enter a valid Indian mobile number.",
      ),
    password: passwordSchema,
    confirmPassword: z.string(),
    acceptTerms: z.boolean(),
  })
  .refine((value) => value.acceptTerms, {
    path: ["acceptTerms"],
    message: "Accept the terms and privacy policy to continue.",
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export type LoginValues = z.infer<typeof loginSchema>;
export type RegistrationValues = z.infer<typeof registrationSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
export type PasswordValues = Pick<
  RegistrationValues,
  "password" | "confirmPassword"
>;
