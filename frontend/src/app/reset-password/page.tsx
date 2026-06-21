"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema } from "@/lib/schemas";
import { CheckCircle, AlertTriangle, RefreshCw, KeyRound, Eye, EyeOff, Check, X } from "lucide-react";
import { z } from "zod";

type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

const checkPasswordStrength = (pass: string) => {
  const requirements = [
    { id: "length", label: "At least 8 characters", met: pass.length >= 8 },
    { id: "uppercase", label: "At least one uppercase letter", met: /[A-Z]/.test(pass) },
    { id: "lowercase", label: "At least one lowercase letter", met: /[a-z]/.test(pass) },
    { id: "number_special", label: "At least one number or special character", met: /[\d\W]/.test(pass) },
  ];

  const metCount = requirements.filter((r) => r.met).length;

  let label = "Very Weak";
  let color = "bg-slate-800";
  let textColor = "text-slate-500";

  if (pass.length === 0) {
    label = "Empty";
  } else if (metCount === 1) {
    label = "Very Weak";
    color = "bg-red-500";
    textColor = "text-red-400";
  } else if (metCount === 2) {
    label = "Weak";
    color = "bg-orange-500";
    textColor = "text-orange-400";
  } else if (metCount === 3) {
    label = "Medium";
    color = "bg-yellow-500";
    textColor = "text-yellow-400";
  } else if (metCount === 4) {
    label = "Strong";
    color = "bg-emerald-500";
    textColor = "text-emerald-400";
  }

  return { requirements, metCount, label, color, textColor };
};

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const passwordValue = watch("password", "");
  const strength = checkPasswordStrength(passwordValue);

  const onSubmit = async (data: ResetPasswordInput) => {
    if (!token) {
      setErrorMsg("Reset token is missing from the URL.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      });

      const resData = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        setErrorMsg(resData.message || "Failed to reset password. Token may be invalid or expired.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to connect to the password reset service.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-slate-800/80 bg-slate-900/40 p-8 shadow-2xl backdrop-blur-md text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h2 className="text-2xl font-bold text-rose-400">Invalid Link</h2>
        <p className="text-sm text-slate-400">The reset password token is missing or malformed. Please request a new link.</p>
        <button
          onClick={() => router.push("/dashboard")}
          className="w-full bg-slate-800 hover:bg-slate-700 text-white rounded-xl py-3 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-slate-500/50"
        >
          Back to Login
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-slate-800/80 bg-slate-900/40 p-8 shadow-2xl backdrop-blur-md text-center animate-blur-fade-up">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          <CheckCircle className="h-7 w-7" />
        </div>
        <h2 className="text-2xl font-bold text-emerald-400">Password Reset Complete</h2>
        <p className="text-sm text-slate-400">Your password has been reset successfully. You can now login with your new password.</p>
        <button
          onClick={() => router.push("/dashboard")}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-3 text-sm font-semibold transition-all shadow-lg shadow-emerald-500/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-8 rounded-3xl border border-slate-800/80 bg-slate-900/40 p-8 shadow-2xl backdrop-blur-md">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-lg shadow-emerald-500/20">
          <KeyRound className="h-7 w-7" />
        </div>
        <h2 className="mt-6 text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
          Reset Password
        </h2>
        <p className="mt-2 text-sm text-slate-400">Enter a secure new password for your account</p>
      </div>

      <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
        {errorMsg && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-400 text-center" role="alert">
            {errorMsg}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="reset-pass" className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                id="reset-pass"
                type={showPassword ? "text" : "password"}
                {...register("password")}
                placeholder="••••••••"
                aria-invalid={errors.password ? "true" : "false"}
                aria-describedby={errors.password ? "reset-pass-error" : undefined}
                className="w-full rounded-xl bg-slate-900 border border-slate-800/80 pl-4 pr-10 py-3 text-sm text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all"
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

            {/* Real-time Strength Checklist */}
            {passwordValue && (
              <div className="mt-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800/50 space-y-2">
                <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider">
                  <span className="text-slate-400">Password Strength:</span>
                  <span className={strength.textColor}>{strength.label}</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 h-1.5">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`h-full rounded-full transition-all duration-300 ${
                        step <= strength.metCount ? strength.color : "bg-slate-800"
                      }`}
                    />
                  ))}
                </div>
                <ul className="space-y-1 pt-1.5 border-t border-slate-800/40" aria-label="Password requirements checklist">
                  {strength.requirements.map((req) => (
                    <li key={req.id} className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      {req.met ? (
                        <Check className="h-3 w-3 text-emerald-400 shrink-0" />
                      ) : (
                        <X className="h-3 w-3 text-slate-600 shrink-0" />
                      )}
                      <span className={req.met ? "text-slate-300 line-through decoration-slate-600/55" : ""}>
                        {req.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {errors.password && (
              <p id="reset-pass-error" className="text-xs text-rose-400 mt-1">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="reset-confirm" className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                id="reset-confirm"
                type={showConfirmPassword ? "text" : "password"}
                {...register("confirmPassword")}
                placeholder="••••••••"
                aria-invalid={errors.confirmPassword ? "true" : "false"}
                aria-describedby={errors.confirmPassword ? "reset-confirm-error" : undefined}
                className="w-full rounded-xl bg-slate-900 border border-slate-800/80 pl-4 pr-10 py-3 text-sm text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer focus:outline-none"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p id="reset-confirm-error" className="text-xs text-rose-400 mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:opacity-50 transition-all shadow-lg cursor-pointer"
        >
          {loading ? (
            <RefreshCw className="h-5 w-5 animate-spin" />
          ) : (
            "Save Password"
          )}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <Suspense fallback={
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-emerald-400" />
          <p className="text-sm text-slate-400">Loading...</p>
        </div>
      }>
        <ResetPasswordContent />
      </Suspense>
    </div>
  );
}
