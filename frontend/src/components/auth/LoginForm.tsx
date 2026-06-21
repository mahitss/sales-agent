import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { loginSchema } from "@/lib/schemas";
import { Building, Lock, Mail, Eye, EyeOff } from "lucide-react";

interface LoginFormProps {
  onSubmit: (data: z.infer<typeof loginSchema>) => void;
  authLoading: boolean;
  authError: string;
  onToggleView: () => void;
  onForgotPassword: () => void;
  onGoogleSignIn?: () => void;
}

const GoogleIcon = () => (
  <svg className="mr-2 h-4 w-4 shrink-0" aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
    <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
  </svg>
);

export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  authLoading,
  authError,
  onToggleView,
  onForgotPassword,
  onGoogleSignIn,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full space-y-6">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-lg shadow-emerald-500/20">
          <Building className="h-7 w-7" />
        </div>
        <h2 className="mt-6 text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
          Welcome to Beacon AI
        </h2>
        <p className="mt-2 text-sm text-muted-text">
          Manage your AI Sales Agent and leads
        </p>
      </div>

      {onGoogleSignIn && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={onGoogleSignIn}
            disabled={authLoading}
            className="flex w-full items-center justify-center rounded-xl border border-slate-800/80 bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-800/50 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 disabled:opacity-50 transition-all shadow-sm cursor-pointer"
            aria-label="Continue with Google"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="relative flex items-center justify-center py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800/80"></div>
            </div>
            <span className="relative bg-slate-950 px-3 text-xs uppercase tracking-wider text-slate-500">
              Or continue with email
            </span>
          </div>
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        {authError && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400 text-center" role="alert">
            {authError}
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label htmlFor="login-email" className="text-xs font-semibold uppercase tracking-wider text-muted-text block mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
              <input
                id="login-email"
                type="email"
                {...register("email")}
                placeholder="admin@company.com"
                aria-invalid={errors.email ? "true" : "false"}
                aria-describedby={errors.email ? "login-email-error" : undefined}
                className="w-full rounded-xl bg-slate-900 border border-slate-800/80 pl-11 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all"
              />
            </div>
            {errors.email && (
              <p id="login-email-error" className="text-xs text-rose-400 mt-1">{errors.email.message}</p>
            )}
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="login-password" className="text-xs font-semibold uppercase tracking-wider text-muted-text">
                Password
              </label>
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer focus:outline-none focus:underline"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                {...register("password")}
                placeholder="••••••••"
                aria-invalid={errors.password ? "true" : "false"}
                aria-describedby={errors.password ? "login-password-error" : undefined}
                className="w-full rounded-xl bg-slate-900 border border-slate-800/80 pl-11 pr-10 py-3 text-sm text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>
            {errors.password && (
              <p id="login-password-error" className="text-xs text-rose-400 mt-1">{errors.password.message}</p>
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
              "Sign In"
            )}
          </button>
        </div>
      </form>

      <div className="text-center">
        <button
          onClick={onToggleView}
          className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer focus:outline-none focus:underline"
        >
          Need a portal account? Register here
        </button>
      </div>
    </div>
  );
};
