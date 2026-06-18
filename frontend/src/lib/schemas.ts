import { z } from "zod";

export const authSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().optional(),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const businessOnboardSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  website: z.string().min(1, "Website URL is required"),
  industry: z.string().min(1, "Industry is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
});

export const faqSchema = z.object({
  title: z.string().min(1, "Question is required"),
  content: z.string().min(1, "Answer is required"),
});

export const competitorUrlSchema = z.object({
  competitorUrl: z.string().url("Valid URL required"),
});

export const scraperUrlSchema = z.object({
  url: z.string().url("Valid URL required"),
});

export const connectChannelSchema = z.object({
  whatsappEnabled: z.boolean().optional(),
  instagramEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  whatsappApiKey: z.string().optional(),
  instagramAccountId: z.string().optional(),
  emailSmtp: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Please provide a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
});

export const onboardingSchema = businessOnboardSchema;

export const employeeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().optional(),
});