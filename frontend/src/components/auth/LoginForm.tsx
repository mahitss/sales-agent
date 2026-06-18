import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { loginSchema } from "@/lib/schemas";
import { Building, Lock, Mail } from "lucide-react";

interface LoginFormProps {
  onSubmit: (data: z.infer<typeof loginSchema>) => void;
  authLoading: boolean;
  authError: string;
  onToggleView: () => void;
  onForgotPassword: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  authLoading,
  authError,
  onToggleView,
  onForgotPassword,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

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

      <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
        {authError && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400 text-center">
            {authError}
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-text">Email Address</label>
            <div className="relative mt-1">
              <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
              <input
                type="email"
                {...register("email")}
                placeholder="admin@company.com"
                className="w-full rounded-xl bg-slate-900 border border-slate-800/80 pl-11 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:border-emerald-500/50 focus:outline-none transition-all"
              />
            </div>
            {errors.email && (
              <p className="text-xs text-rose-400 mt-1">{errors.email.message}</p>
            )}
          </div>
          <div>
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-text">Password</label>
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative mt-1">
              <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
              <input
                type="password"
                {...register("password")}
                placeholder="••••••••"
                className="w-full rounded-xl bg-slate-900 border border-slate-800/80 pl-11 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:border-emerald-500/50 focus:outline-none transition-all"
              />
            </div>
            {errors.password && (
              <p className="text-xs text-rose-400 mt-1">{errors.password.message}</p>
            )}
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={authLoading}
            className="group relative flex w-full justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50 transition-all shadow-lg cursor-pointer"
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
          className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
        >
          Need a portal account? Register here
        </button>
      </div>
    </div>
  );
};
