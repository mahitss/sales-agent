import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { forgotPasswordSchema } from "@/lib/schemas";
import { KeyRound, Mail, CheckCircle } from "lucide-react";

interface ForgotPasswordFormProps {
  onSubmit: (data: z.infer<typeof forgotPasswordSchema>) => void;
  authLoading: boolean;
  authError: string;
  forgotSuccess: boolean;
  onBackToLogin: () => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onSubmit,
  authLoading,
  authError,
  forgotSuccess,
  onBackToLogin,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  return (
    <div className="w-full space-y-6">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-lg shadow-emerald-500/20">
          <KeyRound className="h-7 w-7" />
        </div>
        <h2 className="mt-6 text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
          Recover Password
        </h2>
        <p className="mt-2 text-sm text-muted-text">
          Enter your email address to receive password recovery link
        </p>
      </div>

      {forgotSuccess ? (
        <div className="mt-8 space-y-6 text-center animate-blur-fade-up">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <CheckCircle className="h-6 w-6" />
          </div>
          <p className="text-sm text-slate-300">
            If the email exists, a password reset link has been logged to the console.
          </p>
          <button
            onClick={onBackToLogin}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white rounded-xl py-3 text-sm font-semibold transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-500/50"
          >
            Back to Sign In
          </button>
        </div>
      ) : (
        <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
          {authError && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400 text-center" role="alert">
              {authError}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="forgot-email" className="text-xs font-semibold uppercase tracking-wider text-muted-text block mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
                <input
                  id="forgot-email"
                  type="email"
                  {...register("email")}
                  placeholder="admin@company.com"
                  aria-invalid={errors.email ? "true" : "false"}
                  aria-describedby={errors.email ? "forgot-email-error" : undefined}
                  className="w-full rounded-xl bg-slate-900 border border-slate-800/80 pl-11 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all"
                />
              </div>
              {errors.email && (
                <p id="forgot-email-error" className="text-xs text-rose-400 mt-1">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={authLoading}
              className="group relative flex w-full justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:opacity-50 transition-all shadow-lg cursor-pointer"
            >
              {authLoading ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
              ) : (
                "Request Reset Link"
              )}
            </button>
          </div>
        </form>
      )}

      {!forgotSuccess && (
        <div className="text-center">
          <button
            onClick={onBackToLogin}
            className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer focus:outline-none focus:underline"
          >
            Back to Sign In
          </button>
        </div>
      )}
    </div>
  );
};
