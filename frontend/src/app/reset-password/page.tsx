"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema } from "@/lib/schemas";
import { CheckCircle, AlertTriangle, RefreshCw, KeyRound } from "lucide-react";
import { z } from "zod";

type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

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
          className="w-full bg-slate-800 hover:bg-slate-700 text-white rounded-xl py-3 text-sm font-semibold transition-all"
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
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-3 text-sm font-semibold transition-all shadow-lg shadow-emerald-500/10"
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
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-400 text-center">
            {errorMsg}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">New Password</label>
            <input
              type="password"
              {...register("password")}
              placeholder="••••••••"
              className="mt-1 w-full rounded-xl bg-slate-900 border border-slate-800/80 px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all"
            />
            {errors.password && (
              <p className="text-xs text-rose-400 mt-1">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Confirm New Password</label>
            <input
              type="password"
              {...register("confirmPassword")}
              placeholder="••••••••"
              className="mt-1 w-full rounded-xl bg-slate-900 border border-slate-800/80 px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all"
            />
            {errors.confirmPassword && (
              <p className="text-xs text-rose-400 mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500 focus:outline-none disabled:opacity-50 transition-all shadow-lg cursor-pointer"
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
